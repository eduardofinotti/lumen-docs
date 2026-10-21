import { Container } from "@/components/layout/container";

export function Sources() {
  return (
    <section aria-labelledby="fontes" className="border-t border-line">
      <Container className="flex flex-col gap-6 py-16 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="fontes" className="label-caps">
          Fontes
        </h2>
        <div className="sm:text-right">
          <p className="font-display text-display-md text-ink-muted">PubMed · medRxiv</p>
          <p className="mt-1 text-body-sm text-ink-secondary">
            Diretrizes de sociedades brasileiras indexadas no PubMed. Preprints do medRxiv sempre marcados como sem revisão
            por pares.
          </p>
        </div>
      </Container>
    </section>
  );
}
