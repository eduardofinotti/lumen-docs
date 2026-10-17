"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const options: { id: Theme; label: string }[] = [
  { id: "claro", label: "Claro" },
  { id: "escuro", label: "Escuro" },
];

/** Tema claro (padrão) ou escuro. Fica salvo neste navegador; o ThemeScript aplica antes da página aparecer. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("claro");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "escuro" : "claro");
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "escuro");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // navegação privada: o tema vale só até fechar a aba
    }
  }

  return (
    <fieldset>
      <legend className="sr-only">Tema</legend>
      <div className="inline-flex rounded-md border border-line-strong p-1">
        {options.map((o) => (
          <label
            key={o.id}
            className={cn(
              "flex h-9 cursor-pointer items-center rounded-sm px-4 text-body-sm text-ink-secondary has-[:focus-visible]:shadow-focus",
              theme === o.id && "bg-surface-sunken font-medium text-ink",
            )}
          >
            <input
              type="radio"
              name="tema"
              value={o.id}
              checked={theme === o.id}
              onChange={() => choose(o.id)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
