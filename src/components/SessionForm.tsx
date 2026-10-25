"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { exName, getExercise, groupName, isCustom, type Lang } from "@/lib/catalog";
import { fmt } from "@/lib/metrics";
import { FIELD_LABEL, MODES, durationText, formatEntry, modeOf, parseDuration, performance, type Field, type Mode } from "@/lib/measure";
import { RM_TEST, RM_TEST_RULES } from "@/lib/rmTest";
import LangToggle from "@/components/LangToggle";
import ExercisePicker from "@/components/ExercisePicker";
import ExerciseDemo from "@/components/ExerciseDemo";

type Row = { key: number; exerciseId: string; mode?: Mode; sets: string; reps: string; kg: string; dur: string; dist: string; note?: string };
type LastEntry = { sets: number; reps: number; kg: number; durationSec: number | null; distanceM: number | null; mode: string | null };
type Last = Record<string, LastEntry>;

const num = (t: string) => Number((t || "0").replace(",", "."));

/** Linha preenchida com a última vez que o exercício foi feito (ou valores típicos do modo). */
function rowFor(exerciseId: string, l?: LastEntry): Omit<Row, "key"> {
  const mode = modeOf(exerciseId, l?.mode);
  if (l)
    return {
      exerciseId,
      sets: String(l.sets || 1),
      reps: l.reps ? String(l.reps) : "",
      kg: l.kg ? String(l.kg) : "",
      dur: durationText(l.durationSec, mode),
      dist: l.distanceM ? String(l.distanceM) : "",
    };
  const defaults: Record<Mode, Partial<Row>> = {
    carga: { sets: "3", reps: "10" },
    lastro: { sets: "3", reps: "8" },
    assistencia: { sets: "3", reps: "8" },
    reps: { sets: "3", reps: "12" },
    tempo: { sets: "3", dur: "30" },
    cardio: { dur: "20" },
    distancia: {},
    carga_distancia: { sets: "3", dist: "30" },
  };
  return { exerciseId, sets: "1", reps: "", kg: "", dur: "", dist: "", ...defaults[mode] };
}
export type Suggestion = { title: string; detail: string; exerciseIds: string[] };
type Kind = "treino" | "teste";

let seq = 1;

