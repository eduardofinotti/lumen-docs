"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useInstallMode } from "./install-app";

const DISMISS_KEY = "lumen-dica-app-dispensada";

/** Dica discreta na tela inicial, só no celular e enquanto o Lúmen não estiver instalado. */
export function InstallTip() {
  const mode = useInstallMode();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // armazenamento indisponível: mostra a dica
    }
    setVisible(!dismissed && window.matchMedia("(pointer: coarse)").matches);
  }, []);

  if (!visible || (mode !== "botao" && mode !== "ios")) return null;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignora
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-raised py-1 pr-1 pl-4">
      <p className="flex-1 text-body-sm text-ink">
        Use o Lúmen como app.{" "}
        <Link href="/conta#app" className="font-medium underline underline-offset-4">
          Ver como instalar
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar dica"
        className="focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-md text-ink-secondary hover:bg-surface-sunken"
      >
        <X className="size-4 stroke-[1.5]" aria-hidden="true" />
      </button>
    </div>
  );
}
