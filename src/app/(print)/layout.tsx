/** Páginas de impressão: sem sidebar nem cabeçalho do app, sempre no tema claro. */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-surface print:bg-white">{children}</div>;
}
