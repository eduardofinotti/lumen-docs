import Link from "next/link";
import { PanelLeftOpen } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppHeader({
  credits,
  showMenuButton,
  menuOpen,
  onOpenMenu,
}: {
  credits: number;
  /** No desktop, o botão só aparece com a sidebar recolhida; no celular, sempre. */
  showMenuButton: boolean;
  /** Estado do menu no celular (no desktop o botão só existe com a sidebar recolhida). */
  menuOpen: boolean;
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 bg-surface">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
        <Button
          variant="tertiary"
          size="icon-sm"
          onClick={onOpenMenu}
          aria-label="Abrir menu"
          aria-controls="menu-lateral"
          aria-expanded={menuOpen}
          className={cn(!showMenuButton && "lg:hidden")}
        >
          <PanelLeftOpen className="size-5 text-ink-secondary" aria-hidden="true" />
        </Button>
        <Logo size="sm" href="/pesquisa" className={cn(!showMenuButton && "lg:hidden")} />

        <Link
          href="/conta"
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3.5 text-body-sm text-ink-secondary hover:border-line-strong"
          aria-label={`${credits} créditos restantes. Ver minha conta`}
        >
          <span className="font-medium text-ink">{credits}</span>
          {credits === 1 ? "crédito" : "créditos"}
        </Link>
      </div>
    </header>
  );
}
