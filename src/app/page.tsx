// Página provisória da etapa 1: vitrine dos tokens. Será substituída pela landing.
import { Search } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const colors = [
  "surface",
  "surface-raised",
  "surface-sunken",
  "ink",
  "ink-secondary",
  "ink-muted",
  "line",
  "line-strong",
  "lumen",
  "lumen-hover",
  "lumen-tint",
  "on-lumen",
  "evidence-high",
  "evidence-mid",
  "evidence-low",
  "danger",
];

const evidence = [
  { label: "Revisão sistemática", color: "text-evidence-high border-evidence-high/40" },
  { label: "Coorte", color: "text-evidence-mid border-evidence-mid/40" },
  { label: "Relato de caso", color: "text-evidence-low border-evidence-low/40" },
];

export default function DesignSystemPreview() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center gap-8">
        <Logo size="lg" />
        <Logo size="md" />
        <Logo size="sm" />
        <LogoMark size={20} />
      </div>

      <section className="mt-12 space-y-4">
        <p className="label-caps">Tipografia</p>
        <h1 className="font-display text-display-xl">Evidência científica, em português, em segundos.</h1>
        <h2 className="font-display text-display-lg">Display grande</h2>
        <h3 className="font-display text-display-md">Display médio</h3>
        <p className="text-title">Título de card em Geist 500</p>
        <p className="max-w-[68ch] text-body">
          Texto corrido em Geist 400, 16/26, com largura máxima de 68 caracteres. Pergunte como falaria
          com um colega e receba a resposta com os artigos reais que a sustentam.
        </p>
        <p className="text-body-sm text-ink-secondary">Metadados: Silva A, Souza B. Lancet. 2024.</p>
        <p className="font-mono text-code text-ink-secondary">PMID 38912345</p>
      </section>

      <section className="mt-12 space-y-4">
        <p className="label-caps">Botões</p>
        <div className="flex flex-wrap gap-3">
          <Button>
            <Search aria-hidden="true" />
            Pesquisar
          </Button>
          <Button variant="secondary">Entrar</Button>
          <Button variant="tertiary">Nova pesquisa</Button>
          <Button disabled>Desabilitado</Button>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <p className="label-caps">Citação e etiquetas</p>
        <p className="text-body">
          A metformina reduziu a progressão para diabetes tipo 2{" "}
          <span className="font-medium text-lumen">[1]</span>{" "}
          <span className="font-medium text-lumen">[2]</span>.
        </p>
        <div className="flex flex-wrap gap-2">
          {evidence.map((e) => (
            <span key={e.label} className={`rounded-sm border px-2 py-1 text-label uppercase ${e.color}`}>
              {e.label}
            </span>
          ))}
        </div>
        <p className="text-body-sm text-danger">Não insira dados que identifiquem o paciente.</p>
      </section>

      <section className="mt-12 space-y-4">
        <p className="label-caps">Cores</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {colors.map((c) => (
            <div key={c} className="rounded-lg border border-line bg-surface-raised p-3">
              <div className="h-10 rounded-md border border-line" style={{ background: `var(--${c})` }} />
              <p className="mt-2 font-mono text-code text-ink-secondary">{c}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-line bg-surface-raised p-6 shadow-sm">
        <p className="label-caps">Card / caixa de pergunta</p>
        <p className="mt-2 text-body text-ink-muted">
          Metformina reduz a progressão para diabetes em pacientes com pré-diabetes?
        </p>
      </section>
    </main>
  );
}
