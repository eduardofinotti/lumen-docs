import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header>
      <Container className="flex h-20 items-center justify-between">
        <Logo size="sm" href="/" />
        <nav aria-label="Principal">
          <Button variant="tertiary" asChild>
            <Link href="/entrar">Entrar</Link>
          </Button>
        </nav>
      </Container>
    </header>
  );
}
