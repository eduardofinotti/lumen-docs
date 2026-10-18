import { findPatientIdentifier } from "./privacy";

export const MIN_QUESTION_LENGTH = 10;
/** Continuação pode ser curta ("e na grave?"): o contexto vem da conversa. */
export const MIN_FOLLOW_UP_LENGTH = 3;
export const MAX_QUESTION_LENGTH = 500;

/** Mensagem do problema na pergunta, ou `null` se ela pode seguir. */
export function validateQuestion(text: string, { followUp }: { followUp: boolean }): string | null {
  const trimmed = text.trim();
  if (trimmed.length < (followUp ? MIN_FOLLOW_UP_LENGTH : MIN_QUESTION_LENGTH)) {
    return "Escreva a pergunta com um pouco mais de detalhe.";
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) return `A pergunta pode ter até ${MAX_QUESTION_LENGTH} caracteres.`;
  return findPatientIdentifier(trimmed);
}
