"use server";

import { revalidatePath } from "next/cache";
import { continueConversation, createConversation, type RunResult } from "@/lib/data/conversations";
import { saveFeedback } from "@/lib/data/feedback";
import { isFeedbackReason } from "@/lib/data/guards";
import { isDateRange } from "@/lib/date-range";
import { validateQuestion } from "@/lib/question";

// Uuid no banco; na demonstração, ids como "exemplo-sglt2-1".
const TURN_ID = /^[\w-]{1,64}$/;

/** Primeira pergunta de uma pesquisa. */
export async function startSearch(question: string, dateRange: string): Promise<RunResult> {
  const text = question.trim();
  const problem = validateQuestion(text, { followUp: false });
  if (problem) return { ok: false, error: problem };
  if (!isDateRange(dateRange)) return { ok: false, error: "Escolha o período de publicação." };

  const result = await createConversation(text, dateRange);
  // Atualiza o histórico da sidebar e os créditos do cabeçalho.
  revalidatePath("/", "layout");
  return result;
}

/** Pergunta de continuação numa pesquisa existente. */
export async function continueSearch(searchId: string, question: string): Promise<RunResult> {
  const text = question.trim();
  const problem = validateQuestion(text, { followUp: true });
  if (problem) return { ok: false, error: problem };

  const result = await continueConversation(searchId, text);
  revalidatePath("/", "layout");
  return result;
}

/** Refaz uma pergunta que deu erro, na mesma posição da conversa. */
export async function retryTurn(searchId: string, turnId: string): Promise<RunResult> {
  const result = await continueConversation(searchId, "", turnId);
  revalidatePath("/", "layout");
  return result;
}

/** "Essa resposta ajudou?": sim, ou não com motivo opcional. */
export async function sendFeedback(
  turnId: string,
  helpful: boolean,
  reason: string | null,
): Promise<{ ok: boolean }> {
  if (!TURN_ID.test(turnId)) return { ok: false };
  if (reason !== null && !isFeedbackReason(reason)) return { ok: false };
  const ok = await saveFeedback(turnId, { helpful, reason: helpful ? null : reason });
  return { ok };
}
