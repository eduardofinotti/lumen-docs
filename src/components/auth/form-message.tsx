import { cn } from "@/lib/utils";

/** Mensagem geral do formulário (erro do servidor ou confirmação). */
export function FormMessage({
  tone,
  children,
}: {
  tone: "error" | "info";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-4 py-3 text-body-sm",
        tone === "error" ? "border-danger/40 text-danger" : "border-line bg-surface-raised text-ink",
      )}
    >
      {children}
    </p>
  );
}
