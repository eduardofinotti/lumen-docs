import Link from "next/link";
import { ArticleCard } from "@/components/articles/article-card";
import { CopyButton } from "@/components/search/copy-button";
import { formatVancouver } from "@/lib/vancouver";
import type { SavedArticle } from "@/types/article";

/** Lista da página de salvos: cada card com a pergunta de origem e a referência para copiar. */
export function SavedList({ articles }: { articles: SavedArticle[] }) {
  return (
    <ol className="mt-8 space-y-4">
      {articles.map((article, i) => (
        <li key={article.pmid}>
          <ArticleCard
            article={article}
            index={i + 1}
            anchorId={null}
            save={{ searchId: article.searchId, saved: true }}
            footer={
              <div className="space-y-3 border-t border-line pt-3">
                {article.question && (
                  <p className="text-body-sm text-ink-secondary">
                    Veio da pergunta:{" "}
                    {article.searchId ? (
                      <Link
                        href={`/pesquisa/${article.searchId}`}
                        className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                      >
                        {article.question}
                      </Link>
                    ) : (
                      article.question
                    )}
                  </p>
                )}
                <CopyButton text={formatVancouver(article)} label="Copiar referência" />
              </div>
            }
          />
        </li>
      ))}
    </ol>
  );
}
