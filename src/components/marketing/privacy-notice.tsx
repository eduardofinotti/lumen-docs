import { Container } from "@/components/layout/container";
import { SectionHeading } from "./section-heading";

export function PrivacyNotice() {
  return (
    <section aria-labelledby="privacidade" className="border-t border-line">
      <Container className="grid gap-10 py-24 lg:grid-cols-2 lg:gap-16">
        <SectionHeading id="privacidade" eyebrow="Privacidade" title="Não é lugar para dados de pacientes." />
        <div className="max-w-[68ch] space-y-5 text-body text-ink-secondary">
          <p>
            Não insira nome, CPF, número de prontuário ou qualquer dado que identifique um paciente.
            Em respeito à LGPD, as perguntas devem ser clínicas e anônimas.
          </p>
          <p>
            O Lúmen resume a literatura científica; ele não indica conduta e não substitui o
            julgamento clínico. A decisão clínica é do médico.
          </p>
        </div>
      </Container>
    </section>
  );
}
