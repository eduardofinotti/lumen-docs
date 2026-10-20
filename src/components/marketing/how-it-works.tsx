import { Container } from "@/components/layout/container";
import { SectionHeading } from "./section-heading";

const steps = [
  {
    title: "Pergunte em português",
    text: "Escreva a dúvida clínica como falaria com um colega. Não é preciso conhecer termos MeSH nem operadores de busca.",
  },
  {
    title: "Buscamos no PubMed",
    text: "A pergunta vira uma busca técnica em inglês, com os termos e filtros adequados, feita diretamente na base do PubMed.",
  },
  {
    title: "Você recebe o resumo",
    text: "A conclusão e a força da evidência no topo, depois uma síntese em português em que cada afirmação traz o número do artigo que a sustenta, com o link para o original.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="como-funciona" className="border-t border-line">
      <Container className="py-24">
        <SectionHeading id="como-funciona" eyebrow="Como funciona" title="Três passos, sem termos técnicos." />
        <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className="font-display text-display-md text-ink-muted" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-3 text-title">{step.title}</h3>
              <p className="mt-2 text-body text-ink-secondary">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
