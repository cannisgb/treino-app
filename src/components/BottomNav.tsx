"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/app", label: "Corpo", icon: <><circle cx="12" cy="5" r="2.5" /><path d="M6 9h12M12 9v12M8 21l4-6 4 6" /></> },
  { href: "/app/forca", label: "Força", icon: <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" /> },
  { href: "/app/evolucao", label: "Evolução", icon: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" /> },
  { href: "/app/plano", label: "Plano", icon: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></> },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navegação"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-raised px-2 pt-1.5"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      {items.map((it) => {
        const active = it.href === "/app" ? path === "/app" || path.startsWith("/app/medidas") : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[48px] flex-col items-center justify-center gap-1 text-xs ${active ? "font-semibold text-lime" : "text-muted"}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {it.icon}
            </svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
