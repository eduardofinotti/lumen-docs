"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState, useTransition } from "react";
import { sendFeedback } from "@/app/(app)/pesquisa/actions";
import { Button } from "@/components/ui/button";
import type { Feedback, FeedbackReason } from "@/types/search";

const reasons: { id: FeedbackReason; label: string }[] = [
  { id: "fora-do-tema", label: "Artigos fora do tema" },
  { id: "confusa", label: "Resposta confusa" },
  { id: "faltou-evidencia", label: "Faltou evidência" },
  { id: "outro", label: "Outro" },
];

/**
 * "Essa resposta ajudou?" Depois do voto, a pergunta some e fica o agradecimento (com "Mudar").
 * No "não", os motivos aparecem uma vez, opcionais. Se o servidor recusar, volta ao voto anterior.
 */
export function AnswerFeedback({ turnId, initial }: { turnId: string; initial: Feedback | null }) {
  const [feedback, setFeedback] = useState<Feedback | null>(initial);
  // "pergunta": Sim/Não; "motivo": logo depois do "não"; "feito": só o agradecimento.
  const [stage, setStage] = useState<"pergunta" | "motivo" | "feito">(initial ? "feito" : "pergunta");
  const [error, setError] = useState(false);
  const [, startTransition] = useTransition();

  function vote(next: Feedback, nextStage: "motivo" | "feito") {
    const previous = { feedback, stage };
    setFeedback(next);
    setStage(nextStage);
    setError(false);
    startTransition(async () => {
      const result = await sendFeedback(turnId, next.helpful, next.reason);
      if (!result.ok) {
        setFeedback(previous.feedback);
        setStage(previous.stage);
        setError(true);
      }
    });
  }

  const errorMessage = error && (
    <p role="alert" className="text-body-sm text-danger">
      Não foi possível registrar agora. Tente de novo.
    </p>
  );

  if (stage === "feito" && feedback) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4">
        <p role="status" className="text-body-sm text-ink-secondary">
          Obrigado pelo retorno.
        </p>
        <button
          type="button"
          onClick={() => setStage("pergunta")}
          className="rounded-sm text-body-sm text-ink-secondary underline decoration-line-strong underline-offset-4 hover:text-ink pointer-coarse:min-h-11"
        >
          Mudar resposta
        </button>
        {errorMessage}
      </div>
    );
  }

  if (stage === "motivo" && feedback?.helpful === false) {
    return (
      <div className="mt-6 space-y-2 border-t border-line pt-4">
        <p id={`motivo-${turnId}`} className="text-body-sm text-ink-secondary">
          Obrigado. O que faltou? (opcional)
        </p>
        <div role="group" aria-labelledby={`motivo-${turnId}`} className="flex flex-wrap gap-2">
          {reasons.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => vote({ helpful: false, reason: r.id }, "feito")}
              className="inline-flex h-9 items-center rounded-full border border-line px-3 text-body-sm text-ink-secondary hover:border-line-strong hover:text-ink pointer-coarse:h-11"
            >
              {r.label}
            </button>
          ))}
          <Button variant="tertiary" size="sm" onClick={() => setStage("feito")}>
            Pular
          </Button>
        </div>
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2 border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <p id={`ajudou-${turnId}`} className="text-body-sm text-ink-secondary">
          Essa resposta ajudou?
        </p>
        <div role="group" aria-labelledby={`ajudou-${turnId}`} className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            aria-pressed={feedback?.helpful === true}
            onClick={() => vote({ helpful: true, reason: null }, "feito")}
          >
            <ThumbsUp aria-hidden="true" />
            Sim
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-pressed={feedback?.helpful === false}
            onClick={() => vote({ helpful: false, reason: null }, "motivo")}
          >
            <ThumbsDown aria-hidden="true" />
            Não
          </Button>
        </div>
      </div>
      {errorMessage}
    </div>
  );
}
