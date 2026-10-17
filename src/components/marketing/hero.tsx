import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { QuestionBoxPreview } from "./question-box-preview";

export function Hero() {
  return (
    <section aria-labelledby="hero-titulo">
      <Container className="flex flex-col items-center pt-16 pb-24 text-center sm:pt-24">
        <LogoMark size={48} />
        <h1
          id="hero-titulo"
          className="mt-8 max-w-3xl font-display text-display-lg text-balance sm:text-display-xl"
        >
          Evidência científica, em português, em segundos.
        </h1>
        <p className="mt-6 max-w-xl text-body text-ink-secondary sm:text-title sm:font-normal">
          Pergunte como falaria com um colega e receba a resposta com os artigos reais que a
          sustentam.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/cadastro">Criar conta</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/entrar">Entrar</Link>
          </Button>
        </div>
        <p className="mt-4 text-body-sm text-ink-secondary">
          Acesso por convite nesta fase inicial.
        </p>
        <div className="mt-16 w-full">
          <QuestionBoxPreview />
        </div>
      </Container>
    </section>
  );
}
