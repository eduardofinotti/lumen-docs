import type { BeforeInstallPromptEvent } from "@/types/pwa";

/** Como oferecer a instalação: cada navegador tem um caminho diferente. */
export type InstallMode = "instalado" | "botao" | "ios" | "manual";

export function installMode({
  standalone,
  canPrompt,
  ios,
}: {
  /** O Lúmen já está aberto como app (pela tela inicial). */
  standalone: boolean;
  /** O navegador entregou o pedido de instalação (Chrome, Edge, Samsung Internet). */
  canPrompt: boolean;
  ios: boolean;
}): InstallMode {
  if (standalone) return "instalado";
  if (canPrompt) return "botao";
  return ios ? "ios" : "manual";
}

/** iPhone e iPad (o iPad se apresenta como Mac, mas tem tela de toque). */
export function isIosDevice(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true;
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

// ------------------------------------------------ pedido de instalação (navegador)

// O navegador dispara o evento uma vez, logo ao carregar; guardamos para usar depois,
// em qualquer tela.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function captureInstallPrompt(): () => void {
  const onPrompt = (e: Event) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  };
  const onInstalled = () => {
    deferred = null;
    notify();
  };
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasInstallPrompt(): boolean {
  return deferred !== null;
}

/** Abre a janela de instalação do navegador. `true` se o médico aceitou. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  notify();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === "accepted";
}
