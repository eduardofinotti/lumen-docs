"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { barLevels } from "@/lib/dictation";
import { cn } from "@/lib/utils";
import type { Dictation } from "./use-dictation";

/** Microfone: toca para gravar, toca de novo (quadrado) para parar. */
export function DictationButton({
  dictation,
  disabled,
  size = "default",
}: {
  dictation: Dictation;
  disabled?: boolean;
  size?: "default" | "small";
}) {
  if (!dictation.supported) return null;
  const { listening } = dictation;
  const Icon = listening ? Square : Mic;
  return (
    <Button
      type="button"
      variant="secondary"
      size={size === "small" ? "icon-sm" : "icon"}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Parar o ditado" : "Ditar a pergunta"}
      title={listening ? "Parar o ditado" : "Ditar a pergunta"}
      onClick={listening ? dictation.stop : dictation.start}
      className={cn(size === "small" && "pointer-coarse:size-10", listening && "border-ink")}
    >
      <Icon aria-hidden="true" className={cn(listening && "fill-current")} />
    </Button>
  );
}

const BARS = 7;

/** Ondas do som do microfone; sem acesso ao áudio, uma animação neutra. */
function Waves({ stream }: { stream: MediaStream | null }) {
  const bars = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!stream) return;
    const audio = new AudioContext();
    const analyser = audio.createAnalyser();
    analyser.fftSize = 64;
    audio.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    const draw = () => {
      analyser.getByteFrequencyData(data);
      barLevels(data, BARS).forEach((level, i) => {
        const bar = bars.current[i];
        if (bar) bar.style.transform = `scaleY(${level})`;
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      audio.close();
    };
  }, [stream]);

  return (
    <span className="flex h-6 items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            bars.current[i] = el;
          }}
          style={stream ? { transform: "scaleY(0.15)" } : { animationDelay: `${i * 120}ms` }}
          className={cn(
            "h-full w-[3px] origin-center rounded-full bg-ink transition-transform duration-75",
            !stream && "animate-[dictation-wave_1s_ease-in-out_infinite] motion-reduce:animate-none",
          )}
        />
      ))}
    </span>
  );
}

/** Faixa "Ouvindo" com as ondas, enquanto grava. */
export function ListeningBar({ dictation, className }: { dictation: Dictation; className?: string }) {
  return (
    <>
      <span role="status" className="sr-only">
        {dictation.listening ? "Gravando. Toque em parar quando terminar." : ""}
      </span>
      {dictation.listening && (
        <div className={cn("flex items-center gap-3 text-body-sm text-ink-secondary", className)}>
          <Waves stream={dictation.stream} />
          <span>Ouvindo… toque no quadrado quando terminar.</span>
        </div>
      )}
    </>
  );
}
