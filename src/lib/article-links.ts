import type { Article } from "@/types/article";
import { pubmedUrl } from "./evidence";

/** Preprint do medRxiv: guardado com o identificador do Europe PMC ("PPR…") no lugar do PMID. */
export function isPreprint(article: Pick<Article, "pmid">): boolean {
  return /^PPR\d+$/.test(article.pmid);
}

function preprintUrl(article: Pick<Article, "pmid" | "doi">): string {
  return article.doi ? `https://doi.org/${article.doi}` : `https://europepmc.org/article/PPR/${article.pmid}`;
}

/** Página do artigo na fonte: PubMed, ou o medRxiv para preprint. */
export function articleUrl(article: Pick<Article, "pmid" | "doi">): string {
  return isPreprint(article) ? preprintUrl(article) : pubmedUrl(article.pmid);
}

/** Onde ler o artigo inteiro: PubMed Central quando é gratuito, senão a revista (DOI), senão o PubMed. */
export function fullTextUrl(article: Pick<Article, "pmid" | "pmcid" | "doi">): {
  href: string;
  label: "PubMed Central" | "Revista" | "PubMed" | "medRxiv";
} {
  if (isPreprint(article)) return { href: preprintUrl(article), label: "medRxiv" };
  if (article.pmcid) return { href: `https://pmc.ncbi.nlm.nih.gov/articles/${article.pmcid}/`, label: "PubMed Central" };
  if (article.doi) return { href: `https://doi.org/${article.doi}`, label: "Revista" };
  return { href: pubmedUrl(article.pmid), label: "PubMed" };
}
