"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { startSearch } from "@/app/(app)/pesquisa/actions";
import { LogoMark } from "@/components/brand/logo";
import { DEFAULT_DATE_RANGE } from "@/lib/date-range";
import { validateQuestion } from "@/lib/question";
import type { DateRange } from "@/types/search";
import { PatientBanner } from "./patient-banner";
import { QuestionBox } from "./question-box";
import { SEARCH_STEPS, SearchProgress } from "./search-progress";
import { Suggestions } from "./suggestions";

/**
 * Tempo de cada etapa na tela de carregamento. A função não informa o progresso:
 * as duas primeiras etapas avançam por tempo (gerar a busca, consultar o PubMed) e a
 * última ("Lendo e resumindo", a mais longa) fica até a resposta chegar.
 */
const STEP_MS = 2500;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function SearchHome({
  suggestionsTitle,
  suggestions,
}: {
  suggestionsTitle: string;
  suggestions: readonly string[];
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  async function run(text: string) {
    const trimmed = text.trim();
    const problem = validateQuestion(trimmed, { followUp: false });
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setPending(trimmed);
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, SEARCH_STEPS.length - 1)), STEP_MS);
    const [result] = await Promise.all([
      startSearch(trimmed, dateRange),
      wait(STEP_MS * (SEARCH_STEPS.length - 1)),
    ]);
    clearInterval(timer);

    if (!result.ok) {
      setPending(null);
      setError(result.error);
      return;
    }
    setStep(SEARCH_STEPS.length);
    router.push(`/pesquisa/${result.id}`);
  }

  if (pending) {
    return (
      <div className="px-4 pt-12 pb-24 sm:px-6 sm:pt-[12vh]">
        <SearchProgress question={pending} current={step} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-8 pb-24 sm:px-6 sm:pt-[10vh]">
      <div className="flex flex-col items-center text-center">
        <LogoMark size={40} />
        <h1 className="mt-6 font-display text-display-md text-balance sm:text-display-lg">
          Pergunte como falaria com um colega.
        </h1>
      </div>

      <div className="mt-10 space-y-3">
        <PatientBanner />
        <QuestionBox
          value={question}
          onChange={(v) => {
            setQuestion(v);
            if (error) setError(null);
          }}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onSubmit={() => run(question)}
          error={error}
        />
      </div>

      <div className="mt-10">
        <Suggestions
          title={suggestionsTitle}
          questions={suggestions}
          onPick={(q) => {
            setQuestion(q);
            run(q);
          }}
        />
      </div>
    </div>
  );
}
