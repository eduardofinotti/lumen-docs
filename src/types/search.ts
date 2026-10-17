import type { Article } from "./article";

export type DateRange = "ultimo-ano" | "ultimos-5-anos" | "qualquer-data";

/** `no_evidence`: a busca no PubMed não trouxe artigos para a pergunta. */
export type SearchStatus = "pending" | "done" | "error" | "no_evidence";

/** Linha de `searches` no Supabase, em camelCase. */
export interface Search {
  id: string;
  question: string;
  status: SearchStatus;
  dateRange: DateRange;
  /** Resposta em markdown simples, com citações [n] que apontam para `sources[n-1]`. */
  answerMd: string;
  sources: Article[];
  createdAt: string;
}

/** Item do histórico (sidebar e /historico): sem a resposta completa. */
export type SearchSummary = Pick<Search, "id" | "question" | "status" | "createdAt">;
