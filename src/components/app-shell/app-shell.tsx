"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { SearchSummary } from "@/types/search";
import { AppHeader } from "./app-header";
import { Sidebar } from "./sidebar";

const SIDEBAR_STORAGE_KEY = "lumen-menu-recolhido";
const DESKTOP_QUERY = "(min-width: 64rem)";

export interface ShellUser {
  fullName: string;
  credits: number;
  isAdmin: boolean;
}

/**
 * Moldura das telas logadas. No desktop a sidebar fica fixa e pode ser recolhida
 * (preferência lembrada no navegador); no celular abre por cima do conteúdo.
 */
export function AppShell({
  user,
  recent,
  children,
}: {
  user: ShellUser;
  recent: SearchSummary[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1") setDesktopOpen(false);
    } catch {
      // armazenamento indisponível: mantém aberta
    }
  }, []);

  // Fecha o menu do celular ao trocar de página.
  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    // Com o menu aberto no celular, a página de trás não rola junto.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [mobileOpen]);

  const setOpen = useCallback((open: boolean) => {
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      setDesktopOpen(open);
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, open ? "0" : "1");
      } catch {
        // ignora
      }
    } else {
      setMobileOpen(open);
    }
  }, []);

  return (
    <div className="min-h-dvh lg:flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        id="menu-lateral"
        aria-label="Menu"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] overscroll-contain border-r border-line bg-surface-raised transition-transform duration-200",
          "lg:sticky lg:top-0 lg:h-dvh lg:shrink-0 lg:translate-x-0 lg:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full max-lg:invisible",
          !desktopOpen && "lg:hidden",
        )}
      >
        <Sidebar user={user} recent={recent} onClose={() => setOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          credits={user.credits}
          showMenuButton={!desktopOpen}
          menuOpen={mobileOpen}
          onOpenMenu={() => setOpen(true)}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
