import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

const options = ["Buscar no PubMed", "Chat de IA genérico", "Lúmen"] as const;

// Só afirmações verificáveis sobre o próprio Lúmen; nada de números nem nomes de outros produtos.
const rows: { criterion: string; answers: [string, string, string] }[] = [
  {
    criterion: "Como você pergunta",
    answers: [
      "Em inglês, com termos MeSH e operadores de busca.",
      "Em português, como numa conversa.",
      "Em português, como falaria com um colega.",
    ],
  },
  {
    criterion: "O que você recebe",
    answers: [
      "Uma lista de artigos em inglês para ler um a um.",
      "Um texto pronto, sem mostrar de onde veio cada afirmação.",
      "Um resumo em português, com o número do artigo em cada afirmação.",
    ],
  },
  {
    criterion: "As referências",
    answers: [
      "Reais, mas a escolha e a leitura ficam com você.",
      "Podem não existir: há casos de artigos e autores inventados.",
      "Só artigos que vieram da busca no PubMed, cada um com PMID e link.",
    ],
  },
  {
    criterion: "Nível de evidência",
    answers: [
      "Você identifica pelo tipo de estudo ou pelos filtros.",
      "Raramente informado.",
      "Indicado em cada artigo: revisão sistemática, ensaio clínico, coorte e outros.",
    ],
  },
  {
    criterion: "Quando falta evidência",
    answers: [
      "Poucos resultados, e cabe a você concluir.",
      "Costuma responder mesmo assim.",
      "A resposta diz que a evidência é insuficiente.",
    ],
  },
];

const LUMEN = 2;

export function Comparison() {
  return (
    <section aria-labelledby="por-que" className="border-t border-line">
      <Container className="py-24">
        <SectionHeading id="por-que" eyebrow="Por que o Lúmen" title="A rapidez do chat, a confiança do PubMed." />
        <p className="mt-6 max-w-[68ch] text-body text-ink-secondary">
          O PubMed é a fonte certa, mas pede tempo e inglês técnico. Um chat de IA responde rápido, mas não
          mostra de onde tirou a resposta. O Lúmen junta as duas coisas.
        </p>

        {/* Telas largas: tabela lado a lado. */}
        <div className="mt-12 hidden md:block">
          <table className="w-full table-fixed border-separate border-spacing-0 text-left">
            <caption className="sr-only">Comparação entre buscar no PubMed, um chat de IA genérico e o Lúmen</caption>
            <thead>
              <tr>
                <td className="w-[22%]" />
                {options.map((option, i) => (
                  <th
                    key={option}
                    scope="col"
                    className={cn(
                      "px-5 pb-4 align-bottom text-body-sm font-medium text-ink-secondary",
                      i === LUMEN && "rounded-t-2xl border-x border-t border-line bg-surface-raised pt-5 text-ink",
                    )}
                  >
                    {option}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={row.criterion}>
                  <th scope="row" className="border-t border-line py-5 pr-5 align-top text-body-sm font-medium text-ink">
                    {row.criterion}
                  </th>
                  {row.answers.map((answer, i) => (
                    <td
                      key={i}
                      className={cn(
                        "border-t border-line px-5 py-5 align-top text-body-sm text-ink-secondary",
                        i === LUMEN && "border-x bg-surface-raised text-ink",
                        i === LUMEN && r === rows.length - 1 && "rounded-b-2xl border-b",
                      )}
                    >
                      {answer}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Celular: um cartão por critério. */}
        <ul className="mt-10 space-y-4 md:hidden">
          {rows.map((row) => (
            <li key={row.criterion} className="rounded-2xl border border-line p-4">
              <h3 className="text-body font-medium text-ink">{row.criterion}</h3>
              <dl className="mt-3 space-y-3">
                {row.answers.map((answer, i) => (
                  <div
                    key={options[i]}
                    className={cn(i === LUMEN && "-mx-2 rounded-xl bg-surface-raised p-2")}
                  >
                    <dt className={cn("text-body-sm", i === LUMEN ? "font-medium text-ink" : "text-ink-secondary")}>
                      {options[i]}
                    </dt>
                    <dd className={cn("text-body-sm", i === LUMEN ? "text-ink" : "text-ink-secondary")}>{answer}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
