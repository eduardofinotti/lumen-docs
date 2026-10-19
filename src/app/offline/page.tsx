import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sem conexão" };

/** Mostrada pelo service worker quando uma página não carrega por falta de internet. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <LogoMark size={40} />
      <h1 className="mt-6 font-display text-display-md">Sem conexão</h1>
      <p className="mt-3 text-body text-ink-secondary">
        O Lúmen precisa de internet para buscar os artigos. Confira o Wi-Fi ou os dados móveis e tente de novo.
      </p>
      <Button asChild className="mt-8">
        <Link href="/pesquisa">Tentar de novo</Link>
      </Button>
    </main>
  );
}
