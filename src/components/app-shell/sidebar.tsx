"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, History, House, LogOut, PanelLeftClose, Plus, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SearchSummary } from "@/types/search";
import type { ShellUser } from "./app-shell";

const RECENT_LIMIT = 8;

const itemClass =
  "flex h-10 w-full items-center gap-3 rounded-md px-3 text-body-sm text-ink hover:bg-surface-sunken active:bg-surface-sunken pointer-coarse:h-11";

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(itemClass, active && "bg-surface-sunken font-medium")}
    >
      <Icon
        className={cn("size-4 stroke-[1.5]", active ? "text-lumen" : "text-ink-secondary")}
        aria-hidden="true"
      />
      {label}
    </Link>
  );
}

export function Sidebar({
  user,
  recent,
  onClose,
}: {
  user: ShellUser;
  recent: SearchSummary[];
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between pr-2 pl-5">
        <Logo size="sm" href="/pesquisa" />
        <Button variant="tertiary" size="icon-sm" onClick={onClose} aria-label="Recolher menu">
          <PanelLeftClose className="size-5 text-ink-secondary" aria-hidden="true" />
        </Button>
      </div>

      <div className="px-3">
        <Button variant="secondary" asChild className="w-full justify-start">
          <Link href="/pesquisa">
            <Plus aria-hidden="true" />
            Nova pesquisa
          </Link>
        </Button>
      </div>

      <nav aria-label="Navegação principal" className="mt-4 space-y-1 px-3">
        <NavItem href="/pesquisa" icon={House} label="Início" active={pathname === "/pesquisa"} />
        <NavItem href="/historico" icon={History} label="Histórico" active={pathname === "/historico"} />
        <NavItem href="/salvos" icon={Bookmark} label="Artigos salvos" active={pathname === "/salvos"} />
      </nav>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <h2 className="label-caps px-3">Recentes</h2>
        {recent.length === 0 ? (
          <p className="mt-3 px-3 text-body-sm text-ink-secondary">Suas pesquisas aparecem aqui.</p>
        ) : (
          <ul className="mt-2 space-y-0.5">
            {recent.slice(0, RECENT_LIMIT).map((s) => {
              const href = `/pesquisa/${s.id}`;
              const active = pathname === href;
              return (
                <li key={s.id}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    title={s.question}
                    className={cn(
                      "block truncate rounded-md px-3 py-2 text-body-sm pointer-coarse:py-3 text-ink-secondary hover:bg-surface-sunken hover:text-ink",
                      active && "bg-surface-sunken text-ink",
                    )}
                  >
                    {s.question}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="space-y-1 border-t border-line p-3">
        <NavItem href="/conta" icon={UserRound} label={user.fullName || "Minha conta"} active={pathname === "/conta"} />
        <form action={signOut}>
          <button type="submit" className={itemClass}>
            <LogOut className="size-4 stroke-[1.5] text-ink-secondary" aria-hidden="true" />
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
