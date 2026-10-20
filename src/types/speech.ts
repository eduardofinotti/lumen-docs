/**
 * Reconhecimento de voz do navegador (Web Speech API). Ainda fora dos tipos do DOM do TypeScript;
 * aqui só o que o ditado usa. Chrome e Safari expõem como `webkitSpeechRecognition`.
 */
export interface SpeechRecognitionResultItem {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}

export interface SpeechRecognitionResultEvent extends Event {
  readonly results: ArrayLike<SpeechRecognitionResultItem>;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

export interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
