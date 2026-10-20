"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { dictationError, joinDictation } from "@/lib/dictation";
import { cn } from "@/lib/utils";
import type { SpeechRecognitionConstructor, SpeechRecognitionLike } from "@/types/speech";

function recognitionConstructor(): SpeechRecognitionConstructor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};

/**
 * Microfone para ditar a pergunta. O texto aparece na caixa enquanto o médico fala,
 * e ele revisa antes de enviar. Some onde o navegador não tem reconhecimento de voz.
 */
export function DictationButton({
  value,
  onChange,
  onError,
  disabled,
  size = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  /** Mensagem para mostrar perto da caixa; null limpa. */
  onError: (message: string | null) => void;
  disabled?: boolean;
  size?: "default" | "small";
}) {
  // No servidor e na primeira pintura não há `window`: o botão só aparece depois, sem erro de hidratação.
  const supported = useSyncExternalStore(noop, () => recognitionConstructor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  // O valor muda a cada palavra; a função de resultado lê o mais novo por aqui.
  const latest = useRef({ onChange, onError });
  latest.current = { onChange, onError };

  useEffect(() => () => recognition.current?.abort(), []);

  if (!supported) return null;

  function start() {
    const Recognition = recognitionConstructor();
    if (!Recognition) return;
    const base = value;
    const r = new Recognition();
    r.lang = "pt-BR";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (event) => {
      const spoken = Array.from(event.results, (result) => result[0].transcript).join(" ");
      latest.current.onChange(joinDictation(base, spoken));
    };
    r.onerror = (event) => latest.current.onError(dictationError(event.error));
    r.onend = () => {
      setListening(false);
      recognition.current = null;
    };
    recognition.current = r;
    latest.current.onError(null);
    try {
      r.start();
      setListening(true);
    } catch {
      latest.current.onError(dictationError("desconhecido"));
    }
  }

  const Icon = listening ? Square : Mic;
  return (
    <>
      <span role="status" className="sr-only">
        {listening ? "Ouvindo. Fale a pergunta." : ""}
      </span>
        <Button
        type="button"
        variant="secondary"
        size={size === "small" ? "icon-sm" : "icon"}
        disabled={disabled}
        aria-pressed={listening}
        aria-label={listening ? "Parar o ditado" : "Ditar a pergunta"}
        title={listening ? "Parar o ditado" : "Ditar a pergunta"}
        onClick={() => (listening ? recognition.current?.stop() : start())}
        className={cn(size === "small" && "pointer-coarse:size-10", listening && "border-ink")}
      >
        <Icon aria-hidden="true" className={cn(listening && "fill-current")} />
      </Button>
    </>
  );
}
