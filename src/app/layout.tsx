import type { Metadata, Viewport } from "next";
// Tipos de letra servidos a partir do próprio projeto (pacotes @fontsource):
// sem dependência do Google Fonts no build nem no telemóvel.
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";
import Providers from "@/components/Providers";
import RegisterSW from "@/components/RegisterSW";
import { APP_NAME } from "@/lib/brand";


export const metadata: Metadata = {
  title: APP_NAME,
  description: "Acompanhamento de treino, proporções e força.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#111315",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-ground font-body text-chalk antialiased">
        <Providers>{children}</Providers>
        <RegisterSW />
      </body>
    </html>
  );
}
