import { isPreprint } from "@/lib/article-links";
import type { Article, ArticleSummary, EvidenceLevel } from "@/types/article";
import type { AnswerStrength, Conclusion, Feedback, FeedbackReason, SearchStatus } from "@/types/search";

const evidenceLevels: EvidenceLevel[] = [
  "revisao-sistematica",
  "ensaio-clinico-randomizado",
  "coorte",
  "caso-controle",
  "relato-de-caso",
  "diretriz",
  "diretriz-brasileira",
  "preprint",
  "outro",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSummary(value: unknown): value is ArticleSummary {
  return (
    isRecord(value) &&
    typeof value.pergunta === "string" &&
    typeof value.metodo === "string" &&
    typeof value.resultado === "string" &&
    typeof value.limitacao === "string"
  );
}

export function isArticle(value: unknown): value is Article {
  return (
    isRecord(value) &&
    typeof value.pmid === "string" &&
    typeof value.title === "string" &&
    Array.isArray(value.authors) &&
    value.authors.every((a) => typeof a === "string") &&
    typeof value.journal === "string" &&
    (typeof value.year === "number" || value.year === null) &&
    ["volume", "issue", "pages"].every((k) => value[k] === undefined || typeof value[k] === "string") &&
    (value.source === "PubMed" || value.source === "medRxiv") &&
    typeof value.evidence === "string" &&
    (evidenceLevels as string[]).includes(value.evidence) &&
    (value.summary === undefined || isSummary(value.summary))
  );
}

/** Lê a coluna jsonb `sources`, descartando itens fora do formato esperado. */
export function parseSources(value: unknown): Article[] {
  return Array.isArray(value) ? value.filter(isArticle) : [];
}

export function parseStatus(value: unknown): SearchStatus {
  return value === "pending" || value === "error" || value === "no_evidence" ? value : "done";
}

// ------------------------------------------- Tabela `sources` (Edge Function)

/** Linha de `sources`, gravada pela Edge Function `search`. */
export interface SourceRow {
  position: number;
  pmid: string;
  title: string;
  authors: string | null;
  journal: string | null;
  year: number | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  pmcid: string | null;
  doi: string | null;
  evidence_label: string | null;
  summary_pt: string | null;
  /** Ausente nas linhas de antes da 0007. */
  retracted?: boolean | null;
}

/** A função classifica com rótulos próprios; aqui viram os níveis da interface. */
const evidenceByLabel: Record<string, EvidenceLevel> = {
  "metanálise": "revisao-sistematica",
  "revisão sistemática": "revisao-sistematica",
  "ensaio clínico randomizado": "ensaio-clinico-randomizado",
  coorte: "coorte",
  "caso-controle": "caso-controle",
  "relato de caso": "relato-de-caso",
  diretriz: "diretriz",
  "diretriz brasileira": "diretriz-brasileira",
  preprint: "preprint",
};

const summaryLines: [Exclude<keyof ArticleSummary, "amostra">, RegExp][] = [
  ["pergunta", /^pergunta\s*:\s*(.+)$/im],
  ["metodo", /^m[ée]todo\s*:\s*(.+)$/im],
  ["resultado", /^resultado\s*:\s*(.+)$/im],
  ["limitacao", /^limita[çc][ãa]o\s*:\s*(.+)$/im],
];

/** "Pergunta: …\nMétodo: …\nResultado: …\nLimitação: …" → os quatro blocos; senão `undefined`. */
export function parseSummary(text: string | null): ArticleSummary | undefined {
  if (!text) return undefined;
  const plain = text.replace(/\*\*/g, "");
  const summary: Partial<ArticleSummary> = {};
  for (const [key, re] of summaryLines) {
    const value = plain.match(re)?.[1]?.trim();
    if (!value) return undefined;
    summary[key] = value;
  }
  // Linha opcional (resumos antigos não têm): só um número inteiro, com ou sem ponto de milhar.
  const sample = plain.match(/^amostra\s*:\s*(\d{1,3}(?:\.\d{3})+|\d+)(?![\d.,]|\s*a\s*\d)/im)?.[1];
  const amostra = sample ? Number(sample.replace(/\./g, "")) : 0;
  if (amostra > 0) summary.amostra = amostra;
  return summary as ArticleSummary;
}

export function sourceRowToArticle(row: SourceRow): Article {
  return {
    pmid: row.pmid,
    title: row.title,
    authors: row.authors ? row.authors.split("; ").filter(Boolean) : [],
    journal: row.journal ?? "",
    year: row.year,
    volume: row.volume ?? undefined,
    issue: row.issue ?? undefined,
    pages: row.pages ?? undefined,
    pmcid: row.pmcid ?? undefined,
    doi: row.doi ?? undefined,
    source: isPreprint(row) ? "medRxiv" : "PubMed",
    evidence: evidenceByLabel[row.evidence_label?.toLowerCase() ?? ""] ?? "outro",
    summary: parseSummary(row.summary_pt),
    retracted: row.retracted === true,
  };
}

const strengths: AnswerStrength[] = ["alta", "moderada", "baixa", "insuficiente"];

/** Colunas `conclusion`, `evidence_strength` e `evidence_reason` de `search_turns`. */
export function parseConclusion(
  text: string | null,
  strength: string | null,
  reason: string | null,
): Conclusion | null {
  if (!text?.trim()) return null;
  const known = strengths.find((s) => s === strength) ?? null;
  return { text: text.trim(), strength: known, reason: known ? (reason?.trim() || null) : null };
}

export const feedbackReasons: FeedbackReason[] = ["fora-do-tema", "confusa", "faltou-evidencia", "outro"];

export function isFeedbackReason(value: unknown): value is FeedbackReason {
  return typeof value === "string" && (feedbackReasons as string[]).includes(value);
}

/** Linha de `turn_feedback` do próprio médico (a RLS só devolve a dele). */
export function parseFeedback(row: { helpful: boolean; reason: string | null } | undefined): Feedback | null {
  if (!row) return null;
  return { helpful: row.helpful, reason: !row.helpful && isFeedbackReason(row.reason) ? row.reason : null };
}
