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
  /** Ano de publicação; `null` quando o PubMed não informa. */
  year: number | null;
  volume?: string;
  issue?: string;
  pages?: string;
  /** Texto completo gratuito no PubMed Central, quando existe. */
  pmcid?: string;
  doi?: string;
  source: ArticleSource;
  evidence: EvidenceLevel;
  summary?: ArticleSummary;
}

/** Artigo na lista de salvos do médico. */
export interface SavedArticle extends Article {
  savedAt: string;
  /** Pesquisa de onde o artigo veio; null se ela foi apagada. */
  searchId: string | null;
  /** Primeira pergunta dessa pesquisa. */
  question: string | null;
}
