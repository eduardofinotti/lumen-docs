import Link from "next/link";
import { Container } from "@/components/layout/container";

const linkClass =
  "rounded-sm text-ink-secondary underline-offset-4 hover:text-ink hover:underline";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line">
      <Container className="flex flex-col gap-4 py-10 text-body-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink-secondary">
          <span className="font-display text-ink">Lúmen</span> · {year}
        </p>
        <nav aria-label="Rodapé" className="flex gap-6">
          <Link href="/termos" className={linkClass}>
            Termos de uso
          </Link>
          <Link href="/privacidade" className={linkClass}>
            Privacidade
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
