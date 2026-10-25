// Gerador de planos baseado em regras: escolhe o esquema de dias, os exercícios
// por padrão de movimento, as séries/reps pelo objetivo, as cargas pelo 1RM
// estimado do cliente, e reforça os grupos musculares em atraso.
import { getExercise } from "@/lib/catalog";
import { round } from "@/lib/metrics";
import { modeOf, type Mode } from "@/lib/measure";

export type Goal = "hipertrofia" | "forca" | "gordura" | "misto";
export const GOALS: { id: Goal; label: string }[] = [
  { id: "hipertrofia", label: "Hipertrofia" },
  { id: "forca", label: "Força" },
  { id: "gordura", label: "Perda de gordura" },
  { id: "misto", label: "Misto" },
];

export type PlanItem = { exerciseId: string; sets: number; reps: string; kg: number | null; priority: boolean };
export type PlanDay = { name: string; items: PlanItem[] };
export type PlanData = { days: PlanDay[]; notes: string[] };

type Slot = { c: string[]; main?: boolean };
const S = (c: string[], main = false): Slot => ({ c, main });

const squat = S(["back_squat", "front_squat", "hack_squat"], true);
const legPress = S(["leg_press_45", "hack_squat"], true);
const deadlift = S(["conventional_deadlift", "trap_bar_deadlift"], true);
const rdl = S(["romanian_deadlift", "dumbbell_romanian_deadlift"], true);
const bench = S(["barbell_bench_press", "dumbbell_bench_press", "machine_chest_press"], true);
const incline = S(["incline_dumbbell_press", "incline_barbell_bench_press"], true);
const ohp = S(["overhead_press", "seated_dumbbell_shoulder_press", "arnold_press"], true);
const dbShoulder = S(["seated_dumbbell_shoulder_press", "arnold_press"]);
const row = S(["barbell_bent_over_row", "one_arm_dumbbell_row", "t_bar_row"], true);
const cableRow = S(["seated_cable_row", "chest_supported_dumbbell_row", "machine_row"]);
const pulldown = S(["wide_grip_lat_pulldown", "pull_up", "close_grip_lat_pulldown"], true);
const bulgarian = S(["bulgarian_split_squat", "walking_lunge", "reverse_lunge"]);
const legExt = S(["leg_extension", "sissy_squat"]);
const legCurl = S(["lying_leg_curl", "seated_leg_curl"]);
const hipThrust = S(["barbell_hip_thrust", "machine_hip_thrust"]);
const calves = S(["standing_calf_raise", "seated_calf_raise", "leg_press_calf_raise"]);
const biceps = S(["incline_dumbbell_curl", "barbell_curl", "bayesian_cable_curl"]);
const biceps2 = S(["hammer_curl", "ez_bar_preacher_curl", "cable_curl"]);
const triceps = S(["rope_pushdown", "overhead_cable_extension", "ez_bar_skull_crusher"]);
const triceps2 = S(["overhead_cable_extension", "close_grip_bench_press", "tricep_dip"]);
const lateral = S(["dumbbell_lateral_raise", "cable_lateral_raise", "machine_lateral_raise"]);
const rear = S(["face_pull", "reverse_pec_deck", "bent_over_reverse_fly"]);
const chestIso = S(["high_to_low_cable_crossover", "pec_deck_fly", "dumbbell_fly"]);
const forearm = S(["reverse_barbell_curl", "wrist_curl", "farmer_s_carry"]);
const shrug = S(["dumbbell_shrug", "barbell_shrug"]);
const core = S(["cable_crunch", "hanging_leg_raise", "plank", "ab_wheel_rollout"]);

const T = {
  fbA: { name: "Corpo inteiro A", slots: [squat, bench, row, rdl, lateral, biceps, triceps, calves] },
  fbB: { name: "Corpo inteiro B", slots: [deadlift, ohp, pulldown, bulgarian, legCurl, triceps2, core, calves] },
  fbC: { name: "Corpo inteiro C", slots: [legPress, incline, cableRow, hipThrust, rear, biceps2, chestIso, core] },
  upA: { name: "Superior A", slots: [bench, row, ohp, pulldown, lateral, biceps, triceps, rear] },
  loA: { name: "Inferior A", slots: [squat, rdl, legPress, legCurl, calves, core, hipThrust] },
  upB: { name: "Superior B", slots: [incline, pulldown, cableRow, dbShoulder, chestIso, triceps2, biceps2, lateral] },
  loB: { name: "Inferior B", slots: [deadlift, bulgarian, hipThrust, legExt, calves, core, legCurl] },
  arms: { name: "Braços e pontos fracos", slots: [biceps, triceps, lateral, rear, biceps2, triceps2, forearm, calves] },
  push: { name: "Empurrar", slots: [bench, ohp, incline, lateral, triceps, chestIso, triceps2] },
  pull: { name: "Puxar", slots: [row, pulldown, cableRow, rear, biceps, biceps2, shrug] },
  legs: { name: "Pernas", slots: [squat, rdl, legPress, legCurl, calves, legExt, core] },
};

