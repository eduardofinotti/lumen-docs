"use client";

import { useEffect } from "react";
import { captureInstallPrompt } from "@/lib/pwa/install";

/** Registra o service worker e guarda o pedido de instalação do navegador. */
export function PwaSetup() {
  useEffect(() => {
    // Em desenvolvimento o service worker atrapalharia a recarga automática.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
        console.warn("[Lúmen] service worker não registrado", error);
      });
    }
    return captureInstallPrompt();
  }, []);

  return null;
}
