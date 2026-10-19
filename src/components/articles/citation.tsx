import { cn } from "@/lib/utils";

/**
 * Número de citação [n] em `lumen`, peso 500. Aponta para o card `#artigo-n`;
 * `onHighlight` avisa quando o leitor passa o mouse ou o foco, para destacar o card.
 */
export function Citation({
  n,
  onHighlight,
  href = `#artigo-${n}`,
  onCite,
  className,
}: {
  n: number;
  onHighlight?: (n: number | null) => void;
  href?: string;
  /** Quando existe, o clique é tratado aqui (ex.: abrir e rolar até o card certo da conversa). */
  onCite?: (n: number) => void;
  className?: string;
}) {
  return (
    <a
      href={href}
      onClick={
        onCite &&
        ((e) => {
          e.preventDefault();
          onCite(n);
        })
      }
      onMouseEnter={onHighlight && (() => onHighlight(n))}
      onMouseLeave={onHighlight && (() => onHighlight(null))}
      onFocus={onHighlight && (() => onHighlight(n))}
      onBlur={onHighlight && (() => onHighlight(null))}
      className={cn("rounded-sm font-medium text-lumen no-underline pointer-coarse:px-0.5 pointer-coarse:py-2.5", className)}
      aria-label={`Referência ${n}`}
    >
      [{n}]
    </a>
  );
}
