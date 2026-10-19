import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { PwaSetup } from "@/components/pwa/pwa-setup";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lúmen — Evidência científica, em português, em segundos.",
    template: "%s · Lúmen",
  },
  description:
    "Pergunte como falaria com um colega e receba a resposta com os artigos reais que a sustentam.",
  applicationName: "Lúmen",
  // Instalado na tela inicial do iPhone: abre sem a barra do Safari, com o nome curto.
  appleWebApp: { capable: true, title: "Lúmen", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafaf8",
  // Android: o teclado encolhe a página, e a caixa de pergunta fica visível acima dele.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        {children}
        <PwaSetup />
      </body>
    </html>
  );
}
