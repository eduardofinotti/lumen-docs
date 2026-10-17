export type EvidenceLevel =
  | "revisao-sistematica"
  | "ensaio-clinico-randomizado"
  | "coorte"
  | "caso-controle"
  | "relato-de-caso"
  | "diretriz"
  | "outro";

export type EvidenceStrength = "alta" | "media" | "baixa";

export type ArticleSource = "PubMed";

/** Resumo do artigo em português, nos quatro blocos fixos. */
export interface ArticleSummary {
  pergunta: string;
  metodo: string;
  resultado: string;
  limitacao: string;
}

export interface Article {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  source: ArticleSource;
  evidence: EvidenceLevel;
  summary?: ArticleSummary;
}
