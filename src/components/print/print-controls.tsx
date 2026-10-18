"use client";

import { FileDown } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Abre o "Salvar como PDF" do navegador assim que a página e as fontes estão prontas.
 * O botão fica para quem fechou o diálogo; nenhum dos dois aparece no PDF.
 */
export function PrintControls() {
  useEffect(() => {
    // O PDF sai sempre no tema claro, mesmo com o modo escuro ligado no app.
    document.documentElement.classList.remove("dark");
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) window.print();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised p-4 print:hidden">
      <p className="text-body-sm text-ink-secondary">
        No diálogo de impressão, escolha <span className="font-medium text-ink">Salvar como PDF</span>.
      </p>
      <Button size="sm" onClick={() => window.print()}>
        <FileDown aria-hidden="true" />
        Salvar como PDF
      </Button>
    </div>
  );
}
