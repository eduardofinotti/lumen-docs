import { Container } from "@/components/layout/container";
import { SectionHeading } from "./section-heading";

// Só o que o Lúmen faz hoje; nada de números nem promessas.
const features = [
  {
    title: "A conclusão logo no topo",
    text: "Cada resposta abre com uma frase de resumo e a força da evidência (alta, moderada, baixa ou insuficiente), com o motivo. Para quando há só um minuto entre pacientes.",
  },
  {
    title: "Aviso de artigo retratado",
    text: "Se a revista retirou o artigo, ele aparece marcado e não sustenta a resposta. O card também mostra o tamanho da amostra, quando o resumo informa.",
  },
  {
    title: "Pergunte por voz",
    text: "No celular, toque no microfone e fale a dúvida. O texto aparece na caixa para você conferir antes de pesquisar.",
  },
  {
    title: "Envie para um colega",
    text: "Mande a resposta pelo WhatsApp, com as referências, em um toque. Só o texto: nada fica público na internet.",
  },
  {
    title: "Continue a conversa",
    text: "Depois da primeira resposta, pergunte “e na gestante?” ou “qual era a amostra?”. O Lúmen entende o contexto e busca de novo quando precisa.",
  },
  {
    title: "Guarde e cite",
    text: "Salve artigos numa lista, copie a referência em Vancouver e baixe a resposta em PDF.",
  },
];

export function Features() {
  return (
    <section aria-labelledby="no-dia-a-dia" className="border-t border-line">
      <Container className="py-24">
        <SectionHeading id="no-dia-a-dia" eyebrow="No dia a dia" title="Feito para a rotina do consultório." />
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="border-t border-line pt-5">
              <h3 className="text-title">{f.title}</h3>
              <p className="mt-2 text-body text-ink-secondary">{f.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
