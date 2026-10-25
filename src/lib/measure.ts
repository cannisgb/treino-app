// Como se mede cada exercício. Decide que campos aparecem no registo, como se mostra
// o resultado e que número se usa para a evolução.
import { getExercise, isCustom } from "@/lib/catalog";
import { effectiveLoad, epley, fmt } from "@/lib/metrics";

export type Mode = "carga" | "lastro" | "assistencia" | "reps" | "tempo" | "cardio" | "distancia" | "carga_distancia";

export type Field = "sets" | "reps" | "kg" | "durationSec" | "durationMin" | "distanceM";

export const MODES: Record<Mode, { label: string; fields: Field[]; required: Field[]; kgLabel?: string; hint: string }> = {
  carga: { label: "Carga", fields: ["sets", "reps", "kg"], required: ["sets", "reps"], kgLabel: "Carga kg", hint: "Séries × repetições × carga" },
  lastro: { label: "Peso do corpo + lastro", fields: ["sets", "reps", "kg"], required: ["sets", "reps"], kgLabel: "Lastro kg", hint: "Lastro = peso extra (cinto, colete); vazio se só o corpo" },
  assistencia: { label: "Assistido", fields: ["sets", "reps", "kg"], required: ["sets", "reps"], kgLabel: "Contrapeso kg", hint: "Contrapeso da máquina (quanto menos, melhor)" },
  reps: { label: "Repetições", fields: ["sets", "reps"], required: ["sets", "reps"], hint: "Só séries × repetições, sem carga" },
  tempo: { label: "Tempo", fields: ["sets", "durationSec", "kg"], required: ["sets", "durationSec"], kgLabel: "Carga kg (opc.)", hint: "Séries × segundos; carga só se usar peso" },
  cardio: { label: "Cardio por tempo", fields: ["durationMin", "distanceM"], required: ["durationMin"], hint: "Minutos; distância opcional" },
  distancia: { label: "Cardio por distância", fields: ["distanceM", "durationMin"], required: ["distanceM"], hint: "Metros e tempo (para o ritmo)" },
  carga_distancia: { label: "Carga × distância", fields: ["sets", "kg", "distanceM"], required: ["sets", "distanceM"], kgLabel: "Carga kg", hint: "Séries × metros com a carga indicada" },
};

export const FIELD_LABEL: Record<Field, string> = {
  sets: "Séries",
  reps: "Reps",
  kg: "Carga kg",
  durationSec: "Segundos",
  durationMin: "Minutos",
  distanceM: "Metros",
};

/** Modo de um exercício do catálogo; os escritos à mão usam o modo guardado (ou carga). */
export function modeOf(exerciseId: string, stored?: string | null): Mode {
  if (stored && stored in MODES) return stored as Mode;
  if (isCustom(exerciseId)) return "carga";
  return ((getExercise(exerciseId) as unknown as { medida?: Mode })?.medida ?? "carga") as Mode;
}

export function usesLoadFor1RM(mode: Mode) {
  return mode === "carga" || mode === "lastro" || mode === "assistencia";
}

export type EntryData = {
  exerciseId: string;
  mode?: string | null;
  sets: number;
  reps: number;
  kg: number;
  durationSec?: number | null;
  distanceM?: number | null;
};

