import { prisma } from "@/lib/prisma";
import { CUSTOM_PREFIX, isCustom, normalize } from "@/lib/catalog";

/** Regista (ou conta mais uma vez) os exercícios escritos à mão que não estão no catálogo. */
export async function logUnknownExercises(ids: string[], trainerId: string | null) {
  const names = new Map<string, string>();
  for (const id of ids) {
    if (!isCustom(id)) continue;
    const name = id.slice(CUSTOM_PREFIX.length);
    const key = normalize(name);
    if (key && !names.has(key)) names.set(key, name);
  }
  for (const [key, name] of names) {
    await prisma.unknownExercise.upsert({
      where: { key },
      create: { key, name, lastTrainerId: trainerId },
      update: { count: { increment: 1 }, lastSeen: new Date(), lastTrainerId: trainerId },
    });
  }
}
