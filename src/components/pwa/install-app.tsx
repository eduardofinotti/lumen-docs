"use client";

import { Download } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  hasInstallPrompt,
  installMode,
  isIosDevice,
  promptInstall,
  subscribeInstallPrompt,
  type InstallMode,
} from "@/lib/pwa/install";

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/** Qual caminho de instalação mostrar; `null` até ler o navegador (evita piscar no servidor). */
export function useInstallMode(): InstallMode | null {
  const canPrompt = useSyncExternalStore(subscribeInstallPrompt, hasInstallPrompt, () => false);
  const [device, setDevice] = useState<{ standalone: boolean; ios: boolean } | null>(null);

  useEffect(() => {
    setDevice({ standalone: isStandalone(), ios: isIosDevice(navigator.userAgent, navigator.maxTouchPoints) });
  }, []);

  return device ? installMode({ ...device, canPrompt }) : null;
}

const steps: Record<"ios" | "manual", string[]> = {
  ios: [
    "Abra o Lúmen no Safari.",
    "Toque no botão Compartilhar (o quadrado com a seta para cima).",
    "Escolha “Adicionar à Tela de Início” e toque em “Adicionar”.",
  ],
  manual: [
    "No celular Android, abra o Lúmen no Chrome.",
    "Toque no menu (os três pontos, no canto de cima).",
    "Escolha “Instalar app” ou “Adicionar à tela inicial”.",
  ],
};

/** Explica como colocar o Lúmen na tela inicial do celular, do jeito de cada aparelho. */
export function InstallApp() {
  const mode = useInstallMode();
  const [declined, setDeclined] = useState(false);

  if (mode === null) return <div className="h-11" aria-hidden="true" />;

  if (mode === "instalado") {
    return <p className="text-body-sm text-ink-secondary">Você já está usando o Lúmen como app.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-ink-secondary">
        Coloque o Lúmen na tela inicial do celular e abra como um aplicativo, sem procurar o endereço no navegador.
      </p>
      {mode === "botao" ? (
        <div className="space-y-2">
          <Button
            onClick={async () => setDeclined(!(await promptInstall()))}
          >
            <Download aria-hidden="true" />
            Instalar o app
          </Button>
          {declined && (
            <p className="text-body-sm text-ink-secondary">
              Tudo bem. Você pode instalar depois pelo menu do navegador.
            </p>
          )}
        </div>
      ) : (
        <ol className="list-decimal space-y-2 pl-5 text-body-sm text-ink marker:text-ink-secondary">
          {steps[mode].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
