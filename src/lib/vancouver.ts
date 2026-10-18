import type { Article } from "@/types/article";
import type { Turn } from "@/types/search";
import { CLINICAL_DECISION_NOTE, markdownToPlainText } from "./answer-markdown";

/**
 * Referência no estilo Vancouver:
 * "Knowler WC, Barrett-Connor E, ..., et al. Título. N Engl J Med. 2002;346(6):393-403. PMID: 11832527."
 */
export function formatVancouver(article: Article): string {
  const authors =
    article.authors.length > 6
      ? `${article.authors.slice(0, 6).join(", ")}, et al.`
      : `${article.authors.join(", ")}.`;

  let locator = article.year ? `${article.year}` : "";
  if (article.volume) {
    locator += `${locator ? ";" : ""}${article.volume}`;
    if (article.issue) locator += `(${article.issue})`;
    if (article.pages) locator += `:${article.pages}`;
  }

  const title = article.title.replace(/\.$/, "");
  return [authors, `${title}.`, `${article.journal}.`, locator && `${locator}.`, `PMID: ${article.pmid}.`]
    .filter(Boolean)
    .join(" ");
}

/**
 * Texto copiado por "Copiar com referências": pergunta, resposta, nota final e referências.
 * Numa continuação, a pergunta é a completa ("e na grave?" sozinho não faz sentido fora da conversa).
 */
export function buildCopyText(title: string, turn: Turn): string {
  const parts = [
    `Pergunta: ${turn.standaloneQuestion ?? title}`,
    markdownToPlainText(turn.answerMd),
    CLINICAL_DECISION_NOTE,
  ];
  if (turn.sources.length > 0) {
    const refs = turn.sources.map((a, i) => `${i + 1}. ${formatVancouver(a)}`).join("\n");
    parts.push(`Referências\n${refs}`);
  }
  return parts.join("\n\n");
}
