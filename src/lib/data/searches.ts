import "server-only";

import { FunctionsHttpError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { withoutClinicalNote } from "@/lib/answer-markdown";
import { fromApiDateRange, isDateRange, toApiDateRange } from "@/lib/date-range";
import { mockResultKeyFor, mockResults, type MockResultKey } from "@/lib/mocks/results";
import { demoSeedSearches, type DemoSearchEntry } from "@/lib/mocks/searches";
import { createClient } from "@/lib/supabase/server";
import type { DateRange, Search, SearchSummary } from "@/types/search";
import { parseStatus, sourceRowToArticle, type SourceRow } from "./guards";

// ------------------------------------------------ Modo demonstração (cookie)

const DEMO_SEARCHES_COOKIE = "lumen-demo-pesquisas";
const DEMO_MAX_SEARCHES = 20;

function isMockResultKey(value: unknown): value is MockResultKey {
  return typeof value === "string" && value in mockResults;
}

function isDemoEntry(value: unknown): value is DemoSearchEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.question === "string" &&
    typeof v.dateRange === "string" &&
    isDateRange(v.dateRange) &&
    typeof v.createdAt === "string" &&
    isMockResultKey(v.resultKey)
  );
}

async function readDemoEntries(): Promise<DemoSearchEntry[]> {
  const raw = (await cookies()).get(DEMO_SEARCHES_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? parsed.filter(isDemoEntry) : [];
  } catch {
    return [];
  }
}

function demoEntryToSearch(entry: DemoSearchEntry): Search {
  const result = mockResults[entry.resultKey];
  return {
    id: entry.id,
    question: entry.question,
    status: "done",
    dateRange: entry.dateRange,
    answerMd: result.answerMd,
    sources: result.sources,
    createdAt: entry.createdAt,
  };
}

async function allDemoEntries(): Promise<DemoSearchEntry[]> {
  return [...(await readDemoEntries()), ...demoSeedSearches];
}

// ------------------------------------------------------------- Supabase

interface SearchRow {
  id: string;
  question: string;
  status: string;
  date_range: string | null;
  answer_md: string | null;
  created_at: string;
  sources: SourceRow[] | null;
}

function rowToSearch(row: SearchRow): Search {
  return {
    id: row.id,
    question: row.question,
    status: parseStatus(row.status),
    dateRange: fromApiDateRange(row.date_range),
    answerMd: withoutClinicalNote(row.answer_md ?? ""),
    sources: [...(row.sources ?? [])].sort((a, b) => a.position - b.position).map(sourceRowToArticle),
    createdAt: row.created_at,
  };
}

// ------------------------------------------------------------------ API

/** Histórico do usuário, do mais recente para o mais antigo. */
export const listSearches = cache(async (limit = 50): Promise<SearchSummary[]> => {
  const supabase = await createClient();
  if (!supabase) {
    return (await allDemoEntries()).slice(0, limit).map((e) => ({
      id: e.id,
      question: e.question,
      status: "done",
      createdAt: e.createdAt,
    }));
  }

  const { data } = await supabase
    .from("searches")
    .select("id, question, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<Pick<SearchRow, "id" | "question" | "status" | "created_at">[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    question: row.question,
    status: parseStatus(row.status),
    createdAt: row.created_at,
  }));
});

export const getSearch = cache(async (id: string): Promise<Search | null> => {
  const supabase = await createClient();
  if (!supabase) {
    const entry = (await allDemoEntries()).find((e) => e.id === id);
    return entry ? demoEntryToSearch(entry) : null;
  }

  const { data } = await supabase
    .from("searches")
    .select(
      "id, question, status, date_range, answer_md, created_at, " +
        "sources (position, pmid, title, authors, journal, year, volume, issue, pages, evidence_label, summary_pt)",
    )
    .eq("id", id)
    .maybeSingle<SearchRow>();

  return data ? rowToSearch(data) : null;
});

export type CreateSearchResult = { ok: true; id: string } | { ok: false; error: string };

const GENERIC_ERROR = "Não conseguimos concluir a pesquisa. Tente de novo em instantes.";

/** Corpo de resposta da Edge Function `search` (sucesso ou erro). */
interface SearchFunctionBody {
  searchId?: string | null;
  error?: string;
}

/**
 * Faz a pesquisa e devolve o id. Com Supabase, chama a Edge Function `search`
 * (PubMed + síntese), que grava a pesquisa e debita o crédito. Sem Supabase,
 * registra um resultado fictício no cookie de demonstração.
 */
export async function createSearch(question: string, dateRange: DateRange): Promise<CreateSearchResult> {
  const supabase = await createClient();

  if (!supabase) {
    const entry: DemoSearchEntry = {
      id: crypto.randomUUID(),
      question,
      dateRange,
      createdAt: new Date().toISOString(),
      resultKey: mockResultKeyFor(question),
    };
    const entries = [entry, ...(await readDemoEntries())].slice(0, DEMO_MAX_SEARCHES);
    (await cookies()).set(DEMO_SEARCHES_COOKIE, encodeURIComponent(JSON.stringify(entries)), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return { ok: true, id: entry.id };
  }

  const { data, error } = await supabase.functions.invoke<SearchFunctionBody>("search", {
    body: { question, dateRange: toApiDateRange(dateRange) },
  });

  if (error) {
    // A função responde com { error } em pt-BR (sem crédito, recusa, falha); repassa essa mensagem.
    if (error instanceof FunctionsHttpError) {
      const body: unknown = await error.context.json().catch(() => null);
      if (isFunctionBody(body) && body.error) return { ok: false, error: body.error };
    }
    console.error("[Lúmen] falha ao chamar a função search", error);
    return { ok: false, error: GENERIC_ERROR };
  }

  return data?.searchId ? { ok: true, id: data.searchId } : { ok: false, error: GENERIC_ERROR };
}

function isFunctionBody(value: unknown): value is SearchFunctionBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
