"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const ITEMS = [
  { href: "", label: "Resumo" },
  { href: "/corpo", label: "Corpo" },
  { href: "/forca", label: "Força" },
  { href: "/evolucao", label: "Evolução" },
  { href: "/sessoes", label: "Sessões" },
  { href: "/medidas", label: "Medidas" },
  { href: "/plano", label: "Plano" },
];

/** Menu da ficha do cliente: coluna à esquerda no computador, separadores no telemóvel. */
export default function ClientNav({ base, testDue }: { base: string; testDue: boolean }) {
  const path = usePathname();
  const search = useSearchParams();
  const active = (h: string) => (h === "" ? path === base : path === base + h || path.startsWith(base + h + "/"));
  const testActive = path === `${base}/sessao` && search.get("tipo") === "teste";
  return (
    <nav aria-label="Ficha do cliente" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {ITEMS.map((it) => (
        <Link
          key={it.label}
          href={base + it.href}
          aria-current={active(it.href) ? "page" : undefined}
          className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
            active(it.href) ? "bg-surface text-lime" : "text-muted hover:bg-surface hover:text-chalk"
          }`}
        >
          {it.label}
        </Link>
      ))}
      <Link
        href={`${base}/sessao?tipo=teste`}
        className={`flex items-center justify-between gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
          testActive ? "bg-surface text-chalk" : "text-muted hover:bg-surface hover:text-chalk"
        }`}
      >
        Teste de RM
        {testDue && <span className="h-2 w-2 rounded-full bg-lime" aria-label="em atraso" />}
      </Link>
    </nav>
  );
}
