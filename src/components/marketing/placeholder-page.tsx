import { Container } from "@/components/layout/container";

/** Página de texto legal ainda não redigida. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <Container className="max-w-3xl py-24">
      <h1 className="font-display text-display-lg">{title}</h1>
      <p className="mt-6 max-w-[68ch] text-body text-ink-secondary">
        Este texto está em elaboração e será publicado antes da abertura da plataforma.
      </p>
    </Container>
  );
}