function mmss(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function fmtDistance(m: number) {
  return m >= 1000 ? `${fmt(m / 1000, 2)} km` : `${Math.round(m)} m`;
}

/** Texto curto do que foi feito: "4×8 · 60 kg", "3×45 s", "2000 m · 7:45", "20 min · 5 km". */
export function formatEntry(e: EntryData): string {
  const mode = modeOf(e.exerciseId, e.mode);
  switch (mode) {
    case "carga":
      return `${e.sets}×${e.reps}${e.kg ? ` · ${fmt(e.kg)} kg` : ""}`;
    case "lastro":
      return `${e.sets}×${e.reps}${e.kg ? ` · +${fmt(e.kg)} kg` : " · corpo"}`;
    case "assistencia":
      return `${e.sets}×${e.reps} · −${fmt(e.kg)} kg`;
    case "reps":
      return `${e.sets}×${e.reps}`;
    case "tempo":
      return `${e.sets}×${e.durationSec ?? 0} s${e.kg ? ` · ${fmt(e.kg)} kg` : ""}`;
    case "cardio":
      return `${Math.round((e.durationSec ?? 0) / 60)} min${e.distanceM ? ` · ${fmtDistance(e.distanceM)}` : ""}`;
    case "distancia":
      return `${fmtDistance(e.distanceM ?? 0)}${e.durationSec ? ` · ${mmss(e.durationSec)}` : ""}`;
    case "carga_distancia":
      return `${e.sets}×${e.distanceM ?? 0} m${e.kg ? ` · ${fmt(e.kg)} kg` : ""}`;
  }
}

/**
 * O número que mede o desempenho, para a evolução (maior = melhor):
 * carga → 1RM estimado; reps → reps; tempo → segundos; cardio → distância/min ou minutos;
 * distância → metros por minuto (ritmo) ou metros; carga×distância → kg × metros.
 */
export function performance(e: EntryData, bodyweight?: number | null): { value: number; unit: string; label: string } {
  const mode = modeOf(e.exerciseId, e.mode);
  switch (mode) {
    case "carga":
    case "lastro":
    case "assistencia": {
      const load = effectiveLoad(e.exerciseId, e.kg, bodyweight);
      if (mode !== "carga" && !load) return { value: e.reps, unit: "reps", label: "Máx. reps" };
      return { value: epley(load, e.reps), unit: "kg", label: "1RM est." };
    }
    case "reps":
      return { value: e.reps, unit: "reps", label: "Máx. reps" };
    case "tempo":
      return { value: e.durationSec ?? 0, unit: "s", label: "Melhor tempo" };
    case "cardio":
      if (e.distanceM && e.durationSec) return { value: e.distanceM / (e.durationSec / 60), unit: "m/min", label: "Ritmo" };
      return { value: (e.durationSec ?? 0) / 60, unit: "min", label: "Duração" };
    case "distancia":
      if (e.distanceM && e.durationSec) return { value: e.distanceM / (e.durationSec / 60), unit: "m/min", label: "Ritmo" };
      return { value: e.distanceM ?? 0, unit: "m", label: "Distância" };
    case "carga_distancia":
      return { value: (e.kg || 1) * (e.distanceM ?? 0), unit: "kg·m", label: "Carga × distância" };
  }
}

// ---------- Histórico (usa o modo de cada exercício) ----------

export type DatedEntry = EntryData & { date: Date };

/** Melhor 1RM (só exercícios com carga) e máximo de reps, por exercício. */
export function bestFromEntries(entries: DatedEntry[], bodyweight?: number | null) {
  const best = new Map<string, { oneRm: number; maxReps: number }>();
  for (const e of entries) {
    const mode = modeOf(e.exerciseId, e.mode);
    const cur = best.get(e.exerciseId) ?? { oneRm: 0, maxReps: 0 };
    const orm = usesLoadFor1RM(mode) ? epley(effectiveLoad(e.exerciseId, e.kg, bodyweight), e.reps) : 0;
    best.set(e.exerciseId, { oneRm: Math.max(cur.oneRm, orm), maxReps: Math.max(cur.maxReps, e.reps) });
  }
  return best;
}

/** Melhor desempenho por sessão, em índice (1.ª sessão = 100). */
export function performanceSeries(entries: DatedEntry[], exerciseId: string, bodyweight?: number | null) {
  const byDay = new Map<string, { date: Date; value: number; unit: string; label: string }>();
  for (const e of entries) {
    if (e.exerciseId !== exerciseId) continue;
    const p = performance(e, bodyweight);
    if (!p.value) continue;
    const key = e.date.toISOString().slice(0, 10);
    const cur = byDay.get(key);
    if (!cur || p.value > cur.value) byDay.set(key, { date: e.date, ...p });
  }
  const pts = [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  const base = pts[0]?.value || 1;
  return pts.map((p) => ({ ...p, index: (p.value / base) * 100 }));
}

/** Exercícios cujo melhor desempenho das últimas 3 semanas não supera as 3 anteriores. */
export function stagnantIds(entries: DatedEntry[], bodyweight?: number | null, now = new Date()) {
  const day = 86400000;
  const recent = new Map<string, number>();
  const before = new Map<string, number>();
  for (const e of entries) {
    if (isCustom(e.exerciseId)) continue;
    const age = (now.getTime() - e.date.getTime()) / day;
    const v = performance(e, bodyweight).value;
    if (age <= 21) recent.set(e.exerciseId, Math.max(recent.get(e.exerciseId) ?? 0, v));
    else if (age <= 42) before.set(e.exerciseId, Math.max(before.get(e.exerciseId) ?? 0, v));
  }
  return [...recent.entries()].filter(([id, v]) => before.has(id) && v <= (before.get(id) ?? 0)).map(([id]) => id);
}

/** Converte "7:45" ou "20" (minutos) em segundos. */
export function parseDuration(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (!t) return null;
  const m = t.match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 60) : null;
}

export function durationText(sec: number | null | undefined, mode: Mode): string {
  if (!sec) return "";
  if (mode === "tempo") return String(sec);
  return sec % 60 ? mmss(sec) : String(sec / 60);
}
