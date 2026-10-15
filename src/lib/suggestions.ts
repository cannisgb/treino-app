import type { AthleteData } from "@/lib/athleteData";
import { EXERCISES, exName, getExercise, groupName, type Lang } from "@/lib/catalog";
import { stagnant } from "@/lib/metrics";
import type { Suggestion } from "@/components/SessionForm";

/** Sugestões para o ecrã de registo: grupos em atraso, desequilíbrios e estagnação. */
export function buildSuggestions(a: AthleteData, lang: Lang): Suggestion[] {
  const out: Suggestion[] = [];
  const recentIds = new Set(a.entries.filter((e) => Date.now() - e.date.getTime() < 28 * 86400000).map((e) => e.exerciseId));

  const pick = (group: string, n = 2) =>
    EXERCISES.filter((e) => e.grupo === group && !recentIds.has(e.id) && e.tipo !== "cardio")
      .sort((x, y) => (x.tipo === "composto" ? -1 : 0) - (y.tipo === "composto" ? -1 : 0))
      .slice(0, n)
      .map((e) => e.id);

  for (const ax of a.now.axes) {
    if (ax.pct === null || ax.pct >= 85 || ax.key === "waist") continue;
    const groups = ax.key === "arm" ? ["biceps", "triceps"] : [ax.group];
    out.push({
      title: `${ax.label} a ${ax.pct}% do alvo`,
      detail: `Acrescentar volume de ${groups.map((g) => groupName(g, lang).toLowerCase()).join(" e ")}.`,
      exerciseIds: groups.flatMap((g) => pick(g, groups.length > 1 ? 1 : 2)),
    });
  }

  for (const b of a.balance) {
    if (b.ratio >= b.min) continue;
    const g = getExercise(b.a)?.grupo ?? "";
    out.push({
      title: `${exName(b.a, lang)} = ${Math.round(b.ratio * 100)}% de ${exName(b.b, lang)}`,
      detail: `Abaixo do intervalo ${Math.round(b.min * 100)}–${Math.round(b.max * 100)}%: reforçar ${groupName(g, lang).toLowerCase()}.`,
      exerciseIds: pick(g, 1),
    });
  }

  for (const id of stagnant(a.entries).slice(0, 2)) {
    const ex = getExercise(id);
    if (!ex) continue;
    const alt = EXERCISES.filter((e) => e.padrao_movimento === ex.padrao_movimento && e.id !== id && e.grupo === ex.grupo).slice(0, 2);
    out.push({
      title: `${exName(id, lang)} parado há 3 semanas`,
      detail: "Trocar por uma variante do mesmo movimento durante 3–4 semanas.",
      exerciseIds: alt.map((e) => e.id),
    });
  }
  return out.slice(0, 5);
}
