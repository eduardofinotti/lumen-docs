import type { MetadataRoute } from "next";

/** Manifesto do app: permite instalar o Lúmen na tela inicial (Android e iPhone). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Lúmen — Evidência científica, em português",
    short_name: "Lúmen",
    description: "Pergunte como falaria com um colega e receba a resposta com os artigos reais que a sustentam.",
    lang: "pt-BR",
    start_url: "/pesquisa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf8",
    theme_color: "#fafaf8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
