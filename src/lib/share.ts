import type { Turn } from "@/types/search";
import { CLINICAL_DECISION_NOTE } from "./answer-markdown";
import { referenceLines, strengthText } from "./vancouver";

/**
 * Texto para mandar pelo WhatsApp: o mesmo do "Copiar", com o negrito do WhatsApp (*assim*)
 * e o endereço do Lúmen no fim. Só o texto: nenhuma conversa fica aberta na internet.
 */
export function buildShareText(title: string, turn: Turn, siteUrl: string): string {
  const parts = [`*Pergunta:* ${turn.standaloneQuestion ?? title}`];
  if (turn.conclusion) {
    const strength = strengthText(turn);
    parts.push(`*Em resumo:* ${turn.conclusion.text}${strength ? `\n*Força da evidência:* ${strength}` : ""}`);
  }
  parts.push(turn.answerMd.trim().replace(/\*\*(.+?)\*\*/g, "*$1*"), CLINICAL_DECISION_NOTE);
  if (turn.sources.length > 0) parts.push(`*Referências*\n${referenceLines(turn)}`);
  parts.push(`Pesquisado no Lúmen: ${siteUrl}`);
  return parts.join("\n\n");
}

/** No celular, o menu de compartilhar do aparelho; no computador, o WhatsApp Web. */
export function shareTarget({ canShare, touch }: { canShare: boolean; touch: boolean }): "sistema" | "whatsapp" {
  return canShare && touch ? "sistema" : "whatsapp";
}
