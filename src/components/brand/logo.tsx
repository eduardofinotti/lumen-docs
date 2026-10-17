import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

const sizes: Record<LogoSize, { mark: number; text: string; gap: string }> = {
  sm: { mark: 20, text: "text-title", gap: "gap-2" },
  md: { mark: 28, text: "text-display-md", gap: "gap-2.5" },
  lg: { mark: 40, text: "text-display-lg", gap: "gap-3" },
};

/** Só o símbolo (anel aberto + ponto). Troca para a versão escura no tema escuro. */
export function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/brand/lumen-mark.svg"
        alt=""
        width={size}
        height={size}
        className="dark:hidden"
        priority
      />
      <Image
        src="/brand/lumen-mark-dark.svg"
        alt=""
        width={size}
        height={size}
        className="hidden dark:block"
        priority
      />
    </span>
  );
}

/** Símbolo + nome "Lúmen" em HTML (Fraunces 500). Nunca o wordmark SVG. */
export function Logo({
  size = "md",
  href,
  className,
}: {
  size?: LogoSize;
  href?: string;
  className?: string;
}) {
  const s = sizes[size];
  const content = (
    <>
      <LogoMark size={s.mark} />
      <span className={cn("font-display text-ink", s.text)}>Lúmen</span>
    </>
  );
  const classes = cn("inline-flex items-center", s.gap, className);

  if (href) {
    return (
      <Link href={href} className={cn(classes, "rounded-md")} aria-label="Lúmen, página inicial">
        {content}
      </Link>
    );
  }
  return <span className={classes}>{content}</span>;
}
