"use server";

import { revalidatePath } from "next/cache";
import { createSearch } from "@/lib/data/searches";
import { isDateRange } from "@/lib/date-range";
import { findPatientIdentifier } from "@/lib/privacy";
import { MAX_QUESTION_LENGTH, MIN_QUESTION_LENGTH } from "@/lib/question";

export type StartSearchResult = { ok: true; id: string } | { ok: false; error: string };

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

  const id = await createSearch(text, dateRange);
  if (!id) {
    return { ok: false, error: "Não foi possível registrar a pesquisa agora. Tente de novo em instantes." };
  }
  // Atualiza o histórico da sidebar.
  revalidatePath("/", "layout");
  return { ok: true, id };
}
