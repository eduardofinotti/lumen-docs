import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listConversations } from "@/lib/data/conversations";
import { formatDateTime } from "@/lib/format";
import type { SearchStatus } from "@/types/search";

export const metadata: Metadata = { title: "Histórico" };

const HISTORY_LIMIT = 100;

/** Só as pesquisas sem resposta ganham etiqueta; as concluídas são o caso normal. */
const statusLabels: Partial<Record<SearchStatus, string>> = {
  no_evidence: "Sem artigos",
  error: "Não concluída",
  pending: "Em andamento",
};

export default async function HistoricoPage() {
  const searches = await listConversations(HISTORY_LIMIT);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6 sm:pt-10">
      <h1 className="font-display text-display-md">Histórico</h1>
      <p className="mt-2 text-body text-ink-secondary">
        Suas pesquisas, da mais recente para a mais antiga. Abra uma para ver a resposta e os artigos.
      </p>

      {searches.length === 0 ? (
        <div className="mt-10 rounded-lg border border-line bg-surface-raised p-6">
          <p className="text-body text-ink">Você ainda não fez nenhuma pesquisa.</p>
          <Button className="mt-6" asChild>
            <Link href="/pesquisa">Fazer a primeira pesquisa</Link>
          </Button>
        </div>
      ) : (
        <ol className="mt-10 divide-y divide-line rounded-lg border border-line bg-surface-raised">
          {searches.map((s) => {
            const label = statusLabels[s.status];
            return (
              <li key={s.id} className="first:rounded-t-lg last:rounded-b-lg">
                <Link
                  href={`/pesquisa/${s.id}`}
                  className="focus-ring relative block rounded-[inherit] px-6 py-4 hover:bg-surface-sunken focus-visible:z-10"
                >
                  <span className="block text-body text-ink">{s.question}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 text-body-sm text-ink-secondary">
                    <time dateTime={s.updatedAt}>{formatDateTime(s.updatedAt)}</time>
                    {label && <span className="rounded-full border border-line-strong px-2 text-body-sm">{label}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      {searches.length === HISTORY_LIMIT && (
        <p className="mt-4 text-body-sm text-ink-secondary">Mostrando as {HISTORY_LIMIT} pesquisas mais recentes.</p>
      )}
    </div>
  );
}
