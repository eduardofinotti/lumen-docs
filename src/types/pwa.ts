/** Evento `beforeinstallprompt` (Chrome, Edge, Samsung Internet); ainda fora dos tipos do DOM. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}
