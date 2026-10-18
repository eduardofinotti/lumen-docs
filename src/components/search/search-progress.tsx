import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const SEARCH_STEPS = ["Entendendo a pergunta", "Buscando artigos", "Lendo e resumindo"];

/** Etapas de uma continuação: o Lúmen pode buscar de novo ou reler os artigos já encontrados. */
export const FOLLOW_UP_STEPS = ["Entendendo a pergunta", "Buscando ou relendo artigos", "Lendo e resumindo"];

/**
 * Carregamento em etapas. `current` = índice da etapa em andamento (igual ao total quando tudo terminou).
 * Sem `question`, mostra só as etapas (dentro da conversa, a pergunta já aparece acima).
 */
export function SearchProgress({
  question,
  current,
  steps = SEARCH_STEPS,
}: {
  question?: string;
  current: number;
  steps?: string[];
}) {
  return (
    <div className={cn(question && "mx-auto w-full max-w-2xl")}>
      {question && (
        <>
          <p className="label-caps">Pesquisando</p>
          <p className="mt-3 mb-10 font-display text-display-md text-balance">{question}</p>
        </>
      )}
      <ol className="space-y-4" aria-live="polite">
        {steps.map((label, i) => {
          const state = i < current ? "feito" : i === current ? "atual" : "aguardando";
          return (
            <li key={label} className="flex items-center gap-3" aria-current={state === "atual" ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border",
                  state === "feito" && "border-ink bg-ink text-surface",
                  state === "atual" && "border-lumen",
                  state === "aguardando" && "border-line-strong",
                )}
                aria-hidden="true"
              >
                {state === "feito" && <Check className="size-3.5 stroke-[2]" />}
                {state === "atual" && <span className="size-2 rounded-full bg-lumen motion-safe:animate-pulse" />}
              </span>
              <span className={cn("text-body", state === "aguardando" ? "text-ink-secondary" : "text-ink")}>
                {label}
                <span className="sr-only">
                  {state === "feito" ? " (concluído)" : state === "atual" ? " (em andamento)" : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className={cn("text-body-sm text-ink-secondary", question ? "mt-10" : "mt-6")}>
        Costuma levar de 15 a 40 segundos.
      </p>
    </div>
  );
}
