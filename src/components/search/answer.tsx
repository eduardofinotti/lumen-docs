import { Fragment } from "react";
import { Citation } from "@/components/articles/citation";
import { CLINICAL_DECISION_NOTE, parseAnswer, type InlineToken } from "@/lib/answer-markdown";

function Inline({
  tokens,
  sourceCount,
  onHighlight,
}: {
  tokens: InlineToken[];
  sourceCount: number;
  onHighlight: (n: number | null) => void;
}) {
  return tokens.map((t, i) => {
    if (t.type === "bold") return <strong key={i} className="font-medium text-ink">{t.value}</strong>;
    // Só vira link a citação que aponta para um artigo da lista.
    if (t.type === "citation") {
      return t.n >= 1 && t.n <= sourceCount ? (
        <Citation key={i} n={t.n} onHighlight={onHighlight} />
      ) : (
        <Fragment key={i}>[{t.n}]</Fragment>
      );
    }
    return <Fragment key={i}>{t.value}</Fragment>;
  });
}

/** Resposta em markdown simples; sempre termina com a nota da decisão clínica. */
export function Answer({
  markdown,
  sourceCount,
  onHighlight,
}: {
  markdown: string;
  sourceCount: number;
  onHighlight: (n: number | null) => void;
}) {
  const blocks = parseAnswer(markdown);
  return (
    <div className="max-w-[68ch] space-y-5 text-body text-ink">
      {blocks.map((block, i) =>
        block.type === "list" ? (
          <ul key={i} className="list-disc space-y-3 pl-5 marker:text-ink-muted">
            {block.items.map((item, j) => (
              <li key={j}>
                <Inline tokens={item} sourceCount={sourceCount} onHighlight={onHighlight} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Inline tokens={block.content} sourceCount={sourceCount} onHighlight={onHighlight} />
          </p>
        ),
      )}
      <p className="border-t border-line pt-5 text-body-sm text-ink-secondary">{CLINICAL_DECISION_NOTE}</p>
    </div>
  );
}
