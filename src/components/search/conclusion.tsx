import { parseInline } from "@/lib/answer-markdown";
import { cn } from "@/lib/utils";
import type { AnswerStrength, Conclusion } from "@/types/search";
import { Inline, type CitationProps } from "./answer";

const strengthStyles: Record<AnswerStrength, { label: string; className: string }> = {
  alta: { label: "Alta", className: "text-evidence-high" },
  moderada: { label: "Moderada", className: "text-evidence-mid" },
  baixa: { label: "Baixa", className: "text-evidence-low" },
  insuficiente: { label: "Insuficiente", className: "text-ink-secondary" },
};

/** "Em resumo" no topo da resposta, com a força geral da evidência. */
export function ConclusionBlock({ conclusion, ...citation }: CitationProps & { conclusion: Conclusion }) {
  const strength = conclusion.strength ? strengthStyles[conclusion.strength] : null;
  return (
    <div className="max-w-[68ch] rounded-lg border border-line bg-surface-raised p-4 sm:p-5">
      <p className="label-caps">Em resumo</p>
      <p className="mt-2 text-body font-medium text-ink">
        <Inline tokens={parseInline(conclusion.text)} {...citation} />
      </p>
      {strength && (
        <p className="mt-3 text-body-sm text-ink-secondary">
          Força da evidência: <span className={cn("font-medium", strength.className)}>{strength.label}</span>
          {conclusion.reason && ` · ${conclusion.reason}`}
        </p>
      )}
    </div>
  );
}
