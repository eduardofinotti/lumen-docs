import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { mockResults } from "@/lib/mocks/results";
import { createClient } from "@/lib/supabase/server";
import type { Article, SavedArticle } from "@/types/article";
import { getConversation } from "./conversations";
import { sourceRowToArticle, type SourceRow } from "./guards";

const ARTICLE_COLUMNS =
  "pmid, title, authors, journal, year, volume, issue, pages, pmcid, doi, evidence_label, summary_pt";

type ArticleRow = Omit<SourceRow, "position">;

function rowToArticle(row: ArticleRow): Article {
  return sourceRowToArticle({ ...row, position: 0 });
}

// ------------------------------------------------ Modo demonstração (cookie)

const DEMO_SAVED_COOKIE = "lumen-demo-salvos";
const DEMO_MAX_SAVED = 30;

interface DemoSavedEntry {
  pmid: string;
  searchId: string | null;
  savedAt: string;
}

function isDemoSaved(value: unknown): value is DemoSavedEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.pmid === "string" &&
    (v.searchId === null || typeof v.searchId === "string") &&
    typeof v.savedAt === "string"
  );
}

async function readDemoSaved(): Promise<DemoSavedEntry[]> {
  const raw = (await cookies()).get(DEMO_SAVED_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? parsed.filter(isDemoSaved) : [];
  } catch {
    return [];
  }
}

async function writeDemoSaved(entries: DemoSavedEntry[]) {
  (await cookies()).set(DEMO_SAVED_COOKIE, encodeURIComponent(JSON.stringify(entries.slice(0, DEMO_MAX_SAVED))), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

function mockArticle(pmid: string): Article | undefined {
  for (const result of Object.values(mockResults)) {
    const found = result.sources.find((a) => a.pmid === pmid);
    if (found) return found;
  }
  return undefined;
}

// ------------------------------------------------------------------ API

/** Lista de salvos, do mais recente para o mais antigo. */
export async function listSavedArticles(): Promise<SavedArticle[]> {
  const supabase = await createClient();

  if (!supabase) {
    const entries = await readDemoSaved();
    const saved = await Promise.all(
      entries.map(async (e) => {
        const article = mockArticle(e.pmid);
        if (!article) return null;
        const conversation = e.searchId ? await getConversation(e.searchId) : null;
        return { ...article, savedAt: e.savedAt, searchId: conversation?.id ?? null, question: conversation?.title ?? null };
      }),
    );
    return saved.filter((a): a is SavedArticle => a !== null);
  }

  const { data } = await supabase
    .from("saved_articles")
    .select(`${ARTICLE_COLUMNS}, created_at, search_id, searches (question)`)
    .order("created_at", { ascending: false })
    .returns<(ArticleRow & { created_at: string; search_id: string | null; searches: { question: string } | null })[]>();

  return (data ?? []).map((row) => ({
    ...rowToArticle(row),
    savedAt: row.created_at,
    searchId: row.search_id,
    question: row.searches?.question ?? null,
  }));
}

/** PMIDs salvos pelo médico, para marcar os cards. Memorizado por requisição. */
export const getSavedPmids = cache(async (): Promise<Set<string>> => {
  const supabase = await createClient();
  if (!supabase) return new Set((await readDemoSaved()).map((e) => e.pmid));

  const { data } = await supabase.from("saved_articles").select("pmid").returns<{ pmid: string }[]>();
  return new Set((data ?? []).map((r) => r.pmid));
});

/**
 * Salva ou remove um artigo. Ao salvar, os dados vêm das fontes da pesquisa (lidas pela RLS),
 * não do navegador: só dá para salvar artigo que apareceu numa pesquisa do próprio médico.
 */
export async function setSaved(pmid: string, searchId: string | null, save: boolean): Promise<boolean> {
  const supabase = await createClient();

  if (!supabase) {
    const others = (await readDemoSaved()).filter((e) => e.pmid !== pmid);
    if (save && !mockArticle(pmid)) return false;
    await writeDemoSaved(save ? [{ pmid, searchId, savedAt: new Date().toISOString() }, ...others] : others);
    return true;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  if (!save) {
    const { error } = await supabase.from("saved_articles").delete().eq("pmid", pmid);
    return !error;
  }

  if (!searchId) return false;
  const { data: source } = await supabase
    .from("sources")
    .select(ARTICLE_COLUMNS)
    .eq("search_id", searchId)
    .eq("pmid", pmid)
    .limit(1)
    .maybeSingle<ArticleRow>();
  if (!source) return false;

  // Já salvo (por outra resposta): não duplica nem dá erro.
  const { error } = await supabase
    .from("saved_articles")
    .upsert({ ...source, user_id: user.id, search_id: searchId }, { onConflict: "user_id,pmid", ignoreDuplicates: true });
  return !error;
}
