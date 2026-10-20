"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState, useTransition } from "react";
import { sendFeedback } from "@/app/(app)/pesquisa/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Feedback, FeedbackReason } from "@/types/search";

const reasons: { id: FeedbackReason; label: string }[] = [
  { id: "fora-do-tema", label: "Artigos fora do tema" },
  { id: "confusa", label: "Resposta confusa" },
  { id: "faltou-evidencia", label: "Faltou evidência" },
  { id: "outro", label: "Outro" },
];

/** "Essa resposta ajudou?" Muda na hora; se o servidor recusar, volta ao voto anterior. */
export function AnswerFeedback({ turnId, initial }: { turnId: string; initial: Feedback | null }) {
  const [feedback, setFeedback] = useState<Feedback | null>(initial);
  const [error, setError] = useState(false);
  const [, startTransition] = useTransition();

  function vote(next: Feedback) {
    const previous = feedback;
    setFeedback(next);
    setError(false);
    startTransition(async () => {
      const result = await sendFeedback(turnId, next.helpful, next.reason);
      if (!result.ok) {
        setFeedback(previous);
        setError(true);
      }
    });
  }

  return (
    <div className="mt-6 space-y-3 border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <p id={`ajudou-${turnId}`} className="text-body-sm text-ink-secondary">
          Essa resposta ajudou?
        </p>
        <div role="group" aria-labelledby={`ajudou-${turnId}`} className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            aria-pressed={feedback?.helpful === true}
            className={cn(feedback?.helpful === true && "border-ink bg-surface-sunken")}
            onClick={() => vote({ helpful: true, reason: null })}
          >
            <ThumbsUp aria-hidden="true" />
            Sim
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-pressed={feedback?.helpful === false}
            className={cn(feedback?.helpful === false && "border-ink bg-surface-sunken")}
            onClick={() => vote({ helpful: false, reason: feedback?.helpful === false ? feedback.reason : null })}
          >
            <ThumbsDown aria-hidden="true" />
            Não
          </Button>
        </div>
      </div>

      {feedback?.helpful === false && (
        <div className="space-y-2">
          <p id={`motivo-${turnId}`} className="text-body-sm text-ink-secondary">
            Obrigado. O que faltou? (opcional)
          </p>
          <div role="group" aria-labelledby={`motivo-${turnId}`} className="flex flex-wrap gap-2">
            {reasons.map((r) => {
              const active = feedback.reason === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => vote({ helpful: false, reason: active ? null : r.id })}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full border px-3 text-body-sm pointer-coarse:h-11",
                    active ? "border-ink bg-surface-sunken font-medium text-ink" : "border-line text-ink-secondary hover:text-ink",
                  )}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p role="status" className="text-body-sm empty:hidden">
        {error ? (
          <span className="text-danger">Não foi possível registrar agora. Tente de novo.</span>
        ) : feedback?.helpful === true ? (
          <span className="text-ink-secondary">Obrigado pelo retorno.</span>
        ) : null}
      </p>
    </div>
  );
}
