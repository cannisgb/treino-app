"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/catalog";

export default function ProfileForm({ sex, lang, athleteId }: { sex: string | null; lang?: Lang; athleteId?: string }) {
  const router = useRouter();
  const [s, setS] = useState(sex ?? "");
  const [l, setL] = useState<Lang | undefined>(lang);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sex: s || undefined, catalogLang: l, athleteId }),
    });
    setMsg(res.ok ? "Guardado." : "Não foi possível guardar.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card flex flex-col gap-3 p-4">
      <label className="flex flex-col gap-1.5">
        <span className="label">Referência de proporções e força</span>
        <select value={s} onChange={(e) => setS(e.target.value)} className="field">
          <option value="">Escolher…</option>
          <option value="M">Masculina (a partir do pulso)</option>
          <option value="F">Feminina (a partir da anca)</option>
        </select>
      </label>
      {lang && (
        <label className="flex flex-col gap-1.5">
          <span className="label">Nomes dos exercícios</span>
          <select value={l} onChange={(e) => setL(e.target.value as Lang)} className="field">
            <option value="pt">Português</option>
            <option value="en">English</option>
          </select>
        </label>
      )}
      <button type="submit" className="btn-primary self-start">Guardar</button>
      {msg && <p className="text-sm text-lime">{msg}</p>}
    </form>
  );
}
