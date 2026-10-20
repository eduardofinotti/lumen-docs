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

  const force = lines[1]?.match(/^for[çc]a da evid[êe]ncia\s*:\s*(.+)$/i)?.[1]?.trim() ?? "";
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
