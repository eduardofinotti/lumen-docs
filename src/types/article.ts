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
  /** Até 7 autores na ordem do PubMed; mais de 6 indica que há outros (Vancouver usa "et al."). */
  authors: string[];
  journal: string;
  year: number;
  volume?: string;
  issue?: string;
  pages?: string;
  source: ArticleSource;
  evidence: EvidenceLevel;
  summary?: ArticleSummary;
}
