"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shareTarget } from "@/lib/share";

/** Envia o texto da resposta: menu de compartilhar do celular ou WhatsApp Web no computador. */
export function ShareButton({ text }: { text: (siteUrl: string) => string }) {
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
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }

  return (
    <Button variant="secondary" size="sm" onClick={share}>
      <Send aria-hidden="true" />
      Enviar
      <span className="sr-only">a resposta pelo WhatsApp ou outro aplicativo</span>
    </Button>
  );
}
