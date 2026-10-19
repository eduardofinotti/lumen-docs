import { outcomeShares } from "@/lib/admin";
import { specialtyLabel } from "@/lib/specialties";
import { cn } from "@/lib/utils";
import type { AdminOverview } from "@/types/admin";
import { DailyChart } from "./daily-chart";

const number = new Intl.NumberFormat("pt-BR");

function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-raised p-4 sm:p-5">
      <p className="text-body-sm text-ink-secondary">{label}</p>
      <p className="mt-1 font-display text-display-md text-ink">{number.format(value)}</p>
      {note && <p className="mt-1 text-body-sm text-ink-secondary">{note}</p>}
    </div>
  );
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-line bg-surface-raised p-4 sm:p-6", className)}>
      <h2 className="label-caps">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Overview({ data }: { data: AdminOverview }) {
  const outcomes = { done: data.statusDone, noEvidence: data.statusNoEvidence, error: data.statusError };
  const shares = outcomeShares(outcomes);
  const answered = outcomes.done + outcomes.noEvidence + outcomes.error;
  const rows = [
    { key: "done", label: "Com resposta", value: outcomes.done, share: shares.done, color: "bg-evidence-high" },
    { key: "noEvidence", label: "Sem evidência", value: outcomes.noEvidence, share: shares.noEvidence, color: "bg-evidence-mid" },
    { key: "error", label: "Com erro", value: outcomes.error, share: shares.error, color: "bg-danger" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Médicos cadastrados" value={data.usersTotal} note={`+${data.usersNew7d} em 7 dias · +${data.usersNew30d} em 30`} />
        <Stat label="Ativos em 7 dias" value={data.usersActive7d} note="fizeram ao menos uma pergunta" />
        <Stat label="Perguntas" value={data.questions} note={`${number.format(data.questions7d)} nos últimos 7 dias`} />
        <Stat label="Conversas" value={data.conversations} note={`${number.format(data.savedArticles)} artigos salvos`} />
      </div>

      <Card title="Perguntas por dia · últimos 30 dias">
        <DailyChart daily={data.daily} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Resultado das perguntas">
          {answered === 0 ? (
            <p className="text-body-sm text-ink-secondary">Nenhuma pergunta respondida ainda.</p>
          ) : (
            <>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                {rows.map((r) => (
                  <div key={r.key} className={r.color} style={{ width: `${r.share}%` }} />
                ))}
              </div>
              <ul className="mt-4 space-y-2">
                {rows.map((r) => (
                  <li key={r.key} className="flex items-center gap-3 text-body-sm">
                    <span className={cn("size-2.5 shrink-0 rounded-full", r.color)} aria-hidden="true" />
                    <span className="flex-1 text-ink">{r.label}</span>
                    <span className="text-ink-secondary tabular-nums">
                      {number.format(r.value)} · {r.share}%
                    </span>
                  </li>
                ))}
              </ul>
              {data.statusError > 0 && (
                <p className="mt-4 text-body-sm text-ink-secondary">
                  Erros costumam vir do PubMed ou da IA fora do ar. O crédito dessas perguntas foi devolvido.
                </p>
              )}
            </>
          )}
        </Card>

        <Card title="Especialidades">
          {data.specialties.length === 0 ? (
            <p className="text-body-sm text-ink-secondary">Nenhum médico cadastrado ainda.</p>
          ) : (
            <ul className="space-y-2">
              {data.specialties.map((s) => (
                <li key={s.specialty} className="flex items-center justify-between gap-3 text-body-sm">
                  <span className="text-ink">{specialtyLabel(s.specialty) ?? "Não informada"}</span>
                  <span className="text-ink-secondary tabular-nums">{number.format(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
          {data.usersBlocked > 0 && (
            <p className="mt-4 text-body-sm text-ink-secondary">
              {data.usersBlocked === 1 ? "1 médico com acesso suspenso." : `${data.usersBlocked} médicos com acesso suspenso.`}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
