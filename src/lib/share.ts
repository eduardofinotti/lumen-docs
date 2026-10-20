import type { Article } from "@/types/article";
import type { Turn } from "@/types/search";
import { CLINICAL_DECISION_NOTE } from "./answer-markdown";
import { strengthText } from "./vancouver";

/** Acima disso o WhatsApp Web descarta o texto e manda só o link. */
const MAX_OPENING = 600;
const MAX_REFERENCES = 3;
const MAX_TITLE = 110;

const whatsappBold = (text: string) => text.replace(/\*\*(.+?)\*\*/g, "*$1*");

/** Números citados ([n]) num texto, na ordem e sem repetir. */
function citedNumbers(text: string): number[] {
  return [...new Set([...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])))];
}

function shortReference(n: number, a: Article): string {
  const source = [a.journal, a.year].filter(Boolean).join(" ");
  let title = a.title.replace(/\.$/, "");
  if (title.length > MAX_TITLE) title = `${title.slice(0, MAX_TITLE).replace(/\s+\S*$/, "")}…`;
  return `[${n}] ${title}.${source ? ` ${source}.` : ""} https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/${a.retracted ? " (artigo retratado)" : ""}`;
}

/**
 * Texto curto para mandar pelo WhatsApp: pergunta, conclusão, o primeiro parágrafo da resposta e só
 * os artigos citados nesse trecho, com link. A versão completa fica no "Copiar com referências".
 * Só o texto: nenhuma conversa fica aberta na internet.
 */
export function buildShareText(title: string, turn: Turn, siteUrl: string): string {
  const parts = [`*Pergunta:* ${turn.standaloneQuestion ?? title}`];
  if (turn.conclusion) {
    const strength = strengthText(turn);
    parts.push(`*Em resumo:* ${turn.conclusion.text}${strength ? `\n*Força da evidência:* ${strength}` : ""}`);
  }

  let opening = turn.answerMd.trim().split(/\n\s*\n/)[0] ?? "";
  if (opening.length > MAX_OPENING) opening = `${opening.slice(0, MAX_OPENING).replace(/\s+\S*$/, "")}…`;
  if (opening) parts.push(whatsappBold(opening));
  parts.push(CLINICAL_DECISION_NOTE);

  const references = citedNumbers(`${turn.conclusion?.text ?? ""} ${opening}`)
    .filter((n) => turn.sources[n - 1])
    .slice(0, MAX_REFERENCES)
    .map((n) => shortReference(n, turn.sources[n - 1]));
  if (references.length > 0) parts.push(`*Artigos citados*\n${references.join("\n")}`);

  parts.push(`Pesquisado no Lúmen: ${siteUrl}`);
  return parts.join("\n\n");
}

/** No celular, o menu de compartilhar do aparelho; no computador, o WhatsApp Web. */
export function shareTarget({ canShare, touch }: { canShare: boolean; touch: boolean }): "sistema" | "whatsapp" {
  return canShare && touch ? "sistema" : "whatsapp";
}
