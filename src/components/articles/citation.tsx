import { cn } from "@/lib/utils";

/** Número de citação [n] em `lumen`, peso 500. Aponta para o card `#artigo-n`. */
export function Citation({ n, className }: { n: number; className?: string }) {
  return (
    <a
      href={`#artigo-${n}`}
      className={cn("rounded-sm font-medium text-lumen no-underline", className)}
      aria-label={`Referência ${n}`}
    >
      [{n}]
    </a>
  );
}
