"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { dictationError, joinDictation, shouldKeepListening } from "@/lib/dictation";
import type { SpeechRecognitionConstructor, SpeechRecognitionLike } from "@/types/speech";

function recognitionConstructor(): SpeechRecognitionConstructor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};

// Sessão que termina antes disso conta como "encerrou logo ao começar".
const QUICK_END_MS = 1500;

export interface Dictation {
  supported: boolean;
  listening: boolean;
  /** Áudio do microfone, para as ondas; null se o navegador não liberou. */
  stream: MediaStream | null;
  start: () => void;
  stop: () => void;
}

/**
 * Ditado contínuo: grava até o médico tocar em parar. O navegador encerra o reconhecimento
 * depois de uma pausa na fala; aqui ele é religado, continuando do texto que já está na caixa.
 */
export function useDictation({
  value,
  onChange,
  onError,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Mensagem para mostrar perto da caixa; null limpa. */
  onError: (message: string | null) => void;
}): Dictation {
  // No servidor e na primeira pintura não há `window`: o botão só aparece depois, sem erro de hidratação.
  const supported = useSyncExternalStore(noop, () => recognitionConstructor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const wanted = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  // O valor muda a cada palavra; as funções do reconhecimento leem o mais novo por aqui.
  const latest = useRef({ value, onChange, onError });
  useEffect(() => {
    latest.current = { value, onChange, onError };
  });

  function releaseMicrophone() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }

  function finish() {
    wanted.current = false;
    recognition.current = null;
    setListening(false);
    releaseMicrophone();
  }

  function session(quickEnds: number) {
    const Recognition = recognitionConstructor();
    if (!Recognition) return finish();
    const base = latest.current.value;
    const startedAt = Date.now();
    let lastError: string | null = null;

    const r = new Recognition();
    r.lang = "pt-BR";
    r.interimResults = true;
    r.continuous = true;
    r.onresult = (event) => {
      const spoken = Array.from(event.results, (result) => result[0].transcript).join(" ");
      latest.current.onChange(joinDictation(base, spoken));
    };
    r.onerror = (event) => {
      lastError = event.error;
    };
    r.onend = () => {
      const quick = Date.now() - startedAt < QUICK_END_MS ? quickEnds + 1 : 0;
      if (shouldKeepListening({ wanted: wanted.current, lastError, quickEnds: quick })) {
        session(quick);
        return;
      }
      // Pausa ou parada pedida não são erro; o resto vira aviso.
      if (wanted.current && lastError && lastError !== "no-speech") latest.current.onError(dictationError(lastError));
      finish();
    };
    recognition.current = r;
    try {
      r.start();
    } catch {
      latest.current.onError(dictationError("desconhecido"));
      finish();
    }
  }

  function start() {
    if (wanted.current) return;
    wanted.current = true;
    latest.current.onError(null);
    setListening(true);
    session(0);
    // Só para as ondas: se o navegador não liberar, o ditado segue sem elas.
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((s) => {
        if (!wanted.current) return s.getTracks().forEach((t) => t.stop());
        streamRef.current = s;
        setStream(s);
      })
      .catch(() => {});
  }

  function stop() {
    wanted.current = false;
    recognition.current?.stop();
    releaseMicrophone();
  }

  useEffect(
    () => () => {
      wanted.current = false;
      recognition.current?.abort();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  return { supported, listening, stream, start, stop };
}
