"use client";

import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { shareTarget } from "@/lib/share";

/** Envia o texto da resposta: menu de compartilhar do celular ou WhatsApp no computador. */
export function ShareButton({ text }: { text: (siteUrl: string) => string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 8000);
    return () => clearTimeout(t);
  }, [copied]);

  async function share() {
    const message = text(window.location.origin);
    const target = shareTarget({
      canShare: typeof navigator.share === "function",
      touch: window.matchMedia("(pointer: coarse)").matches,
    });
    if (target === "sistema") {
      try {
        await navigator.share({ text: message });
        return;
      } catch (e) {
        // O médico fechou o menu: nada a fazer. Outro erro cai no WhatsApp.
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    // O app do WhatsApp no computador às vezes abre só com o link: o texto fica copiado para colar.
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="sm" onClick={share}>
        <Send aria-hidden="true" />
        Enviar
        <span className="sr-only">a resposta pelo WhatsApp ou outro aplicativo</span>
      </Button>
      <span role="status" className="text-body-sm text-ink-secondary empty:hidden">
        {copied && "Texto copiado. Se o WhatsApp abrir sem ele, cole na conversa."}
      </span>
    </div>
  );
}
