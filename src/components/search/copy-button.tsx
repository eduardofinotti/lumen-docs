"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({ text, label = "Copiar com referências" }: { text: string; label?: string }) {
  const [status, setStatus] = useState<"idle" | "copiado" | "erro">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const t = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copiado");
    } catch {
      setStatus("erro");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="sm" onClick={copy}>
        {status === "copiado" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {status === "copiado" ? "Copiado" : label}
      </Button>
      <span role="status" className="text-body-sm text-danger empty:hidden">
        {status === "erro" && "Não foi possível copiar. Selecione o texto e copie manualmente."}
      </span>
    </div>
  );
}
