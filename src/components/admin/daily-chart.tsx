const dayFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });

// `day` vem como "2026-10-19" (já no horário de Brasília); meio-dia UTC evita virar o dia.
const label = (day: string) => dayFormat.format(new Date(`${day}T12:00:00Z`));

/** Barras simples, sem biblioteca de gráfico. */
export function DailyChart({ daily }: { daily: { day: string; total: number }[] }) {
  const peak = Math.max(0, ...daily.map((d) => d.total));
  const max = Math.max(1, peak);
  const total = daily.reduce((sum, d) => sum + d.total, 0);
  if (daily.length === 0) return null;

  return (
    <figure>
      <div className="flex h-32 items-end gap-[3px]" aria-hidden="true">
        {daily.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end" title={`${label(d.day)}: ${d.total}`}>
            <div
              className="w-full rounded-t-[3px] bg-ink-secondary group-last:bg-ink"
              style={{ height: d.total === 0 ? "2px" : `${Math.max(6, (d.total / max) * 100)}%`, opacity: d.total === 0 ? 0.25 : 1 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-body-sm text-ink-secondary" aria-hidden="true">
        <span>{label(daily[0].day)}</span>
        <span>hoje</span>
      </div>
      <figcaption className="mt-3 text-body-sm text-ink-secondary">
        {total === 1 ? "1 pergunta" : `${total} perguntas`} no período{peak > 0 && ` · no máximo ${peak} em um dia`}.
      </figcaption>
    </figure>
  );
}
