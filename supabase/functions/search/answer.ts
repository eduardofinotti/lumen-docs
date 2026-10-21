// Lúmen · leitura da síntese e do XML do PubMed (funções puras, testadas com vitest)

export type EvidenceStrength = "alta" | "moderada" | "baixa" | "insuficiente";

const STRENGTHS: EvidenceStrength[] = ["alta", "moderada", "baixa", "insuficiente"];

/**
 * A síntese abre com duas linhas fixas:
 *   Em resumo: <uma frase>
 *   Força da evidência: <Alta|Moderada|Baixa|Insuficiente> — <motivo curto>
 * Separa esse bloco do resto. Sem ele (ou fora do formato), a resposta segue inteira e sem conclusão.
 */
export function splitConclusion(text: string): {
  conclusion: string | null;
  strength: EvidenceStrength | null;
  reason: string | null;
  body: string;
} {
  const none = { conclusion: null, strength: null, reason: null, body: text };
  const [head, ...rest] = text.trim().split(/\n\s*\n/);
  const lines = head.replace(/\*\*/g, "").split("\n").map((l) => l.trim());
  const conclusion = lines[0]?.match(/^em resumo\s*:\s*(.+)$/i)?.[1]?.trim();
  if (!conclusion || rest.length === 0) return none;

  // A força às vezes vem num parágrafo próprio, depois de uma linha em branco.
  const forceLine = /^for[çc]a da evid[êe]ncia\s*:\s*(.+)$/i;
  let forceText = lines[1];
  if (!forceText && rest.length > 1) {
    const next = rest[0].replace(/\*\*/g, "").trim();
    if (forceLine.test(next) && !next.includes("\n")) {
      forceText = next;
      rest.shift();
    }
  }
  const force = forceText?.match(forceLine)?.[1]?.trim() ?? "";
  const [label, ...why] = force.split(/\s+[—–-]\s+/);
  const strength = STRENGTHS.find((s) => s === label?.toLowerCase()) ?? null;
  const reason = strength && why.length > 0 ? why.join(" — ").trim() : null;
  return { conclusion, strength, reason, body: rest.join("\n\n") };
}

/** Artigo retratado: tipo "Retracted Publication" ou aviso "RetractionIn" no bloco do PubMed. */
export function isRetracted(block: string): boolean {
  return /<PublicationType[^>]*>Retracted Publication<\/PublicationType>/i.test(block) ||
    /<CommentsCorrections[^>]*RefType="RetractionIn"/.test(block);
}

/** O XML do PubMed traz acentos como entidades ("K&#xf8;ber"). */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Tipos de publicação; o espaço depois do nome evita casar com a tag <PublicationTypeList>. */
export function publicationTypesOf(block: string): string[] {
  return [...block.matchAll(/<PublicationType(?:\s[^>]*)?>([\s\S]*?)<\/PublicationType>/g)].map((m) => m[1].trim());
}

/** Título do artigo; artigo só em português vem com "[Not Available]" e o título no VernacularTitle. */
export function titleOf(block: string): string {
  const read = (tag: string) =>
    decodeEntities((block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] ?? "").replace(/<[^>]+>/g, "").trim());
  const title = read("ArticleTitle");
  return /^\[not available\]\.?$/i.test(title) ? read("VernacularTitle") || title : title;
}
