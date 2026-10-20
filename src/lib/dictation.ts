/** Junta o texto ditado ao que já está na caixa. */
export function joinDictation(base: string, spoken: string): string {
  const text = spoken.trim();
  if (!text) return base;
  const before = base.trimEnd();
  const capitalize = before === "" || /[.!?]$/.test(before);
  const piece = capitalize ? text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1) : text;
  return before ? `${before} ${piece}` : piece;
}

/** Mensagem para o erro do reconhecimento de voz; null quando não há o que avisar. */
export function dictationError(code: string): string | null {
  switch (code) {
    case "aborted":
      return null;
    case "not-allowed":
    case "service-not-allowed":
      return "Permita o uso do microfone nas configurações do navegador para ditar a pergunta.";
    case "no-speech":
      return "Não ouvimos nada. Toque no microfone e fale de novo.";
    case "network":
      return "O ditado precisa de internet. Confira a conexão e tente de novo.";
    default:
      return "Não foi possível ditar agora. Digite a pergunta ou tente de novo.";
  }
}
