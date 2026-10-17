import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SearchStatus } from "@/types/search";

const messages: Record<Exclude<SearchStatus, "done">, { title: string; body: string }> = {
  no_evidence: {
    title: "Não encontramos artigos para essa pergunta",
    body: "Tente ampliar o período para “Qualquer data” ou escrever a pergunta com termos mais gerais, sem detalhes muito específicos.",
  },
  error: {
    title: "Não conseguimos concluir esta pesquisa",
    body: "Houve uma falha ao buscar ou resumir os artigos. Faça a pergunta de novo em instantes.",
  },
  pending: {
    title: "Esta pesquisa ainda está em andamento",
    body: "Atualize a página em alguns segundos para ver a resposta.",
  },
};

/** Lugar da resposta quando a pesquisa não terminou com artigos. */
export function SearchStatusMessage({ status }: { status: Exclude<SearchStatus, "done"> }) {
  const { title, body } = messages[status];
  return (
    <section className="max-w-2xl rounded-lg border border-line bg-surface-raised p-6" aria-labelledby="situacao">
      <h2 id="situacao" className="text-title text-ink">
        {title}
      </h2>
      <p className="mt-2 text-body text-ink-secondary">{body}</p>
      {status !== "pending" && (
        <Button variant="secondary" className="mt-6" asChild>
          <Link href="/pesquisa">Fazer nova pesquisa</Link>
        </Button>
      )}
    </section>
  );
}
