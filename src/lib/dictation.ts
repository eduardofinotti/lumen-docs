/** Junta o texto ditado ao que já está na caixa. */
export function joinDictation(base: string, spoken: string): string {
  const text = spoken.replace(/\s+/g, " ").trim();
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

/** Erros em que religar o microfone não adianta. */
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "network", "audio-capture", "language-not-supported"]);

/**
 * O navegador encerra o reconhecimento depois de uma pausa na fala. Enquanto o médico não tocar
 * em parar, religa; para de vez em erro sem solução ou se encerrar logo ao começar várias vezes.
 */
export function shouldKeepListening({
  wanted,
  lastError,
  quickEnds,
}: {
  wanted: boolean;
  lastError: string | null;
  quickEnds: number;
}): boolean {
  if (!wanted) return false;
  if (lastError && FATAL_ERRORS.has(lastError)) return false;
  return quickEnds < 3;
}

/** Altura de cada barra das ondas (0,15 a 1) a partir das frequências do microfone (0 a 255). */
export function barLevels(data: ArrayLike<number>, bars: number): number[] {
  // Só a metade de baixo do espectro: é onde está a voz.
  const usable = Math.max(bars, Math.floor(data.length / 2));
  const size = Math.max(1, Math.floor(usable / bars));
  return Array.from({ length: bars }, (_, i) => {
    let sum = 0;
    for (let j = i * size; j < (i + 1) * size; j++) sum += data[j] ?? 0;
    const level = sum / size / 255;
    return Math.round(Math.min(1, Math.max(0.15, level)) * 100) / 100;
  });
}
