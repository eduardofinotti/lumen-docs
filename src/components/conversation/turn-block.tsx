"use client";

import { ChevronDown, FileDown } from "lucide-react";
import { Answer } from "@/components/search/answer";
import { ConclusionBlock } from "@/components/search/conclusion";
import { CopyButton } from "@/components/search/copy-button";
import { ShareButton } from "@/components/search/share-button";
import { SearchStatusMessage } from "@/components/search/search-status-message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildShareText } from "@/lib/share";
import { buildCopyText } from "@/lib/vancouver";
import type { Turn } from "@/types/search";
import { anchorFor, SourcesList, type SaveContext } from "./sources-panel";

/** Balão com a pergunta do médico; numa continuação, mostra também como o Lúmen a entendeu. */
export function QuestionBubble({ question, understood }: { question: string; understood?: string | null }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="max-w-[85%] rounded-lg bg-lumen-tint px-4 py-3 text-body text-ink">{question}</p>
      {understood && understood !== question && (
        <p className="max-w-[85%] text-right text-body-sm text-ink-secondary">Entendi: {understood}</p>
      )}
    </div>
  );
}

/** Uma pergunta da conversa e sua resposta. */
export function TurnBlock({
  turn,
  title,
  selected,
  highlighted,
  retrying,
  save,
  onSelect,
  onHighlight,
  onCite,
  onRetry,
}: {
  turn: Turn;
  /** Primeira pergunta da conversa (para o texto copiado). */
  title: string;
  selected: boolean;
  highlighted: number | null;
  retrying: boolean;
  save: SaveContext;
  onSelect: () => void;
  onHighlight: (n: number | null) => void;
  onCite: (n: number) => void;
  onRetry: () => void;
}) {
  const count = turn.sources.length;
  const citation = {
    sourceCount: count,
    onHighlight: (n: number | null) => {
      if (n !== null) onSelect();
      onHighlight(n);
    },
    anchorFor: (n: number) => `#${anchorFor(turn, n)}`,
    onCite,
  };

  return (
    <section
      id={`resposta-${turn.position}`}
      aria-label={`Pergunta ${turn.position}`}
      className="scroll-mt-20 space-y-5"
    >
      {/* A primeira pergunta já é o título da página: no celular, não repete. */}
      <div className={cn(turn.position === 1 && "max-lg:hidden")}>
        <QuestionBubble question={turn.question} understood={turn.standaloneQuestion} />
      </div>

      {turn.status === "done" ? (
        // Clicar na resposta mostra os artigos dela no painel (desktop).
        <div
          onClick={onSelect}
          className={cn(
            "-mx-4 rounded-lg px-4 py-4 transition-colors lg:cursor-pointer",
            selected && "lg:bg-surface-sunken",
          )}
        >
          {turn.conclusion && (
            <div className="mb-5">
              <ConclusionBlock conclusion={turn.conclusion} {...citation} />
            </div>
          )}
          <Answer markdown={turn.answerMd} {...citation} />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <CopyButton text={buildCopyText(title, turn)} />
            <ShareButton text={(siteUrl) => buildShareText(title, turn, siteUrl)} />
            <Button variant="secondary" size="sm" asChild>
              <a href={`/imprimir/${turn.id}`} target="_blank" rel="noopener">
                <FileDown aria-hidden="true" />
                Baixar PDF
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            </Button>
            {count > 0 && !selected && (
              <Button variant="tertiary" size="sm" className="hidden lg:inline-flex" onClick={onSelect}>
                Ver os {count} artigos desta resposta
              </Button>
            )}
          </div>

          {count > 0 && (
            <details className="group mt-6 lg:hidden" data-turn-sources={turn.position}>
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-line bg-surface-raised px-4 text-body-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                {count === 1 ? "Ver o artigo citado" : `Ver os ${count} artigos citados`}
                <ChevronDown
                  className="size-4 stroke-[1.5] text-ink-secondary transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="mt-3">
                <SourcesList turn={turn} highlighted={selected ? highlighted : null} variant="inline" save={save} />
              </div>
            </details>
          )}
        </div>
      ) : (
        <SearchStatusMessage
          status={turn.status}
          headingId={`situacao-${turn.position}`}
          action={
            turn.status === "error" ? (
              <Button variant="secondary" className="mt-6" onClick={onRetry} disabled={retrying}>
                {retrying ? "Tentando de novo…" : "Tentar de novo"}
              </Button>
            ) : undefined
          }
        />
      )}
    </section>
  );
}