function testRows(last: Last): Row[] {
  return RM_TEST.map((t) => ({
    key: seq++,
    exerciseId: t.exerciseId,
    sets: "1",
    reps: t.reps ? String(t.reps) : "",
    kg: t.reps && last[t.exerciseId]?.kg ? String(last[t.exerciseId].kg) : "",
    dur: "",
    dist: "",
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
  editing,
}: {
  editing?: { id: string; date: string; title: string | null; kind: Kind; entries: (LastEntry & { exerciseId: string })[] };
  athleteId: string;
  initialLang: Lang;
  initialKind: Kind;
  last: Last;
  suggestions: Record<Lang, Suggestion[]>;
  bodyweight: number | null;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [kind, setKind] = useState<Kind>(editing?.kind ?? initialKind);
  const [date, setDate] = useState(() => editing?.date ?? new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState(editing ? editing.title ?? "" : initialKind === "teste" ? "Teste de RM" : "");
  const [rows, setRows] = useState<Row[]>(() =>
    editing
      ? editing.entries.map((e) => ({ key: seq++, ...rowFor(e.exerciseId, e), mode: isCustom(e.exerciseId) ? (e.mode as Mode) : undefined }))
      : initialKind === "teste"
        ? testRows(last)
        : [{ key: seq++, ...rowFor("") }]
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function switchKind(k: Kind) {
    if (k === kind) return;
    setKind(k);
    if (editing) return; // ao corrigir, mudar o tipo não apaga os exercícios
    if (k === "teste") {
      setRows(testRows(last));
      setTitle("Teste de RM");
    } else {
      setRows([{ key: seq++, ...rowFor("") }]);
      setTitle("");
    }
  }

  function update(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function chooseExercise(key: number, exerciseId: string) {
    update(key, { ...rowFor(exerciseId, kind === "treino" ? last[exerciseId] : undefined), mode: undefined });
  }

  function addRow(exerciseId?: string) {
    setRows((rs) => [...rs, { key: seq++, ...rowFor(exerciseId ?? "", exerciseId ? last[exerciseId] : undefined) }]);
  }

  function entryOf(r: Row) {
    const mode = modeOf(r.exerciseId, r.mode);
    const dur = r.dur ? (mode === "tempo" ? Math.round(num(r.dur)) : parseDuration(r.dur)) : null;
    return {
      exerciseId: r.exerciseId,
      mode,
      sets: Math.round(num(r.sets)) || 1,
      reps: Math.round(num(r.reps)),
      kg: num(r.kg),
      durationSec: dur,
      distanceM: r.dist ? Math.round(num(r.dist)) : null,
    };
  }

  async function submit() {
    setError(null);
    const entries = rows.filter((r) => r.exerciseId).map((r, i) => ({ ...entryOf(r), order: i }));
    if (!entries.length) return setError("Escolhe pelo menos um exercício.");
    for (const e of entries) {
      const m = MODES[e.mode];
      const bad =
        Object.values(e).some((v) => typeof v === "number" && (Number.isNaN(v) || v < 0)) ||
        m.required.some((f) => (f === "reps" ? !e.reps : f === "durationSec" || f === "durationMin" ? !e.durationSec : f === "distanceM" ? !e.distanceM : false));
      if (bad) return setError(`Confirma os valores de “${exName(e.exerciseId, lang)}”: ${m.hint.toLowerCase()}.`);
    }
    setSaving(true);
    const res = await fetch(editing ? `/api/sessions/${editing.id}` : "/api/sessions", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, date, title: title || null, kind, entries }),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error || "Algo correu mal.");
    router.push(`/treinador/clientes/${athleteId}${editing ? "/sessoes" : ""}`);
    router.refresh();
  }

  const cols = "grid grid-cols-[48px_minmax(0,1fr)_minmax(0,300px)_96px_110px_36px] gap-2.5";
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
              <div>Registo</div>
              <div>Resultado</div>
              <div>Última vez</div>
              <div />
            </div>
            {rows.map((r) => {
              const mode = modeOf(r.exerciseId, r.mode);
              const m = MODES[mode];
              const perf = r.exerciseId ? performance(entryOf(r), bodyweight) : null;
              const l = last[r.exerciseId];
              const locked = kind === "teste" && RM_TEST.some((t) => t.exerciseId === r.exerciseId) && !!r.note;
              const ex = r.exerciseId ? getExercise(r.exerciseId) : undefined;
              const value = (f: Field) => (f === "sets" ? r.sets : f === "reps" ? r.reps : f === "kg" ? r.kg : f === "distanceM" ? r.dist : r.dur);
              const set = (f: Field, v: string) =>
                update(r.key, f === "sets" ? { sets: v } : f === "reps" ? { reps: v } : f === "kg" ? { kg: v } : f === "distanceM" ? { dist: v } : { dur: v });
              const label = (f: Field) =>
                f === "kg" ? (ex?.tipo_carga === "por_halter" ? "kg / halter" : m.kgLabel ?? FIELD_LABEL.kg) : f === "durationMin" ? "Tempo (min ou m:ss)" : FIELD_LABEL[f];
              return (
                <div key={r.key} className="border-b border-line/60 py-2.5">
                  <div className={`${cols} items-start`}>
                    <div className="pt-4"><ExerciseDemo exerciseId={r.exerciseId} lang={lang} /></div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-mono text-[10px] text-muted">{r.exerciseId ? m.label : " "}</span>
                      {locked ? (
                        <div className="field flex items-center bg-surface">{exName(r.exerciseId, lang)}</div>
                      ) : (
                        <ExercisePicker value={r.exerciseId} lang={lang} onChange={(id) => chooseExercise(r.key, id)} />
                      )}
                      {r.exerciseId && isCustom(r.exerciseId) && (
                        <label className="flex items-center gap-2 font-mono text-[11px] text-muted">
                          Medir por
                          <select value={mode} onChange={(e) => update(r.key, { mode: e.target.value as Mode })} className="field min-h-[34px] w-auto py-0 text-xs">
                            {(Object.keys(MODES) as Mode[]).map((k) => (
                              <option key={k} value={k}>{MODES[k].label}</option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.exerciseId &&
                        m.fields.map((f) => (
                          <label key={f} className="flex w-[88px] flex-col gap-1">
                            <span className="truncate font-mono text-[10px] text-muted">
                              {label(f)}
                              {m.required.includes(f) || (f === "kg" && m.kgLabel === "Carga kg") || label(f).includes("opc") ? "" : " ·opc."}
                            </span>
                            <input
                              aria-label={label(f)}
                              inputMode={f === "durationMin" ? "text" : "decimal"}
                              value={value(f)}
                              placeholder={r.exerciseId === "pull_up" && f === "reps" ? "máx." : ""}
                              onChange={(e) => set(f, e.target.value)}
                              className="field"
                            />
                          </label>
                        ))}
                    </div>
                    <div className="pt-6 font-mono text-sm text-lime">
                      {perf && perf.value ? (
                        <>
                          {fmt(perf.value, perf.unit === "kg" || perf.unit === "m/min" ? 1 : 0)} {perf.unit}
                          <div className="text-[10px] text-muted">{perf.label}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div className="pt-6 font-mono text-xs text-muted">{l ? formatEntry({ exerciseId: r.exerciseId, ...l }) : "—"}</div>
                    <button
                      type="button"
                      aria-label="Remover linha"
                      onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                      className="mt-4 min-h-[40px] min-w-[36px] rounded-lg text-muted hover:text-warn"
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
              {saving ? "A guardar…" : editing ? "Guardar alterações" : kind === "teste" ? "Guardar teste" : "Guardar sessão"}
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
          Cada exercício pede só o que faz sentido: carga, só repetições, tempo, distância ou lastro. Os valores vêm preenchidos com a última vez. Halteres: peso de cada halter. 1RM estimado pela fórmula de Epley. Toca na imagem para ver como se faz.
        </p>
      </div>

      {!editing && (
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
      )}
    </div>
  );
}
