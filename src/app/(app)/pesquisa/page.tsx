// Provisório até a etapa 4: confirma que a rota protegida e o "Sair" funcionam.
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default function PesquisaPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <h1 className="font-display text-display-md">Pesquisa</h1>
      <p className="mt-4 text-body text-ink-secondary">A tela de pesquisa chega na etapa 4.</p>
      <form action={signOut} className="mt-8">
        <Button type="submit" variant="secondary">
          Sair
        </Button>
      </form>
    </main>
  );
}
