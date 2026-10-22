"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { exName, getExercise, groupName, isCustom, type Lang } from "@/lib/catalog";
import { effectiveLoad, epley, fmt } from "@/lib/metrics";
import { RM_TEST, RM_TEST_RULES } from "@/lib/rmTest";
import LangToggle from "@/components/LangToggle";
import ExercisePicker from "@/components/ExercisePicker";
import ExerciseDemo from "@/components/ExerciseDemo";

type Row = { key: number; exerciseId: string; sets: string; reps: string; kg: string; note?: string };
type Last = Record<string, { sets: number; reps: number; kg: number }>;
export type Suggestion = { title: string; detail: string; exerciseIds: string[] };
type Kind = "treino" | "teste";

let seq = 1;

function testRows(last: Last): Row[] {
  return RM_TEST.map((t) => ({
    key: seq++,
    exerciseId: t.exerciseId,
    sets: "1",
    reps: t.reps ? String(t.reps) : "",
    kg: t.reps ? (last[t.exerciseId] ? String(last[t.exerciseId].kg) : "") : "0",
    note: t.note,
  }));
}

export default function SessionForm({
  athleteId,
  initialLang,
  initialKind,
  last,
  suggestions,
  bodyweight,
}: {
  athleteId: string;
  initialLang: Lang;
  initialKind: Kind;
  last: Last;
  suggestions: Record<Lang, Suggestion[]>;
  bodyweight: number | null;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [kind, setKind] = useState<Kind>(initialKind);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState(initialKind === "teste" ? "Teste de RM" : "");
  const [rows, setRows] = useState<Row[]>(() =>
    initialKind === "teste" ? testRows(last) : [{ key: seq++, exerciseId: "", sets: "3", reps: "10", kg: "" }]
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function switchKind(k: Kind) {
    if (k === kind) return;
    setKind(k);
    if (k === "teste") {
      setRows(testRows(last));
      setTitle("Teste de RM");
    } else {
      setRows([{ key: seq++, exerciseId: "", sets: "3", reps: "10", kg: "" }]);
      setTitle("");
    }
  }

  function update(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function chooseExercise(key: number, exerciseId: string) {
    const l = last[exerciseId];
    update(key, l && kind === "treino" ? { exerciseId, sets: String(l.sets), reps: String(l.reps), kg: String(l.kg) } : { exerciseId });
  }

  function addRow(exerciseId?: string) {
    const l = exerciseId ? last[exerciseId] : undefined;
    setRows((rs) => [
      ...rs,
      { key: seq++, exerciseId: exerciseId ?? "", sets: l ? String(l.sets) : "3", reps: l ? String(l.reps) : "10", kg: l ? String(l.kg) : "" },
    ]);
  }

  async function submit() {
    setError(null);
    const filled = rows.filter((r) => r.exerciseId && r.reps !== "");
    const entries = filled.map((r, i) => ({
      exerciseId: r.exerciseId,
      sets: Number(r.sets),
      reps: Number(r.reps),
      kg: Number((r.kg || "0").replace(",", ".")),
      order: i,
    }));
    if (!entries.length) return setError("Escolhe pelo menos um exercício e preenche as repetições.");
    if (entries.some((e) => !e.sets || !e.reps || e.kg < 0 || Number.isNaN(e.kg))) return setError("Confirma séries, repetições e carga.");
    setSaving(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, date, title: title || null, kind, entries }),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error || "Algo correu mal.");
    router.push(`/treinador/clientes/${athleteId}`);
    router.refresh();
  }

  const cols = "grid grid-cols-[48px_minmax(0,1fr)_64px_64px_88px_88px_100px_36px] gap-2.5";
  const customCount = rows.filter((r) => r.exerciseId && isCustom(r.exerciseId)).length;

  return (
    <div className="flex flex-wrap gap-6">
      <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="label">Tipo de sessão</span>
            <div role="group" aria-label="Tipo de sessão" className="inline-flex rounded-xl border border-line p-1">
              {(["treino", "teste"] as Kind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => switchKind(k)}
                  className={`min-h-[36px] rounded-lg px-3 text-sm font-semibold ${kind === k ? "bg-lime text-ground" : "text-muted hover:text-chalk"}`}
                >
                  {k === "treino" ? "Treino" : "Teste de RM"}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="label">Data</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field w-44" />
          </label>
          <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
            <span className="label">Nome da sessão (opcional)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Superior A" className="field" />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="label">Catálogo</span>
            <LangToggle lang={lang} onChange={setLang} />
          </div>
        </div>

        {kind === "teste" && (
          <div className="card flex flex-col gap-2 border border-lime/40 p-4">
            <div className="h-display text-lg text-lime">Protocolo do teste de RM</div>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted">
              {RM_TEST_RULES.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <p className="text-sm">Regista em cada linha a <strong>série válida mais pesada</strong> (carga × reps). Os exercícios do teste são fixos para que os dados sejam comparáveis.</p>
          </div>
        )}

        <div className="card overflow-x-auto px-4 pb-4 pt-2">
          <div className="min-w-[860px]">
            <div className={`${cols} border-b border-line py-2.5 font-mono text-[11px] text-muted`}>
              <div>Como</div>
              <div>Exercício · escreve para procurar (PT ou EN)</div>
              <div>Séries</div>
              <div>Reps</div>
              <div>Carga kg</div>
              <div>1RM est.</div>
              <div>Última vez</div>
              <div />
            </div>
            {rows.map((r) => {
              const ex = r.exerciseId ? getExercise(r.exerciseId) : undefined;
              const kg = Number((r.kg || "0").replace(",", "."));
              const orm = r.exerciseId && r.reps ? epley(effectiveLoad(r.exerciseId, kg, bodyweight), Number(r.reps)) : 0;
              const l = last[r.exerciseId];
              const locked = kind === "teste" && RM_TEST.some((t) => t.exerciseId === r.exerciseId) && !!r.note;
              return (
                <div key={r.key} className="border-b border-line/60 py-2.5">
                  <div className={`${cols} items-center`}>
                    <ExerciseDemo exerciseId={r.exerciseId} lang={lang} />
                    <div className="min-w-0">
                      {locked ? (
                        <div className="field flex items-center bg-surface">{exName(r.exerciseId, lang)}</div>
                      ) : (
                        <ExercisePicker value={r.exerciseId} lang={lang} onChange={(id) => chooseExercise(r.key, id)} />
                      )}
                    </div>
                    <input aria-label="Séries" inputMode="numeric" value={r.sets} onChange={(e) => update(r.key, { sets: e.target.value })} className="field" />
                    <input aria-label="Repetições" inputMode="numeric" value={r.reps} placeholder={r.exerciseId === "pull_up" ? "máx." : ""} onChange={(e) => update(r.key, { reps: e.target.value })} className="field" />
                    <input aria-label="Carga em kg" inputMode="decimal" value={r.kg} onChange={(e) => update(r.key, { kg: e.target.value })} className="field" placeholder={ex?.tipo_carga === "por_halter" ? "por halter" : ""} />
                    <div className="font-mono text-sm text-lime">{orm ? `${fmt(orm)} kg` : "—"}</div>
                    <div className="font-mono text-xs text-muted">{l ? `${fmt(l.kg)} × ${l.reps}` : "—"}</div>
                    <button
                      type="button"
                      aria-label="Remover linha"
                      onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                      className="min-h-[40px] min-w-[36px] rounded-lg text-muted hover:text-warn"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </div>
                  {r.note && <div className="mt-1 pl-[58px] font-mono text-[11px] text-muted">{r.note}</div>}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button type="button" onClick={() => addRow()} className="btn-ghost border-dashed">
              + Adicionar exercício
            </button>
            <button type="button" onClick={submit} disabled={saving} className="btn-primary ml-auto">
              {saving ? "A guardar…" : kind === "teste" ? "Guardar teste" : "Guardar sessão"}
            </button>
          </div>
          {customCount > 0 && (
            <p className="mt-3 text-sm text-warn">
              {customCount} exercício{customCount > 1 ? "s" : ""} fora da lista: fica{customCount > 1 ? "m" : ""} registado{customCount > 1 ? "s" : ""} e é revisto depois para entrar no catálogo.
            </p>
          )}
          {error && <p className="mt-3 text-sm text-warn">{error}</p>}
        </div>
        <p className="font-mono text-xs text-muted">
          A carga vem preenchida com a última vez. Halteres: peso de cada halter. Elevações assistidas: contrapeso da máquina. 1RM estimado pela fórmula de Epley. Toca na imagem para ver como se faz.
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
              <div key={id} className="flex items-center gap-2">
                <ExerciseDemo exerciseId={id} lang={lang} size={40} />
                <button type="button" onClick={() => addRow(id)} className="min-h-[40px] flex-1 rounded-lg border border-line bg-ground px-3 text-left text-sm hover:border-lime">
                  + {exName(id, lang)}
                  <span className="text-muted"> · {groupName(getExercise(id)?.grupo ?? "", lang)}</span>
                </button>
              </div>
            ))}
          </div>
        ))}
      </aside>
    </div>
  );
}
