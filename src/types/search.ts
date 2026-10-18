import type { Article } from "./article";

export type DateRange = "ultimo-ano" | "ultimos-5-anos" | "qualquer-data";

/** `no_evidence`: a busca no PubMed não trouxe artigos para a pergunta. */
export type SearchStatus = "pending" | "done" | "error" | "no_evidence";

/** Limite de perguntas por conversa (as que deram erro não contam). */
export const MAX_TURNS = 20;

/** Uma pergunta da conversa e sua resposta (`search_turns`). */
export interface Turn {
  id: string;
  position: number;
  question: string;
  /** Como o Lúmen entendeu a pergunta; null na primeira. */
  standaloneQuestion: string | null;
  status: SearchStatus;
  /** Resposta em markdown simples, com citações [n] que apontam para `sources[n-1]`. */
  answerMd: string;
  sources: Article[];
  createdAt: string;
}

/** Uma pesquisa: a primeira pergunta e as continuações (`searches`). */
export interface Conversation {
  id: string;
  /** A primeira pergunta. */
  title: string;
  dateRange: DateRange;
  createdAt: string;
  updatedAt: string;
  /** Na ordem de `position`. */
  turns: Turn[];
}

/** Item do histórico (sidebar e /historico). `status` é o da última pergunta. */
export interface SearchSummary {
  id: string;
  question: string;
  status: SearchStatus;
  updatedAt: string;
}
