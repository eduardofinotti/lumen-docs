"use client";

export function Suggestions({
  title,
  questions,
  onPick,
}: {
  title: string;
  questions: readonly string[];
  onPick: (question: string) => void;
}) {
  return (
    <section aria-labelledby="sugestoes">
      <h2 id="sugestoes" className="label-caps">
        {title}
      </h2>
      <ul className="mt-3 space-y-2">
        {questions.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPick(q)}
              className="w-full rounded-md border border-line px-4 py-2.5 text-left text-body-sm text-ink transition-colors hover:bg-lumen-tint"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