function layout(days: number): { t: keyof typeof T; v: number; suffix?: string }[] {
  switch (days) {
    case 2:
      return [{ t: "fbA", v: 0 }, { t: "fbB", v: 0 }];
    case 3:
      return [{ t: "fbA", v: 0 }, { t: "fbB", v: 0 }, { t: "fbC", v: 1 }];
    case 4:
      return [{ t: "upA", v: 0 }, { t: "loA", v: 0 }, { t: "upB", v: 1 }, { t: "loB", v: 1 }];
    case 5:
      return [{ t: "upA", v: 0 }, { t: "loA", v: 0 }, { t: "upB", v: 1 }, { t: "loB", v: 1 }, { t: "arms", v: 1 }];
    default:
      return [
        { t: "push", v: 0, suffix: " A" }, { t: "pull", v: 0, suffix: " A" }, { t: "legs", v: 0, suffix: " A" },
        { t: "push", v: 1, suffix: " B" }, { t: "pull", v: 1, suffix: " B" }, { t: "legs", v: 1, suffix: " B" },
      ];
  }
}

const RX: Record<Goal, { main: [number, string, number]; acc: [number, string, number] }> = {
  hipertrofia: { main: [4, "6–10", 0.72], acc: [3, "10–12", 0.65] },
  forca: { main: [5, "3–5", 0.85], acc: [3, "6–8", 0.75] },
  gordura: { main: [3, "10–12", 0.65], acc: [3, "12–15", 0.55] },
  misto: { main: [4, "5–8", 0.78], acc: [3, "8–12", 0.68] },
};

export function generatePlan(opts: {
  goal: Goal;
  days: number;
  minutes: number;
  priorityGroups: string[];
  oneRm: Map<string, number>;
}): PlanData {
  const { goal, minutes, priorityGroups, oneRm } = opts;
  const days = Math.min(6, Math.max(2, opts.days));
  const perDay = minutes <= 45 ? 4 : minutes <= 60 ? 6 : 7;
  const prio = new Set(priorityGroups);
  const rx = RX[goal];

  const out: PlanDay[] = layout(days).map(({ t, v, suffix }) => {
    const tpl = T[t];
    let chosen = tpl.slots.map((s) => ({ slot: s, id: s.c[v % s.c.length] }));

    // Mantém os principais primeiro; garante que os grupos prioritários entram.
    let keep = chosen.slice(0, perDay);
    const dropped = chosen.slice(perDay);
    for (const d of dropped) {
      const g = getExercise(d.id)?.grupo;
      if (!g || !prio.has(g) || keep.some((k) => getExercise(k.id)?.grupo === g)) continue;
      const idx = [...keep].reverse().findIndex((k) => !k.slot.main && !prio.has(getExercise(k.id)?.grupo ?? ""));
      if (idx >= 0) keep[keep.length - 1 - idx] = d;
    }
    chosen = keep;

    const items: PlanItem[] = chosen.map(({ slot, id }) => {
      const [sets, reps, pct] = slot.main ? rx.main : rx.acc;
      const g = getExercise(id)?.grupo ?? "";
      const isPrio = prio.has(g);
      // A prescrição segue a forma como o exercício se mede: carga só onde há carga externa.
      const mode = modeOf(id);
      const extra = isPrio ? 1 : 0;
      const orm = mode === "carga" ? oneRm.get(id) : undefined;
      const byMode: Record<Mode, Omit<PlanItem, "exerciseId" | "priority">> = {
        carga: { sets: sets + extra, reps, kg: orm ? round(orm * pct, 2.5) : null },
        lastro: { sets: sets + extra, reps, kg: null },
        assistencia: { sets: sets + extra, reps, kg: null },
        reps: { sets: sets + extra, reps: goal === "forca" ? "8–12" : "12–20", kg: null },
        tempo: { sets: sets + extra, reps: "30–45 s", kg: null },
        cardio: { sets: 1, reps: "15–20 min", kg: null },
        distancia: { sets: 1, reps: "2000 m", kg: null },
        carga_distancia: { sets: 3, reps: "30–40 m", kg: null },
      };
      return { exerciseId: id, ...byMode[mode], priority: isPrio };
    });

    if (goal === "gordura") items.push({ exerciseId: "rowing_machine", sets: 1, reps: "2000 m", kg: null, priority: false });
    return { name: tpl.name + (suffix ?? ""), items };
  });

  const notes = [
    "Progressão: quando todas as séries chegam ao topo das repetições, sobe 2,5 kg (superiores) ou 5 kg (inferiores).",
    "Semana 4 = descarga: mesmas séries a ~60% da carga.",
  ];
  if (prio.size) notes.unshift("Grupos prioritários com +1 série: " + [...prio].join(", ") + ".");
  return { days: out, notes };
}

/** Todos os ids usados nos modelos (para validação). */
export function templateExerciseIds(): string[] {
  const ids = new Set<string>();
  Object.values(T).forEach((t) => t.slots.forEach((s) => s.c.forEach((c) => ids.add(c))));
  ids.add("rowing_machine");
  return [...ids];
}
