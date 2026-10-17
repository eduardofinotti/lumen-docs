import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { DEFAULT_DATE_RANGE, isDateRange } from "@/lib/date-range";
import { mockResultKeyFor, mockResults, type MockResultKey } from "@/lib/mocks/results";
import { demoSeedSearches, type DemoSearchEntry } from "@/lib/mocks/searches";
import { createClient } from "@/lib/supabase/server";
import type { DateRange, Search, SearchSummary } from "@/types/search";
import { parseSources, parseStatus } from "./guards";

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
  sources: unknown;
  created_at: string;
}

function rowToSearch(row: SearchRow): Search {
  return {
    id: row.id,
    question: row.question,
    status: parseStatus(row.status),
    dateRange: row.date_range && isDateRange(row.date_range) ? row.date_range : DEFAULT_DATE_RANGE,
    answerMd: row.answer_md ?? "",
    sources: parseSources(row.sources),
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
    .select("id, question, status, date_range, answer_md, sources, created_at")
    .eq("id", id)
    .maybeSingle<SearchRow>();

  return data ? rowToSearch(data) : null;
});

/**
 * Registra uma pesquisa e devolve o id. Nesta fase a resposta é sempre um mock:
 * a busca real (PubMed + síntese) entra com o backend.
 */
export async function createSearch(question: string, dateRange: DateRange): Promise<string | null> {
  const resultKey = mockResultKeyFor(question);
  const result = mockResults[resultKey];
  const supabase = await createClient();

  if (!supabase) {
    const entry: DemoSearchEntry = {
      id: crypto.randomUUID(),
      question,
      dateRange,
      createdAt: new Date().toISOString(),
      resultKey,
    };
    const entries = [entry, ...(await readDemoEntries())].slice(0, DEMO_MAX_SEARCHES);
    (await cookies()).set(DEMO_SEARCHES_COOKIE, encodeURIComponent(JSON.stringify(entries)), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return entry.id;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("searches")
    .insert({
      user_id: user.id,
      question,
      date_range: dateRange,
      status: "done",
      answer_md: result.answerMd,
      sources: result.sources,
    })
    .select("id")
    .single<{ id: string }>();

  return error ? null : data.id;
}
