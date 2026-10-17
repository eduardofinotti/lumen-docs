/**
 * Markdown mínimo da resposta: parágrafos, listas com "- ", **negrito** e citações [n].
 * Feito à mão porque o formato é nosso (gerado pela síntese) e cabe em poucas regras;
 * se a síntese passar a usar mais recursos, trocar por uma biblioteca de markdown.
 */

/** Frase fixa que encerra toda resposta. */
export const CLINICAL_DECISION_NOTE = "A decisão clínica é do médico.";

export type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "citation"; n: number };

export type Block =
  | { type: "paragraph"; content: InlineToken[] }
  | { type: "list"; items: InlineToken[][] };

const INLINE_PATTERN = /\*\*(.+?)\*\*|\[(\d+)\]/g;

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ type: "text", value: text.slice(last, index) });
    if (match[1] !== undefined) tokens.push({ type: "bold", value: match[1] });
    else tokens.push({ type: "citation", n: Number(match[2]) });
    last = index + match[0].length;
  }
  if (last < text.length) tokens.push({ type: "text", value: text.slice(last) });
  return tokens;
}

export function parseAnswer(markdown: string): Block[] {
  return markdown
    .trim()
    .split(/\n\s*\n/)
    .map((chunk): Block => {
      const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.every((l) => l.startsWith("- "))) {
        return { type: "list", items: lines.map((l) => parseInline(l.slice(2))) };
      }
      return { type: "paragraph", content: parseInline(lines.join(" ")) };
    });
}

/** Versão em texto puro (para copiar): tira o negrito, mantém listas e [n]. */
export function markdownToPlainText(markdown: string): string {
  return markdown.trim().replace(/\*\*(.+?)\*\*/g, "$1");
}
