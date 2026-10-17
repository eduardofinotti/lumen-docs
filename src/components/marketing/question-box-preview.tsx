import { ChevronDown, Search } from "lucide-react";
import { landingExampleQuestion } from "@/lib/mocks/landing";

/**
 * Ilustração estática da caixa de pergunta, para a landing.
 * Não é interativa: os "controles" são spans e ficam fora da ordem de foco.
 */
export function QuestionBoxPreview() {
  return (
    <figure className="mx-auto w-full max-w-2xl">
      <div
        className="rounded-lg border border-line bg-surface-raised p-6 text-left shadow-sm"
        aria-hidden="true"
      >
        <p className="min-h-16 text-body text-ink">{landingExampleQuestion}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-body-sm text-ink-secondary">
            Últimos 5 anos
            <ChevronDown className="size-4 stroke-[1.5]" />
          </span>
          <span className="inline-flex h-11 items-center gap-2 rounded-md bg-lumen px-4 text-body-sm font-medium text-on-lumen">
            <Search className="size-4 stroke-[1.5]" />
            Pesquisar
          </span>
        </div>
      </div>
      <figcaption className="sr-only">
        Exemplo de pergunta: {landingExampleQuestion}
      </figcaption>
    </figure>
  );
}
