import { ArticleCard } from "@/components/articles/article-card";
import { Citation } from "@/components/articles/citation";
import { Container } from "@/components/layout/container";
import { landingExampleArticle } from "@/lib/mocks/landing";
import { SectionHeading } from "./section-heading";

const principles = [
  "A resposta só cita artigos que vieram da busca. O Lúmen nunca inventa referência.",
  "Cada afirmação tem um número que leva ao artigo no PubMed, identificado pelo PMID.",
  "O nível de evidência de cada artigo aparece ao lado dele: revisão sistemática, ensaio clínico, coorte e outros.",
  "Quando a evidência é insuficiente, a resposta diz isso antes de qualquer síntese.",
];

export function Trust() {
  return (
    <section aria-labelledby="confianca" className="border-t border-line">
      <Container className="grid gap-12 py-24 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading id="confianca" eyebrow="Confiança" title="Só cita o que encontrou." />
          <ul className="mt-10 space-y-5">
            {principles.map((p) => (
              <li key={p} className="max-w-[68ch] border-l border-line-strong pl-4 text-body text-ink-secondary">
                {p}
              </li>
            ))}
          </ul>
        </div>

        <figure className="space-y-4 self-center">
          <figcaption className="label-caps">Exemplo de resposta</figcaption>
          <p className="text-body text-ink">
            No Diabetes Prevention Program, a metformina reduziu a incidência de diabetes tipo 2 em
            adultos com glicemia alterada, com efeito menor que o da intervenção no estilo de vida{" "}
            <Citation n={1} />.
          </p>
          <ArticleCard article={landingExampleArticle} index={1} />
        </figure>
      </Container>
    </section>
  );
}
