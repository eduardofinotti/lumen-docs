import "server-only";

import { FunctionsHttpError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { withoutClinicalNote } from "@/lib/answer-markdown";
import { fromApiDateRange, isDateRange, toApiDateRange } from "@/lib/date-range";
import { mockResultKeyFor, mockResults, type MockResultKey } from "@/lib/mocks/results";
import { demoSeedConversations, type DemoConversationEntry, type DemoTurnEntry } from "@/lib/mocks/searches";
import { createClient } from "@/lib/supabase/server";
import type { Conversation, DateRange, SearchSummary, Turn } from "@/types/search";
import { parseConclusion, parseFeedback, parseStatus, sourceRowToArticle, type SourceRow } from "./guards";
import { effectiveStatus } from "./turn-status";

export type RunResult = { ok: true; id: string; turnId: string } | { ok: false; error: string };

const GENERIC_ERROR = "Não conseguimos concluir a pesquisa. Tente de novo em instantes.";

// ------------------------------------------------ Modo demonstração (cookie)

const DEMO_SEARCHES_COOKIE = "lumen-demo-pesquisas";
// O cookie tem limite de ~4 KB: poucas conversas, guardando só referências aos mocks.
const DEMO_MAX_CONVERSATIONS = 6;

function isMockResultKey(value: unknown): value is MockResultKey {
  return typeof value === "string" && value in mockResults;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDemoTurn(value: unknown): value is DemoTurnEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.question === "string" &&
    (value.standaloneQuestion === null || typeof value.standaloneQuestion === "string") &&
    typeof value.createdAt === "string" &&
    isMockResultKey(value.resultKey)
  );
}

function isDemoConversation(value: unknown): value is DemoConversationEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.dateRange === "string" &&
    isDateRange(value.dateRange) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.turns) &&
    value.turns.length > 0 &&
    value.turns.every(isDemoTurn)
  );
}

async function readDemoEntries(): Promise<DemoConversationEntry[]> {
  const raw = (await cookies()).get(DEMO_SEARCHES_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? parsed.filter(isDemoConversation) : [];
  } catch {
    return [];
  }
}

async function writeDemoEntries(entries: DemoConversationEntry[]) {
  (await cookies()).set(
    DEMO_SEARCHES_COOKIE,
    encodeURIComponent(JSON.stringify(entries.slice(0, DEMO_MAX_CONVERSATIONS))),
    { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 },
  );
}

/** Conversas do cookie mais os exemplos fixos; uma continuação de exemplo vai para o cookie. */
async function allDemoEntries(): Promise<DemoConversationEntry[]> {
  const stored = await readDemoEntries();
  const ids = new Set(stored.map((e) => e.id));
  return [...stored, ...demoSeedConversations.filter((e) => !ids.has(e.id))].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

function demoEntryToConversation(entry: DemoConversationEntry): Conversation {
  return {
    id: entry.id,
    title: entry.turns[0].question,
    dateRange: entry.dateRange,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    turns: entry.turns.map((t, i) => {
      const result = mockResults[t.resultKey];
      return {
        id: t.id,
        position: i + 1,
        question: t.question,
        standaloneQuestion: t.standaloneQuestion,
        status: "done",
        answerMd: result.answerMd,
        conclusion: result.conclusion,
        sources: result.sources,
        // A demonstração não guarda votos.
        feedback: null,
        createdAt: t.createdAt,
      };
    }),
  };
}

async function createDemoConversation(question: string, dateRange: DateRange): Promise<RunResult> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const turn: DemoTurnEntry = {
    id: crypto.randomUUID(),
    question,
    standaloneQuestion: null,
    resultKey: mockResultKeyFor(question),
    createdAt: now,
  };
  await writeDemoEntries([{ id, dateRange, createdAt: now, updatedAt: now, turns: [turn] }, ...(await readDemoEntries())]);
  return { ok: true, id, turnId: turn.id };
}

async function continueDemoConversation(searchId: string, question: string): Promise<RunResult> {
  const entry = (await allDemoEntries()).find((e) => e.id === searchId);
  if (!entry) return { ok: false, error: "Pesquisa não encontrada." };
  const now = new Date().toISOString();
  // Sem roteador na demonstração: pergunta sem mock próprio "reaproveita" a resposta anterior.
  const key = mockResultKeyFor(question);
  const turn: DemoTurnEntry = {
    id: crypto.randomUUID(),
    question,
    standaloneQuestion: question,
    resultKey: key === "demonstracao" ? entry.turns[entry.turns.length - 1].resultKey : key,
    createdAt: now,
  };
  const updated = { ...entry, updatedAt: now, turns: [...entry.turns, turn] };
  const others = (await readDemoEntries()).filter((e) => e.id !== searchId);
  await writeDemoEntries([updated, ...others]);
  return { ok: true, id: searchId, turnId: turn.id };
}

// ------------------------------------------------------------- Supabase

interface TurnRow {
  id: string;
  position: number;
  question: string;
  standalone_question: string | null;
  status: string;
  answer_md: string | null;
  conclusion: string | null;
  evidence_strength: string | null;
  evidence_reason: string | null;
  created_at: string;
  sources: SourceRow[] | null;
  turn_feedback: { helpful: boolean; reason: string | null }[] | null;
}

interface ConversationRow {
  id: string;
  question: string;
  date_range: string | null;
  created_at: string;
  updated_at: string;
  search_turns: TurnRow[] | null;
}

