import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { isDemoMode } from "@/lib/supabase/config";

/** Moldura das telas de autenticação: logo no topo, uma coluna estreita ao centro. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header>
        <Container className="flex h-20 items-center">
          <Logo size="sm" href="/" />
        </Container>
      </header>
      <main className="flex flex-1 justify-center px-4 pt-8 pb-16 sm:pt-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-display-md">{title}</h1>
          {description && <div className="mt-3 text-body text-ink-secondary">{description}</div>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-body-sm text-ink-secondary">{footer}</div>}
          {isDemoMode() && (
            <p className="mt-10 border-t border-line pt-4 text-body-sm text-ink-secondary">
              Modo demonstração: o Supabase ainda não está configurado e os dados são fictícios.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
