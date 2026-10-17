import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PesquisaNaoEncontrada() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-[12vh] pb-24 sm:px-6">
      <h1 className="font-display text-display-md">Pesquisa não encontrada</h1>
      <p className="mt-4 text-body text-ink-secondary">
        Ela pode ter sido apagada ou o link está incompleto. Confira o histórico ou faça uma nova pesquisa.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/pesquisa">Nova pesquisa</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/historico">Ver histórico</Link>
        </Button>
      </div>
    </div>
  );
}
