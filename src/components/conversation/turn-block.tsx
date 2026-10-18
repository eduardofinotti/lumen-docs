"use client";

import { FileDown } from "lucide-react";
import { Answer } from "@/components/search/answer";
import { CopyButton } from "@/components/search/copy-button";
import { SearchStatusMessage } from "@/components/search/search-status-message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

  return (
    <section
      id={`resposta-${turn.position}`}
      aria-label={`Pergunta ${turn.position}`}
      className="scroll-mt-20 space-y-5"
    >
      <QuestionBubble question={turn.question} understood={turn.standaloneQuestion} />

      {turn.status === "done" ? (
        // Clicar na resposta mostra os artigos dela no painel (desktop).
        <div
          onClick={onSelect}
          className={cn(
            "-mx-4 rounded-lg px-4 py-4 transition-colors lg:cursor-pointer",
            selected && "lg:bg-surface-sunken",
          )}
        >
          <Answer
            markdown={turn.answerMd}
            sourceCount={count}
            onHighlight={(n) => {
              if (n !== null) onSelect();
              onHighlight(n);
            }}
            anchorFor={(n) => `#${anchorFor(turn, n)}`}
            onCite={onCite}
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <CopyButton text={buildCopyText(title, turn)} />
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
            <details className="mt-6 rounded-lg border border-line lg:hidden" data-turn-sources={turn.position}>
              <summary className="cursor-pointer list-none px-4 py-3 text-body-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                {count === 1 ? "1 artigo citado" : `${count} artigos citados`}
              </summary>
              <div className="px-2 pb-2">
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
