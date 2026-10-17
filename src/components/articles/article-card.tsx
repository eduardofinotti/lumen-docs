import { ExternalLink } from "lucide-react";
import { formatAuthors, pubmedUrl } from "@/lib/evidence";
import { cn } from "@/lib/utils";
import type { Article } from "@/types/article";
import { EvidenceBadge } from "./evidence-badge";

/** Card de artigo: título, metadados, etiqueta de evidência, PMID e link para o PubMed. */
export function ArticleCard({
  article,
  index,
  highlighted = false,
  className,
}: {
  article: Article;
  index: number;
  highlighted?: boolean;
  className?: string;
}) {
  return (
    <article
      id={`artigo-${index}`}
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
            {formatAuthors(article.authors)} {article.journal}. {article.year}. Fonte: {article.source}.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <EvidenceBadge level={article.evidence} />
            <span className="font-mono text-code text-ink-secondary">PMID {article.pmid}</span>
          </div>
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
