import type { Metadata } from "next";
import { SavedList } from "@/components/saved/saved-list";
import { CopyButton } from "@/components/search/copy-button";
import { listSavedArticles } from "@/lib/data/saved";
import { formatVancouver } from "@/lib/vancouver";

export const metadata: Metadata = { title: "Artigos salvos" };

export default async function SalvosPage() {
  const articles = await listSavedArticles();
  const allReferences = articles.map((a, i) => `${i + 1}. ${formatVancouver(a)}`).join("\n");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6 sm:pt-10">
      <h1 className="font-display text-display-md">Artigos salvos</h1>
      <p className="mt-2 text-body text-ink-secondary">
        Os artigos que você marcou nas respostas, do mais recente para o mais antigo.
      </p>

      {articles.length === 0 ? (
        <div className="mt-10 rounded-lg border border-line bg-surface-raised p-6">
          <p className="text-body text-ink">
            Você ainda não salvou artigos. Use o marcador nos cards de uma resposta.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <CopyButton text={`Referências\n${allReferences}`} label="Copiar todas as referências" />
          </div>
          <SavedList articles={articles} />
        </>
      )}
    </div>
  );
}
