"use client";

import { useState } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { dateRangeLabel } from "@/lib/date-range";
import { formatDateTime } from "@/lib/format";
import { buildCopyText } from "@/lib/vancouver";
import type { Conversation } from "@/types/search";
import { Answer } from "./answer";
import { CopyButton } from "./copy-button";
import { SearchStatusMessage } from "./search-status-message";

/**
 * Resultado de uma pesquisa: resposta à esquerda e artigos à direita (desktop)
 * ou abaixo (celular). Passar o mouse numa citação destaca o card do artigo.
 */
export function ResultView({ conversation }: { conversation: Conversation }) {
  // Provisório até a tela da conversa: mostra só a primeira resposta.
  const search = { ...conversation.turns[0], question: conversation.title, dateRange: conversation.dateRange };
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const count = search.sources.length;
  const done = search.status === "done";

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6 sm:pt-10">
      <header className="max-w-3xl">
        <p className="label-caps">Pergunta</p>
        <h1 className="mt-3 font-display text-display-md text-balance">{search.question}</h1>
        <p className="mt-4 text-body-sm text-ink-secondary">
          {formatDateTime(search.createdAt)} · Publicações: {dateRangeLabel(search.dateRange).toLowerCase()}
          {done && <> · {count === 0 ? "nenhum artigo" : count === 1 ? "1 artigo" : `${count} artigos`} do PubMed</>}
        </p>
        {done && (
          <div className="mt-6">
            <CopyButton text={buildCopyText(conversation.title, conversation.turns[0])} />
          </div>
        )}
      </header>

      {search.status !== "done" ? (
        <div className="mt-12">
          <SearchStatusMessage status={search.status} />
        </div>
      ) : (
        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <section aria-labelledby="resposta">
            <h2 id="resposta" className="label-caps">
              Resposta
            </h2>
            <div className="mt-4">
              <Answer markdown={search.answerMd} sourceCount={count} onHighlight={setHighlighted} />
            </div>
          </section>

          {count > 0 && (
            <section aria-labelledby="artigos">
              <h2 id="artigos" className="label-caps">
                Artigos citados
              </h2>
              <ol className="mt-4 space-y-4">
                {search.sources.map((article, i) => (
                  <li key={article.pmid}>
                    <ArticleCard article={article} index={i + 1} highlighted={highlighted === i + 1} />
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
