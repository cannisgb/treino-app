import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/brand";

// Torna a app instalável no Android ("Adicionar ao ecrã principal") e no iPhone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Acompanhamento de treino, proporções e força.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#111315",
    theme_color: "#111315",
    lang: "pt",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
