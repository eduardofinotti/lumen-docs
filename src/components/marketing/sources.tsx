import { Container } from "@/components/layout/container";

export function Sources() {
  return (
    <section aria-labelledby="fontes" className="border-t border-line">
      <Container className="flex flex-col gap-6 py-16 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="fontes" className="label-caps">
          Fontes
        </h2>
        <div className="sm:text-right">
          <p className="font-display text-display-md text-ink-muted">PubMed</p>
          <p className="mt-1 text-body-sm text-ink-secondary">Em breve: Semantic Scholar e arXiv.</p>
        </div>
      </Container>
    </section>
  );
}
