"use client";

import { useMemo, useState } from "react";
import { EXERCISES, GROUPS, type Lang } from "@/lib/catalog";
import LangToggle from "@/components/LangToggle";

export default function CatalogBrowser({ initialLang }: { initialLang: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return EXERCISES.filter((e) => (!group || e.grupo === group) && (!s || e.nome_pt.toLowerCase().includes(s) || e.nome_en.toLowerCase().includes(s)));
  }, [q, group]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <span className="label">Procurar (PT ou EN)</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} className="field" />
        </label>
        <label className="flex w-48 flex-col gap-1.5">
          <span className="label">Grupo</span>
          <select value={group} onChange={(e) => setGroup(e.target.value)} className="field">
            <option value="">Todos</option>
            {GROUPS.map((g) => (
              <option key={g.id} value={g.id}>{g[lang]}</option>
            ))}
          </select>
        </label>
        <LangToggle lang={lang} onChange={setLang} />
      </div>
      <div className="font-mono text-xs text-muted">{list.length} exercícios</div>
      <div className="card overflow-x-auto p-4">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="font-mono text-[11px] text-muted">
            <tr>
              <th className="py-2 font-normal">Exercício</th>
              <th className="py-2 font-normal">{lang === "en" ? "Em português" : "Em inglês"}</th>
              <th className="py-2 font-normal">Grupo</th>
              <th className="py-2 font-normal">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id} className="border-t border-line/60">
                <td className="py-2 font-semibold">{lang === "en" ? e.nome_en : e.nome_pt}</td>
                <td className="py-2 text-muted">{lang === "en" ? e.nome_pt : e.nome_en}</td>
                <td className="py-2">{GROUPS.find((g) => g.id === e.grupo)?.[lang]}</td>
                <td className="py-2 font-mono text-xs text-muted">{e.tipo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
