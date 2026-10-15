"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EXERCISES, GROUPS, exName, getExercise, groupName, type Lang } from "@/lib/catalog";
import { effectiveLoad, epley, fmt } from "@/lib/metrics";
import LangToggle from "@/components/LangToggle";

type Row = { key: number; group: string; exerciseId: string; sets: string; reps: string; kg: string };
type Last = Record<string, { sets: number; reps: number; kg: number }>;
export type Suggestion = { title: string; detail: string; exerciseIds: string[] };

let seq = 1;

export default function SessionForm({
  athleteId,
  initialLang,
  last,
  suggestions,
  bodyweight,
}: {
  athleteId: string;
  initialLang: Lang;
  last: Last;
  suggestions: Record<Lang, Suggestion[]>;
  bodyweight: number | null;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<Row[]>([{ key: seq++, group: "peito", exerciseId: "", sets: "3", reps: "10", kg: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Exercícios por grupo, ordenados pelo nome no idioma escolhido.
  const byGroup = useMemo(() => {
    const m = new Map<string, { id: string; name: string }[]>();
    for (const g of GROUPS) m.set(g.id, []);
    for (const e of EXERCISES) m.get(e.grupo)?.push({ id: e.id, name: lang === "en" ? e.nome_en : e.nome_pt });
    m.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name, lang)));
    return m;
  }, [lang]);

  function update(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function chooseExercise(key: number, exerciseId: string) {
    const l = last[exerciseId];
    update(key, l ? { exerciseId, sets: String(l.sets), reps: String(l.reps), kg: String(l.kg) } : { exerciseId });
  }

  function addRow(exerciseId?: string) {
    const ex = exerciseId ? getExercise(exerciseId) : undefined;
    const l = exerciseId ? last[exerciseId] : undefined;
    setRows((rs) => [
      ...rs,
      {
        key: seq++,
        group: ex?.grupo ?? rs[rs.length - 1]?.group ?? "peito",
        exerciseId: exerciseId ?? "",
        sets: l ? String(l.sets) : "3",
        reps: l ? String(l.reps) : "10",
        kg: l ? String(l.kg) : "",
      },
    ]);
  }

  async function submit() {
    setError(null);
    const entries = rows
      .filter((r) => r.exerciseId)
      .map((r, i) => ({
        exerciseId: r.exerciseId,
        sets: Number(r.sets),
        reps: Number(r.reps),
        kg: Number((r.kg || "0").replace(",", ".")),
        order: i,
      }));
    if (!entries.length) return setError("Escolhe pelo menos um exercício.");
    if (entries.some((e) => !e.sets || !e.reps || e.kg < 0 || Number.isNaN(e.kg))) return setError("Confirma séries, repetições e carga.");
    setSaving(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, date, title: title || null, entries }),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error || "Algo correu mal.");
    router.push(`/treinador/clientes/${athleteId}`);
    router.refresh();
  }

  const cols = "grid grid-cols-[140px_minmax(0,1fr)_72px_72px_92px_92px_120px] gap-2.5";

  return (
    <div className="flex flex-wrap gap-6">
      <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="label">Data</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field w-44" />
          </label>
          <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <span className="label">Nome da sessão (opcional)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Superior A" className="field" />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="label">Catálogo</span>
            <LangToggle lang={lang} onChange={setLang} />
          </div>
        </div>

        <div className="card overflow-x-auto px-4 pb-4 pt-2">
          <div className="min-w-[860px]">
            <div className={`${cols} border-b border-line py-2.5 font-mono text-[11px] text-muted`}>
              <div>Grupo</div>
              <div>Exercício</div>
              <div>Séries</div>
              <div>Reps</div>
              <div>Carga kg</div>
              <div>1RM est.</div>
              <div>Última vez</div>
            </div>
            {rows.map((r) => {
              const ex = r.exerciseId ? getExercise(r.exerciseId) : undefined;
              const kg = Number((r.kg || "0").replace(",", "."));
              const orm = r.exerciseId ? epley(effectiveLoad(r.exerciseId, kg, bodyweight), Number(r.reps)) : 0;
              const l = last[r.exerciseId];
              return (
                <div key={r.key} className={`${cols} items-center border-b border-line/60 py-2.5`}>
                  <select
                    aria-label="Grupo muscular"
                    value={r.group}
                    onChange={(e) => update(r.key, { group: e.target.value, exerciseId: "" })}
                    className="field"
                  >
                    {GROUPS.map((g) => (
                      <option key={g.id} value={g.id}>{g[lang]}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <select aria-label="Exercício" value={r.exerciseId} onChange={(e) => chooseExercise(r.key, e.target.value)} className="field">
                      <option value="">Escolher…</option>
                      {byGroup.get(r.group)?.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label="Remover linha"
                      onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                      className="min-h-[40px] min-w-[36px] rounded-lg text-muted hover:text-warn"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </div>
                  <input aria-label="Séries" inputMode="numeric" value={r.sets} onChange={(e) => update(r.key, { sets: e.target.value })} className="field" />
                  <input aria-label="Repetições" inputMode="numeric" value={r.reps} onChange={(e) => update(r.key, { reps: e.target.value })} className="field" />
                  <input aria-label="Carga em kg" inputMode="decimal" value={r.kg} onChange={(e) => update(r.key, { kg: e.target.value })} className="field" placeholder={ex?.tipo_carga === "por_halter" ? "por halter" : ""} />
                  <div className="font-mono text-sm text-lime">{orm ? `${fmt(orm)} kg` : "—"}</div>
                  <div className="font-mono text-xs text-muted">{l ? `${fmt(l.kg)} × ${l.reps}` : "—"}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button type="button" onClick={() => addRow()} className="btn-ghost border-dashed">
              + Adicionar exercício
            </button>
            <button type="button" onClick={submit} disabled={saving} className="btn-primary ml-auto">
              {saving ? "A guardar…" : "Guardar sessão"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-warn">{error}</p>}
        </div>
        <p className="font-mono text-xs text-muted">
          A carga vem preenchida com a última vez. Halteres: peso de cada halter. Elevações assistidas: contrapeso da máquina. 1RM estimado pela fórmula de Epley.
        </p>
      </div>

      <aside className="flex flex-[1_1_280px] flex-col gap-2.5">
        <div className="h-display text-base text-muted">Sugestões</div>
        {suggestions[lang].length === 0 && <p className="text-sm text-muted">Ainda sem histórico suficiente para sugestões.</p>}
        {suggestions[lang].map((s, i) => (
          <div key={i} className="card flex flex-col gap-2 p-4">
            <div className="font-semibold">{s.title}</div>
            <div className="text-sm text-muted">{s.detail}</div>
            {s.exerciseIds.map((id) => (
              <button key={id} type="button" onClick={() => addRow(id)} className="min-h-[40px] rounded-lg border border-line bg-ground px-3 text-left text-sm hover:border-lime">
                + {exName(id, lang)}
                <span className="text-muted"> · {groupName(getExercise(id)?.grupo ?? "", lang)}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>
    </div>
  );
}
