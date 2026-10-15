// Todos os cálculos da app num só sítio: 1RM estimado, proporções ideais,
// níveis de força e equilíbrio entre exercícios.
import { BALANCE, STANDARDS, getExercise } from "@/lib/catalog";

export const LEVELS = ["iniciante", "novato", "intermedio", "avancado", "elite"] as const;
export const LEVEL_LABEL: Record<string, string> = {
  iniciante: "Iniciante",
  novato: "Novato",
  intermedio: "Intermédio",
  avancado: "Avançado",
  elite: "Elite",
};

// ---------- 1RM ----------

/** Carga efetiva: nas elevações assistidas o valor é contrapeso; com lastro soma-se o corpo. */
export function effectiveLoad(exerciseId: string, kg: number, bodyweight?: number | null): number {
  const ex = getExercise(exerciseId);
  if (!ex || !bodyweight) return kg;
  if (ex.tipo_carga === "assistencia") return Math.max(0, bodyweight - kg);
  if (ex.tipo_carga === "lastro") return bodyweight + kg;
  return kg;
}

/** Fórmula de Epley. Acima de 12 reps a estimativa perde fiabilidade, por isso limita-se. */
export function epley(kg: number, reps: number): number {
  if (kg <= 0 || reps <= 0) return 0;
  if (reps === 1) return kg;
  return kg * (1 + Math.min(reps, 12) / 30);
}

export function round(v: number, step = 0.5) {
  return Math.round(v / step) * step;
}

export function fmt(v: number, digits = 1) {
  return (Math.round(v * 10 ** digits) / 10 ** digits).toString().replace(".", ",");
}

// ---------- Proporções (corpo ideal) ----------

export type Measures = {
  weightKg?: number | null;
  wrist?: number | null;
  neck?: number | null;
  shoulders?: number | null;
  chest?: number | null;
  arm?: number | null;
  forearm?: number | null;
  waist?: number | null;
  hips?: number | null;
  thigh?: number | null;
  calf?: number | null;
};

export const AXES = [
  { key: "chest", label: "Peito", group: "peito" },
  { key: "shoulders", label: "Ombros", group: "ombros" },
  { key: "arm", label: "Braço", group: "biceps" },
  { key: "forearm", label: "Antebraço", group: "antebraco" },
  { key: "neck", label: "Pescoço", group: "costas" },
  { key: "waist", label: "Cintura", group: "core" },
  { key: "thigh", label: "Coxa", group: "quadriceps" },
  { key: "calf", label: "Gémeo", group: "gemeos" },
] as const;

export type AxisKey = (typeof AXES)[number]["key"];

/**
 * Medidas-alvo.
 * Homem: fórmulas de John McCallum, a partir do pulso (peito = 6,5 × pulso, etc.).
 * Mulher: referência a partir da anca (cintura ≈ 0,70 × anca). São valores de
 * orientação que o treinador pode ajustar aqui.
 */
export function targets(m: Measures, sex: string | null | undefined): Partial<Record<AxisKey | "hips", number>> | null {
  if (sex === "F") {
    if (!m.hips) return null;
    const h = m.hips;
    const waist = 0.7 * h;
    return {
      hips: h,
      waist,
      chest: 0.95 * h,
      shoulders: 1.45 * waist,
      arm: 0.31 * h,
      forearm: 0.25 * h,
      neck: 0.33 * h,
      thigh: 0.57 * h,
      calf: 0.37 * h,
    };
  }
  if (!m.wrist) return null;
  const chest = 6.5 * m.wrist;
  const waist = 0.7 * chest;
  return {
    chest,
    waist,
    hips: 0.85 * chest,
    shoulders: 1.618 * waist,
    arm: 0.36 * chest,
    forearm: 0.29 * chest,
    neck: 0.37 * chest,
    thigh: 0.53 * chest,
    calf: 0.34 * chest,
  };
}

export type AxisResult = { key: AxisKey; label: string; group: string; actual: number | null; target: number | null; pct: number | null };

export function proportions(m: Measures, sex: string | null | undefined): { axes: AxisResult[]; score: number | null } {
  const t = targets(m, sex);
  const axes: AxisResult[] = AXES.map((a) => {
    const actual = (m[a.key] as number | null | undefined) ?? null;
    const target = t?.[a.key] ?? null;
    let pct: number | null = null;
    if (actual && target) {
      // Na cintura, mais pequeno é melhor: inverte-se a relação.
      pct = a.key === "waist" ? (target / actual) * 100 : (actual / target) * 100;
      pct = Math.round(Math.min(pct, 120));
    }
    return { key: a.key, label: a.label, group: a.group, actual, target, pct };
  });
  const valid = axes.filter((a) => a.pct !== null) as (AxisResult & { pct: number })[];
  const score = valid.length
    ? Math.round(valid.reduce((s, a) => s + (100 - Math.abs(100 - a.pct)), 0) / valid.length)
    : null;
  return { axes, score };
}

// ---------- Força ----------

