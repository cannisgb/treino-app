import { prisma } from "@/lib/prisma";
import { BALANCE, getExercise } from "@/lib/catalog";
import { AXES, balanceChecks, bestByExercise, proportions, strengthLevels, type EntryLike, type Measures } from "@/lib/metrics";

/** Junta tudo o que os ecrãs precisam de um cliente: medidas, histórico, força. */
export async function loadAthlete(athleteId: string) {
  const [user, measurements, sessions] = await Promise.all([
    prisma.user.findUnique({ where: { id: athleteId } }),
    prisma.bodyMeasurement.findMany({ where: { athleteId }, orderBy: { date: "asc" } }),
    prisma.workoutSession.findMany({ where: { athleteId }, orderBy: { date: "asc" }, include: { entries: true } }),
  ]);

  // Medidas "atuais": o valor mais recente de cada medida (podem vir de dias diferentes).
  const latest: Measures = {};
  const keys = ["weightKg", "wrist", "neck", "shoulders", "chest", "arm", "forearm", "waist", "hips", "thigh", "calf"] as const;
  for (const m of measurements) for (const k of keys) if (m[k] != null) (latest as any)[k] = m[k];
  const first: Measures = measurements[0] ? { ...measurements[0] } : {};
  // A 1.ª medição herda o pulso/anca das atuais para se poder calcular o alvo.
  if (!first.wrist) first.wrist = latest.wrist;
  if (!first.hips && user?.sex === "F") first.hips = latest.hips;

  const bodyweight = latest.weightKg ?? null;
  const entries: EntryLike[] = sessions.flatMap((s) =>
    s.entries.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, kg: e.kg, date: s.date }))
  );
  const best = bestByExercise(entries, bodyweight);

  const now = proportions(latest, user?.sex);
  const then = measurements.length > 1 ? proportions(first, user?.sex) : null;
  const levels = strengthLevels(best, bodyweight, user?.sex);
  const balance = balanceChecks(best);

  // Grupos a reforçar: eixos abaixo de 85% e equilíbrios abaixo do mínimo.
  const priorityGroups = new Set<string>();
  for (const a of now.axes) {
    if (a.pct !== null && a.pct < 85 && a.key !== "waist") {
      priorityGroups.add(a.group);
      if (a.key === "arm") priorityGroups.add("triceps");
    }
  }
  for (const b of balance) if (b.ratio < b.min) {
    const g = getExercise(b.a)?.grupo;
    if (g) priorityGroups.add(g);
  }

  return {
    user,
    measurements,
    sessions,
    latest,
    bodyweight,
    entries,
    best,
    now,
    then,
    levels,
    balance,
    priorityGroups: [...priorityGroups],
  };
}

export type AthleteData = Awaited<ReturnType<typeof loadAthlete>>;
export { AXES, BALANCE };
