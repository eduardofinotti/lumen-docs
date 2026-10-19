import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { QuestionBoxPreview } from "./question-box-preview";

export function Hero() {
  return (
    <section aria-labelledby="hero-titulo">
      <Container className="flex flex-col items-center pt-10 pb-16 text-center sm:pt-24 sm:pb-24">
        {/* No celular o cabeçalho já mostra o símbolo. */}
        <LogoMark size={48} className="max-sm:hidden" />
        <h1
          id="hero-titulo"
          className="max-w-3xl font-display text-display-lg text-balance max-sm:text-[clamp(30px,8.6vw,40px)] max-sm:leading-[1.12] sm:mt-8 sm:text-display-xl"
        >
          Evidência científica, em português, em segundos.
        </h1>
        <p className="mt-5 max-w-xl text-body text-balance text-ink-secondary sm:mt-6 sm:text-title sm:font-normal">
          Pergunte como falaria com um colega e receba a resposta com os artigos reais que a
          sustentam.
        </p>
        <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3 sm:mt-10 sm:flex sm:w-auto sm:max-w-none">
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
        <div className="mt-12 w-full sm:mt-16">
          <QuestionBoxPreview />
        </div>
      </Container>
    </section>
  );
}