export type LiftLevel = {
  exerciseId: string;
  metric: "rácio" | "reps";
  value: number; // rácio (1RM ÷ peso) ou reps
  oneRm: number | null;
  levelIndex: number; // -1 = abaixo de iniciante
  nextIndex: number | null;
  nextTarget: number | null; // kg (rácio) ou reps
  progress: number; // 0..1 dentro do nível atual
};

export function strengthLevels(
  best: Map<string, { oneRm: number; maxReps: number }>,
  bodyweight: number | null | undefined,
  sex: string | null | undefined
): LiftLevel[] {
  const out: LiftLevel[] = [];
  for (const std of STANDARDS) {
    const b = best.get(std.exercicio_id);
    if (!b) continue;
    const table = sex === "F" ? std.mulher : std.homem;
    const thresholds = LEVELS.map((l) => table[l]);
    let value: number;
    if (std.metrica === "reps") value = b.maxReps;
    else {
      if (!bodyweight) continue;
      value = b.oneRm / bodyweight;
    }
    let levelIndex = -1;
    thresholds.forEach((t, i) => {
      if (value >= t) levelIndex = i;
    });
    const nextIndex = levelIndex >= 4 ? null : levelIndex + 1;
    const lo = levelIndex >= 0 ? thresholds[levelIndex] : 0;
    const hi = nextIndex !== null ? thresholds[nextIndex] : thresholds[4];
    const progress = nextIndex === null ? 1 : Math.max(0, Math.min(1, (value - lo) / (hi - lo || 1)));
    const nextTarget =
      nextIndex === null ? null : std.metrica === "reps" ? thresholds[nextIndex] : Math.ceil(thresholds[nextIndex] * (bodyweight || 0));
    out.push({
      exerciseId: std.exercicio_id,
      metric: std.metrica,
      value,
      oneRm: std.metrica === "rácio" ? b.oneRm : null,
      levelIndex,
      nextIndex,
      nextTarget,
      progress,
    });
  }
  return out;
}

export type BalanceCheck = { a: string; b: string; ratio: number; min: number; max: number; ok: boolean };

export function balanceChecks(best: Map<string, { oneRm: number }>): BalanceCheck[] {
  const out: BalanceCheck[] = [];
  for (const r of BALANCE) {
    const a = best.get(r.exercicio_id)?.oneRm;
    const b = best.get(r.relativo_a)?.oneRm;
    if (!a || !b) continue;
    const ratio = a / b;
    out.push({ a: r.exercicio_id, b: r.relativo_a, ratio, min: r.min, max: r.max, ok: ratio >= r.min && ratio <= r.max });
  }
  return out;
}

// ---------- Histórico ----------

export type EntryLike = { exerciseId: string; sets: number; reps: number; kg: number; date: Date };

/** Melhor 1RM estimado e máximo de reps por exercício. */
export function bestByExercise(entries: EntryLike[], bodyweight?: number | null) {
  const best = new Map<string, { oneRm: number; maxReps: number }>();
  for (const e of entries) {
    const load = effectiveLoad(e.exerciseId, e.kg, bodyweight);
    const orm = epley(load, e.reps);
    const cur = best.get(e.exerciseId) ?? { oneRm: 0, maxReps: 0 };
    best.set(e.exerciseId, { oneRm: Math.max(cur.oneRm, orm), maxReps: Math.max(cur.maxReps, e.reps) });
  }
  return best;
}

/** Série temporal do melhor 1RM por sessão para um exercício, em índice (1.ª sessão = 100). */
export function progressionSeries(entries: EntryLike[], exerciseId: string, bodyweight?: number | null) {
  const byDay = new Map<string, { date: Date; orm: number }>();
  for (const e of entries) {
    if (e.exerciseId !== exerciseId) continue;
    const key = e.date.toISOString().slice(0, 10);
    const orm = epley(effectiveLoad(e.exerciseId, e.kg, bodyweight), e.reps);
    const cur = byDay.get(key);
    if (!cur || orm > cur.orm) byDay.set(key, { date: e.date, orm });
  }
  const pts = [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  const base = pts[0]?.orm || 1;
  return pts.map((p) => ({ date: p.date, orm: p.orm, index: (p.orm / base) * 100 }));
}

/** Exercícios cujo melhor das últimas 3 semanas não supera as 3 anteriores. */
export function stagnant(entries: EntryLike[], now = new Date()) {
  const day = 86400000;
  const recent = new Map<string, number>();
  const before = new Map<string, number>();
  for (const e of entries) {
    const age = (now.getTime() - e.date.getTime()) / day;
    const orm = epley(e.kg, e.reps);
    if (age <= 21) recent.set(e.exerciseId, Math.max(recent.get(e.exerciseId) ?? 0, orm));
    else if (age <= 42) before.set(e.exerciseId, Math.max(before.get(e.exerciseId) ?? 0, orm));
  }
  return [...recent.entries()].filter(([id, v]) => before.has(id) && v <= (before.get(id) ?? 0)).map(([id]) => id);
}
