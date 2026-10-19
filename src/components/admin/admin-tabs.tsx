import Link from "next/link";
import { cn } from "@/lib/utils";

export type AdminTab = "geral" | "usuarios" | "codigos";

const tabs: { id: AdminTab; label: string; href: string }[] = [
  { id: "geral", label: "Visão geral", href: "/admin" },
  { id: "usuarios", label: "Usuários", href: "/admin?aba=usuarios" },
  { id: "codigos", label: "Códigos de acesso", href: "/admin?aba=codigos" },
];

export function AdminTabs({ current }: { current: AdminTab }) {
  return (
    <nav aria-label="Seções da administração" className="mt-8 -mx-4 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-6">
        {tabs.map((t) => {
          const active = t.id === current;
          return (
            <li key={t.id} className="shrink-0">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex h-11 items-center border-b-2 text-body-sm",
                  active ? "border-ink font-medium text-ink" : "border-transparent text-ink-secondary hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
