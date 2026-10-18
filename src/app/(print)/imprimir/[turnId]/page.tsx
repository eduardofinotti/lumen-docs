import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { PrintControls } from "@/components/print/print-controls";
import { Answer } from "@/components/search/answer";
import { getTurn } from "@/lib/data/conversations";
import { dateRangeLabel } from "@/lib/date-range";
import { pubmedUrl } from "@/lib/evidence";
import { formatDateTime } from "@/lib/format";
import { formatVancouver } from "@/lib/vancouver";

type Params = Promise<{ turnId: string }>;

/** Só respostas concluídas do próprio médico (a leitura passa pela RLS). */
async function load(turnId: string) {
  const found = await getTurn(turnId);
  return found && found.turn.status === "done" ? found : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = await load((await params).turnId);
  // O título vira o nome sugerido do arquivo PDF.
  return { title: found ? (found.turn.standaloneQuestion ?? found.conversation.title) : "Resposta não encontrada" };
}

export default async function ImprimirPage({ params }: { params: Params }) {
  const found = await load((await params).turnId);
  if (!found) notFound();
  const { conversation, turn } = found;

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 print:max-w-none print:p-0">
      <PrintControls />

      <header className="border-b border-line pb-6">
        <Logo size="sm" />
        <h1 className="mt-6 font-display text-display-md text-balance">
          {turn.standaloneQuestion ?? conversation.title}
        </h1>
        <p className="mt-3 text-body-sm text-ink-secondary">
          {formatDateTime(turn.createdAt)} · Publicações: {dateRangeLabel(conversation.dateRange).toLowerCase()} ·
          Fonte: PubMed
        </p>
      </header>

      <section aria-labelledby="resposta" className="mt-8">
        <h2 id="resposta" className="label-caps">
          Resposta
        </h2>
        <div className="mt-4">
          <Answer markdown={turn.answerMd} sourceCount={turn.sources.length} anchorFor={(n) => `#ref-${n}`} />
        </div>
      </section>

      {turn.sources.length > 0 && (
        <section aria-labelledby="referencias" className="mt-10 break-inside-avoid-page">
          <h2 id="referencias" className="label-caps">
            Referências
          </h2>
          <ol className="mt-4 space-y-3 text-body-sm text-ink">
            {turn.sources.map((article, i) => (
              <li key={article.pmid} id={`ref-${i + 1}`} className="grid grid-cols-[2rem_1fr] break-inside-avoid">
                <span className="font-medium text-lumen">[{i + 1}]</span>
                <span>
                  {formatVancouver(article)}{" "}
                  <a href={pubmedUrl(article.pmid)} className="break-all text-ink-secondary underline">
                    {pubmedUrl(article.pmid)}
                  </a>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="mt-12 border-t border-line pt-4 text-body-sm text-ink-secondary">
        Gerado pelo Lúmen. Resposta baseada apenas nos artigos listados; não substitui o julgamento clínico.
      </footer>
    </article>
  );
}
