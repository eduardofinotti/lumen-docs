import { ChevronDown, ExternalLink } from "lucide-react";
import { fullTextUrl, isPreprint } from "@/lib/article-links";
import { formatAuthors } from "@/lib/evidence";
import { cn } from "@/lib/utils";
import type { Article, ArticleSummary } from "@/types/article";
import { EvidenceBadge } from "./evidence-badge";
import { SaveButton } from "./save-button";

const linkLabels = {
  "PubMed Central": "Ler o texto completo (PubMed Central)",
  Revista: "Ver na revista",
  PubMed: "Ver no PubMed",
  medRxiv: "Ver no medRxiv",
} as const;

const sampleFormat = new Intl.NumberFormat("pt-BR");

const summaryLabels: [Exclude<keyof ArticleSummary, "amostra">, string][] = [
  ["pergunta", "Pergunta"],
  ["metodo", "Método"],
  ["resultado", "Resultado"],
  ["limitacao", "Limitação"],
];

/** Resumo em português, recolhido por padrão para a lista ficar curta. */
function ArticleSummaryDetails({ summary }: { summary: ArticleSummary }) {
  return (
    <details className="group rounded-md border border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 py-2 text-body-sm pointer-coarse:min-h-11 font-medium text-ink [&::-webkit-details-marker]:hidden">
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

/** Card de artigo: título, metadados, etiqueta de evidência, PMID e link para o texto completo. */
export function ArticleCard({
  article,
  index,
  highlighted = false,
  anchorId = `artigo-${index}`,
  anchorKey,
  save,
  footer,
  className,
}: {
  article: Article;
  index: number;
  highlighted?: boolean;
  /** `null`: sem id (a mesma resposta aparece no painel e na lista do celular). */
  anchorId?: string | null;
  /** Marca o card para a conversa achar o visível ao clicar numa citação. */
  anchorKey?: string;
  /** Mostra o marcador de salvar; `searchId` é a pesquisa de onde o artigo veio. */
  save?: { searchId: string | null; saved: boolean };
  /** Ações extras abaixo do link (página de salvos). */
  footer?: React.ReactNode;
  className?: string;
}) {
  const link = fullTextUrl(article);
  return (
    <article
      id={anchorId ?? undefined}
      data-anchor={anchorKey}
      className={cn(
        "scroll-mt-24 rounded-lg border border-line bg-surface-raised p-4 transition-colors sm:p-6",
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
            {article.retracted && (
              <span className="inline-flex items-center rounded-sm border border-danger/40 px-2 py-0.5 text-label text-danger uppercase">
                Artigo retratado
              </span>
            )}
            <EvidenceBadge level={article.evidence} />
            {article.summary?.amostra && (
              <span className="text-body-sm text-ink-secondary">
                <span aria-hidden="true">n = {sampleFormat.format(article.summary.amostra)}</span>
                <span className="sr-only">Amostra: {sampleFormat.format(article.summary.amostra)} participantes</span>
              </span>
            )}
            {isPreprint(article) ? (
              <span className="text-body-sm text-ink-secondary">Sem revisão por pares</span>
            ) : (
              <span className="font-mono text-code text-ink-secondary">PMID {article.pmid}</span>
            )}
          </div>
          {article.retracted && (
            <p className="text-body-sm text-danger">
              Este artigo foi retratado pela revista. Os resultados dele não devem ser usados como evidência.
            </p>
          )}
          {article.summary && <ArticleSummaryDetails summary={article.summary} />}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-sm text-body-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink pointer-coarse:min-h-11"
            >
              {linkLabels[link.label]}
              <ExternalLink className="size-3.5 stroke-[1.5] text-ink-secondary" aria-hidden="true" />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
            {save && (
              // A chave inclui o estado do servidor: depois de salvar em outro card, este remonta sincronizado.
              <SaveButton
                key={`${article.pmid}-${save.saved}`}
                pmid={article.pmid}
                searchId={save.searchId}
                initialSaved={save.saved}
              />
            )}
          </div>
          {footer}
        </div>
      </div>
    </article>
  );
}
