// CPF com ou sem pontuação (000.000.000-00 ou 00000000000).
const CPF_PATTERN = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;

/**
 * Checagem simples de dado que identifica paciente, feita antes de enviar a pergunta.
 * Não substitui o aviso: só pega o caso mais óbvio (CPF).
 */
export function findPatientIdentifier(text: string): string | null {
  if (CPF_PATTERN.test(text)) {
    return "A pergunta parece conter um CPF. Retire qualquer dado que identifique o paciente.";
  }
  return null;
}
