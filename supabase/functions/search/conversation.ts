// Lúmen · lógica pura da conversa (sem APIs do Deno; testada pelo Vitest no app).

export type RouterDecision = {
  action: "search" | "reuse";
  standaloneQuestion: string;
  pubmedQuery: string | null;
};

/**
 * Lê a resposta do roteador. Qualquer coisa fora do formato vira busca nova com a
 * pergunta original: a continuação nunca falha por causa do roteador.
 */
export function parseRouterReply(text: string, originalQuestion: string): RouterDecision {
  const fallback: RouterDecision = { action: "search", standaloneQuestion: originalQuestion, pubmedQuery: null };
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return fallback;
  }
  if (typeof parsed !== "object" || parsed === null) return fallback;
  const reply = parsed as Record<string, unknown>;

  const action = reply.action === "reuse" ? "reuse" : "search";
  const standalone = typeof reply.standaloneQuestion === "string" ? reply.standaloneQuestion.trim() : "";
  const query = typeof reply.pubmedQuery === "string" ? reply.pubmedQuery.trim() : "";
  return {
    action,
    standaloneQuestion: standalone || originalQuestion,
    pubmedQuery: action === "search" && query ? query : null,
  };
}

export type HistoryTurn = { question: string; standaloneQuestion: string | null; answerMd: string | null };

const HISTORY_TURNS = 6;
const HISTORY_ANSWER_CHARS = 1500;
const CLINICAL_NOTE = "A decisão clínica é do médico.";

/** Texto da conversa até aqui, para dar contexto ao roteador e à síntese. */
export function buildHistory(turns: HistoryTurn[]): string {
  return turns
    .slice(-HISTORY_TURNS)
    .map((t) => {
      let answer = (t.answerMd ?? "(sem resposta)")
        .replace(/\s*\[\d+\]/g, "")
        .replace(CLINICAL_NOTE, "")
        .trim();
      if (answer.length > HISTORY_ANSWER_CHARS) answer = `${answer.slice(0, HISTORY_ANSWER_CHARS).trimEnd()}…`;
      return `Pergunta: ${t.standaloneQuestion ?? t.question}\nResposta: ${answer}`;
    })
    .join("\n\n");
}

export type KnownArticle = { pmid: string; cited: boolean; turnPosition: number };

/** PMIDs para uma resposta que reaproveita artigos: citados primeiro, depois os mais recentes. */
export function selectReuseArticles(known: KnownArticle[], max = 12): string[] {
  const ordered = [...known].sort(
    (a, b) => Number(b.cited) - Number(a.cited) || b.turnPosition - a.turnPosition,
  );
  return [...new Set(ordered.map((a) => a.pmid))].slice(0, max);
}
