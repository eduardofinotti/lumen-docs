"use server";

import { revalidatePath } from "next/cache";
import { createSearch, type CreateSearchResult } from "@/lib/data/searches";
import { isDateRange } from "@/lib/date-range";
import { findPatientIdentifier } from "@/lib/privacy";
import { MAX_QUESTION_LENGTH, MIN_QUESTION_LENGTH } from "@/lib/question";

export type StartSearchResult = CreateSearchResult;

export async function startSearch(question: string, dateRange: string): Promise<StartSearchResult> {
  const text = question.trim();

  if (text.length < MIN_QUESTION_LENGTH) {
    return { ok: false, error: "Escreva a pergunta com um pouco mais de detalhe." };
  }
  if (text.length > MAX_QUESTION_LENGTH) {
    return { ok: false, error: `A pergunta pode ter até ${MAX_QUESTION_LENGTH} caracteres.` };
  }
  const identifier = findPatientIdentifier(text);
  if (identifier) return { ok: false, error: identifier };
  if (!isDateRange(dateRange)) return { ok: false, error: "Escolha o período de publicação." };

  const result = await createSearch(text, dateRange);
  // Atualiza o histórico da sidebar e os créditos do cabeçalho (a função debita mesmo quando falha).
  revalidatePath("/", "layout");
  return result;
}
