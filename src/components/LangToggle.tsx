"use client";

import type { Lang } from "@/lib/catalog";

/** Alterna os nomes dos exercícios entre português e inglês, no momento. */
export default function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  async function pick(l: Lang) {
    if (l === lang) return;
    onChange(l);
    // Guarda a preferência para a próxima vez (sem bloquear a interface).
    fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogLang: l }),
    }).catch(() => {});
  }
  return (
    <div role="group" aria-label="Idioma do catálogo de exercícios" className="inline-flex rounded-xl border border-line p-1">
      {(["pt", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => pick(l)}
          className={`min-h-[36px] min-w-[52px] rounded-lg px-3 font-mono text-xs font-medium ${lang === l ? "bg-lime text-ground" : "text-muted hover:text-chalk"}`}
        >
          {l === "pt" ? "PT" : "EN"}
        </button>
      ))}
    </div>
  );
}
