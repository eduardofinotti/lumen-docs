import { ArticleCard } from "@/components/articles/article-card";
import type { Turn } from "@/types/search";

/** Âncora do card [n] de uma resposta no painel do desktop. */
export function anchorFor(turn: Turn, n: number): string {
  return `artigo-${turn.position}-${n}`;
}

/**
 * Artigos de uma resposta, na ordem das citações [n]. O painel (desktop) tem os ids das
 * âncoras; a lista do celular não, para não repetir ids na página.
 */
export function SourcesList({
  turn,
  highlighted,
  variant,
}: {
  turn: Turn;
  highlighted: number | null;
  variant: "panel" | "inline";
}) {
  return (
    <ol className="space-y-4">
      {turn.sources.map((article, i) => (
        <li key={article.pmid}>
          <ArticleCard
            article={article}
            index={i + 1}
            highlighted={highlighted === i + 1}
            anchorId={variant === "panel" ? anchorFor(turn, i + 1) : null}
            anchorKey={`${turn.position}-${i + 1}`}
          />
        </li>
      ))}
    </ol>
  );
}

/** Painel direito (desktop): os artigos da resposta selecionada. */
export function SourcesPanel({
  turn,
  turnNumber,
  highlighted,
}: {
  turn: Turn | null;
  turnNumber: number;
  highlighted: number | null;
}) {
  return (
    <aside aria-labelledby="artigos" className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto pb-6 lg:block">
      <h2 id="artigos" className="label-caps">
        {turn && turn.sources.length > 0 ? `Artigos da resposta ${turnNumber}` : "Artigos"}
      </h2>
      <div className="mt-4">
        {turn && turn.sources.length > 0 ? (
          <SourcesList turn={turn} highlighted={highlighted} variant="panel" />
        ) : (
          <p className="text-body-sm text-ink-secondary">Esta resposta não citou artigos.</p>
        )}
      </div>
    </aside>
  );
}
