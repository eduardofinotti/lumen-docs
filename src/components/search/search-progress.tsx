import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const SEARCH_STEPS = ["Entendendo a pergunta", "Buscando artigos", "Lendo e resumindo"];

/** Carregamento em etapas. `current` = índice da etapa em andamento (igual ao total quando tudo terminou). */
export function SearchProgress({ question, current }: { question: string; current: number }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="label-caps">Pesquisando</p>
      <p className="mt-3 font-display text-display-md text-balance">{question}</p>
      <ol className="mt-10 space-y-4" aria-live="polite">
        {SEARCH_STEPS.map((label, i) => {
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
      <p className="mt-10 text-body-sm text-ink-secondary">Costuma levar de 15 a 40 segundos.</p>
    </div>
  );
}