const CONVERSATION_SELECT =
  "id, question, date_range, created_at, updated_at, " +
  "search_turns (id, position, question, standalone_question, status, answer_md, " +
  "conclusion, evidence_strength, evidence_reason, created_at, " +
  "sources (position, pmid, title, authors, journal, year, volume, issue, pages, pmcid, doi, evidence_label, summary_pt, retracted), " +
  "turn_feedback (helpful, reason))";

function rowToTurn(row: TurnRow): Turn {
  return {
    id: row.id,
    position: row.position,
    question: row.question,
    standaloneQuestion: row.position > 1 ? row.standalone_question : null,
    status: effectiveStatus(parseStatus(row.status), row.created_at),
    answerMd: withoutClinicalNote(row.answer_md ?? ""),
    conclusion: parseConclusion(row.conclusion, row.evidence_strength, row.evidence_reason),
    sources: [...(row.sources ?? [])].sort((a, b) => a.position - b.position).map(sourceRowToArticle),
    feedback: parseFeedback(row.turn_feedback?.[0]),
    createdAt: row.created_at,
  };
}

function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    title: row.question,
    dateRange: fromApiDateRange(row.date_range),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    turns: [...(row.search_turns ?? [])].sort((a, b) => a.position - b.position).map(rowToTurn),
  };
}

/** Chama a Edge Function `search` e traduz a resposta. */
async function invokeSearch(body: Record<string, string>): Promise<RunResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: GENERIC_ERROR };

  const { data, error } = await supabase.functions.invoke<SearchFunctionBody>("search", { body });
  if (!error) {
    return data?.searchId && data.turnId ? { ok: true, id: data.searchId, turnId: data.turnId } : { ok: false, error: GENERIC_ERROR };
  }

  if (error instanceof FunctionsHttpError) {
    const reply: unknown = await error.context.json().catch(() => null);
    if (isFunctionBody(reply)) {
      // A pergunta virou um turno com erro (crédito devolvido): abre a conversa, que mostra "Tentar de novo".
      if (reply.searchId && reply.turnId) return { ok: true, id: reply.searchId, turnId: reply.turnId };
      if (reply.error) return { ok: false, error: reply.error };
    }
  }
  console.error("[Lúmen] falha ao chamar a função search", error);
  return { ok: false, error: GENERIC_ERROR };
}

/** Corpo de resposta da Edge Function `search` (sucesso ou erro). */
interface SearchFunctionBody {
  searchId?: string | null;
  turnId?: string | null;
  error?: string;
}

function isFunctionBody(value: unknown): value is SearchFunctionBody {
  return isRecord(value);
}

// ------------------------------------------------------------------ API

/** Histórico do usuário, da conversa com atividade mais recente para a mais antiga. */
export const listConversations = cache(async (limit = 50): Promise<SearchSummary[]> => {
  const supabase = await createClient();
  if (!supabase) {
    return (await allDemoEntries()).slice(0, limit).map((e) => ({
      id: e.id,
      question: e.turns[0].question,
      status: "done",
      updatedAt: e.updatedAt,
    }));
  }

  const { data } = await supabase
    .from("searches")
    .select("id, question, updated_at, search_turns (status, position, created_at)")
    .order("updated_at", { ascending: false })
    .order("position", { referencedTable: "search_turns", ascending: false })
    .limit(1, { referencedTable: "search_turns" })
    .limit(limit)
    .returns<{ id: string; question: string; updated_at: string; search_turns: { status: string; created_at: string }[] | null }[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    question: row.question,
    status: row.search_turns?.[0]
      ? effectiveStatus(parseStatus(row.search_turns[0].status), row.search_turns[0].created_at)
      : "done",
    updatedAt: row.updated_at,
  }));
});

export const getConversation = cache(async (id: string): Promise<Conversation | null> => {
  const supabase = await createClient();
  if (!supabase) {
    const entry = (await allDemoEntries()).find((e) => e.id === id);
    return entry ? demoEntryToConversation(entry) : null;
  }

  const { data } = await supabase
    .from("searches")
    .select(CONVERSATION_SELECT)
    .eq("id", id)
    .maybeSingle<ConversationRow>();
  return data ? rowToConversation(data) : null;
});

/** Uma resposta e a conversa dela (para a versão de impressão). */
export async function getTurn(turnId: string): Promise<{ conversation: Conversation; turn: Turn } | null> {
  const supabase = await createClient();
  let conversationId: string | undefined;

  if (!supabase) {
    conversationId = (await allDemoEntries()).find((e) => e.turns.some((t) => t.id === turnId))?.id;
  } else {
    const { data } = await supabase
      .from("search_turns")
      .select("search_id")
      .eq("id", turnId)
      .maybeSingle<{ search_id: string }>();
    conversationId = data?.search_id;
  }
  if (!conversationId) return null;

  const conversation = await getConversation(conversationId);
  const turn = conversation?.turns.find((t) => t.id === turnId);
  return conversation && turn ? { conversation, turn } : null;
}

/** Primeira pergunta: cria a conversa. */
export async function createConversation(question: string, dateRange: DateRange): Promise<RunResult> {
  if (!(await createClient())) return createDemoConversation(question, dateRange);
  return invokeSearch({ question, dateRange: toApiDateRange(dateRange) });
}

/** Continuação, ou nova tentativa de uma pergunta que deu erro (`retryTurnId`). */
export async function continueConversation(
  searchId: string,
  question: string,
  retryTurnId?: string,
): Promise<RunResult> {
  if (!(await createClient())) return continueDemoConversation(searchId, question);
  return invokeSearch(retryTurnId ? { searchId, question, retryTurnId } : { searchId, question });
}
