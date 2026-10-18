import type { Article } from "@/types/article";
import { pubmedUrl } from "./evidence";

/** Onde ler o artigo inteiro: PubMed Central quando é gratuito, senão a revista (DOI), senão o PubMed. */
export function fullTextUrl(article: Pick<Article, "pmid" | "pmcid" | "doi">): {
  href: string;
  label: "PubMed Central" | "Revista" | "PubMed";
} {
  if (article.pmcid) return { href: `https://pmc.ncbi.nlm.nih.gov/articles/${article.pmcid}/`, label: "PubMed Central" };
  if (article.doi) return { href: `https://doi.org/${article.doi}`, label: "Revista" };
  return { href: pubmedUrl(article.pmid), label: "PubMed" };
}
