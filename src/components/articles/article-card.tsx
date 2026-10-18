import { ChevronDown, ExternalLink } from "lucide-react";
import { formatAuthors, pubmedUrl } from "@/lib/evidence";
import { cn } from "@/lib/utils";
import type { Article, ArticleSummary } from "@/types/article";
import { EvidenceBadge } from "./evidence-badge";

const summaryLabels: [keyof ArticleSummary, string][] = [
  ["pergunta", "Pergunta"],
  ["metodo", "Método"],
  ["resultado", "Resultado"],
  ["limitacao", "Limitação"],
];

/** Resumo em português, recolhido por padrão para a lista ficar curta. */
function ArticleSummaryDetails({ summary }: { summary: ArticleSummary }) {
  return (
    <details className="group rounded-md border border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 py-2 text-body-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
        Resumo em português
        <ChevronDown
          className="size-4 stroke-[1.5] text-ink-secondary transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <dl className="space-y-3 border-t border-line px-3 py-3">
        {summaryLabels.map(([key, label]) => (
          <div key={key}>
            <dt className="label-caps">{label}</dt>
            <dd className="mt-1 text-body-sm text-ink">{summary[key]}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** Card de artigo: título, metadados, etiqueta de evidência, PMID e link para o PubMed. */
export function ArticleCard({
  article,
  index,
  highlighted = false,
  anchorId = `artigo-${index}`,
  anchorKey,
  className,
}: {
  article: Article;
  index: number;
  highlighted?: boolean;
  /** `null`: sem id (a mesma resposta aparece no painel e na lista do celular). */
  anchorId?: string | null;
  /** Marca o card para a conversa achar o visível ao clicar numa citação. */
  anchorKey?: string;
  className?: string;
}) {
  return (
    <article
      id={anchorId ?? undefined}
      data-anchor={anchorKey}
      className={cn(
        "scroll-mt-24 rounded-lg border border-line bg-surface-raised p-6 transition-colors",
        highlighted && "bg-lumen-tint",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="font-medium text-lumen" aria-hidden="true">
          [{index}]
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <h3 className="text-title text-ink">{article.title}</h3>
          <p className="text-body-sm text-ink-secondary">
            {formatAuthors(article.authors)} {article.journal}. {article.year && `${article.year}. `}Fonte:{" "}
            {article.source}.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <EvidenceBadge level={article.evidence} />
            <span className="font-mono text-code text-ink-secondary">PMID {article.pmid}</span>
          </div>
          {article.summary && <ArticleSummaryDetails summary={article.summary} />}
          <a
            href={pubmedUrl(article.pmid)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-sm text-body-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
          >
            Ver no PubMed
            <ExternalLink className="size-3.5 stroke-[1.5] text-ink-secondary" aria-hidden="true" />
            <span className="sr-only">(abre em nova aba)</span>
          </a>
        </div>
      </div>
    </article>
  );
}
