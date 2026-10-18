"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { continueSearch, retryTurn } from "@/app/(app)/pesquisa/actions";
import { FOLLOW_UP_STEPS, SearchProgress } from "@/components/search/search-progress";
import { dateRangeLabel } from "@/lib/date-range";
import { formatDateTime } from "@/lib/format";
import { validateQuestion } from "@/lib/question";
import { MAX_TURNS, type Conversation, type Turn } from "@/types/search";
import { FollowUpBox } from "./follow-up-box";
import { SourcesPanel } from "./sources-panel";
import { QuestionBubble, TurnBlock } from "./turn-block";

/** Tempo de cada etapa do carregamento; a última fica até a resposta chegar. */
const STEP_MS = 2500;

function lastAnswered(turns: Turn[]): Turn | null {
  return [...turns].reverse().find((t) => t.status === "done") ?? null;
}

/**
 * Conversa (layout B): perguntas e respostas numa coluna; no desktop, o painel direito
 * mostra os artigos da resposta selecionada. No celular, os artigos ficam abaixo de cada resposta.
 */
export function ConversationView({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const { turns } = conversation;
  const [selectedId, setSelectedId] = useState<string | null>(() => lastAnswered(turns)?.id ?? null);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scrollTo = useRef<string | null>(null);

  // Depois que a resposta nova chega (router.refresh), seleciona-a e rola até ela.
  const lastId = turns[turns.length - 1]?.id;
  useEffect(() => {
    if (!scrollTo.current || scrollTo.current !== lastId) return;
    const turn = turns.find((t) => t.id === lastId);
    if (turn?.status === "done") setSelectedId(turn.id);
    document.getElementById(`resposta-${turn?.position}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    scrollTo.current = null;
  }, [lastId, turns]);

  const selected = turns.find((t) => t.id === selectedId) ?? null;
  const busy = pending !== null || retryingId !== null;
  const limitReached = turns.filter((t) => t.status !== "error").length >= MAX_TURNS;

  async function withProgress<T>(run: () => Promise<T>): Promise<T> {
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, FOLLOW_UP_STEPS.length - 1)), STEP_MS);
    try {
      return await run();
    } finally {
      clearInterval(timer);
    }
  }

  async function ask(question: string): Promise<boolean> {
    const text = question.trim();
    const problem = validateQuestion(text, { followUp: true });
    if (problem) {
      setError(problem);
      return false;
    }
    setError(null);
    setPending(text);
    requestAnimationFrame(() =>
      document.getElementById("pergunta-pendente")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
    const result = await withProgress(() => continueSearch(conversation.id, text));
    if (!result.ok) {
      setPending(null);
      setError(result.error);
      return false;
    }
    scrollTo.current = result.turnId;
    router.refresh();
    setPending(null);
    return true;
  }

  async function retry(turn: Turn) {
    setError(null);
    setRetryingId(turn.id);
    const result = await withProgress(() => retryTurn(conversation.id, turn.id));
    setRetryingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    scrollTo.current = result.turnId;
    router.refresh();
  }

  /** Clique numa citação: no desktop o card está no painel; no celular, abre a lista da resposta. */
  function cite(turn: Turn, n: number) {
    setSelectedId(turn.id);
    requestAnimationFrame(() => {
      const cards = document.querySelectorAll<HTMLElement>(`[data-anchor="${turn.position}-${n}"]`);
      for (const card of cards) {
        const details = card.closest("details");
        if (details && getComputedStyle(details).display === "none") continue;
        if (details) details.open = true;
        if (card.offsetParent === null && !details) continue;
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <header className="max-w-3xl">
        <p className="label-caps">Pesquisa</p>
        <h1 className="mt-3 font-display text-display-md text-balance">{conversation.title}</h1>
        <p className="mt-4 text-body-sm text-ink-secondary">
          {formatDateTime(conversation.createdAt)} · Publicações: {dateRangeLabel(conversation.dateRange).toLowerCase()}
        </p>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
        <div className="flex min-w-0 flex-col">
          <div className="space-y-12 pb-8">
            {turns.map((turn) =>
              turn.id === retryingId ? (
                <section key={turn.id} className="space-y-5">
                  <QuestionBubble question={turn.question} understood={turn.standaloneQuestion} />
                  <SearchProgress current={step} steps={FOLLOW_UP_STEPS} />
                </section>
              ) : (
                <TurnBlock
                  key={turn.id}
                  turn={turn}
                  title={conversation.title}
                  selected={turn.id === selectedId}
                  highlighted={turn.id === selectedId ? highlighted : null}
                  retrying={busy}
                  onSelect={() => setSelectedId(turn.id)}
                  onHighlight={setHighlighted}
                  onCite={(n) => cite(turn, n)}
                  onRetry={() => retry(turn)}
                />
              ),
            )}
            {pending && (
              <section id="pergunta-pendente" className="scroll-mt-20 space-y-5" aria-live="polite">
                <QuestionBubble question={pending} />
                <SearchProgress current={step} steps={FOLLOW_UP_STEPS} />
              </section>
            )}
          </div>
          <FollowUpBox
            disabled={busy}
            limitReached={limitReached}
            error={error}
            onSubmit={ask}
            onEdit={() => error && setError(null)}
          />
        </div>

        <SourcesPanel
          turn={selected}
          turnNumber={selected ? turns.indexOf(selected) + 1 : 0}
          highlighted={highlighted}
        />
      </div>
    </div>
  );
}
