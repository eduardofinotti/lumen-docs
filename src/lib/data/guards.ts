import type { Article, ArticleSummary, EvidenceLevel } from "@/types/article";
import type { SearchStatus } from "@/types/search";

const evidenceLevels: EvidenceLevel[] = [
  "revisao-sistematica",
  "ensaio-clinico-randomizado",
  "coorte",
  "caso-controle",
  "relato-de-caso",
  "diretriz",
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
    typeof value.year === "number" &&
    ["volume", "issue", "pages"].every((k) => value[k] === undefined || typeof value[k] === "string") &&
    value.source === "PubMed" &&
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
  return value === "pending" || value === "error" ? value : "done";
}
