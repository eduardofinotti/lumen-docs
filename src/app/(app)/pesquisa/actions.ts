"use server";

import { revalidatePath } from "next/cache";
import { continueConversation, createConversation, type RunResult } from "@/lib/data/conversations";
import { isDateRange } from "@/lib/date-range";
import { validateQuestion } from "@/lib/question";

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
