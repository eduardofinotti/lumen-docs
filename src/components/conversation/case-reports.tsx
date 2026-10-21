"use client";

import { ChevronDown } from "lucide-react";
import { useState, useTransition } from "react";
import { requestCaseReports } from "@/app/(app)/pesquisa/actions";
import { ArticleCard } from "@/components/articles/article-card";
import { Button } from "@/components/ui/button";
import type { Turn } from "@/types/search";

/**
 * "Ver relatos de caso" depois da resposta: busca só relatos de caso sobre o mesmo tema.
 * Lista para consulta, sem nova síntese; fica guardada na resposta.
 */
export function CaseReports({ turn, searchId }: { turn: Turn; searchId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const reports = turn.caseReports;

  if (reports === null) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await requestCaseReports(searchId, turn.id);
              if (!result.ok) setError(result.error);
            })
          }
        >
          {pending ? "Buscando relatos de caso…" : "Ver relatos de caso"}
        </Button>
        <span role="status" className="text-body-sm text-ink-secondary">
          {error ? <span className="text-danger">{error}</span> : !pending && "Usa 1 crédito."}
        </span>
      </div>
    );
  }

  if (reports.length === 0) {
    return <p className="mt-6 text-body-sm text-ink-secondary">Nenhum relato de caso sobre este tema encontrado no PubMed.</p>;
  }

  return (
    <details className="group mt-6" open>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-line bg-surface-raised px-4 text-body-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
        {reports.length === 1 ? "1 relato de caso" : `${reports.length} relatos de caso`}
        <ChevronDown
          className="size-4 stroke-[1.5] text-ink-secondary transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <p className="mt-3 text-body-sm text-ink-secondary">
        Cada relato descreve um paciente. Servem para reconhecer apresentações raras, não como evidência para conduta.
      </p>
      <ol className="mt-3 space-y-4">
        {reports.map((article) => (
          <li key={article.pmid}>
            <ArticleCard article={article} />
          </li>
        ))}
      </ol>
    </details>
  );
}
