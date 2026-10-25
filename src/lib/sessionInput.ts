// Validação comum a criar e a editar sessões: cada exercício guarda o modo com que foi
// medido e só os campos que lhe pertencem.
import { z } from "zod";
import { exName, isValidExerciseId } from "@/lib/catalog";
import { FIELD_LABEL, MODES, modeOf, type Mode } from "@/lib/measure";

export const EntrySchema = z.object({
  exerciseId: z.string().max(100),
  mode: z.enum(["carga", "lastro", "assistencia", "reps", "tempo", "cardio", "distancia", "carga_distancia"]).optional(),
  sets: z.number().int().min(1).max(20).default(1),
  reps: z.number().int().min(0).max(500).default(0),
  kg: z.number().min(0).max(1000).default(0),
  durationSec: z.number().int().min(0).max(86400).nullable().optional(),
  distanceM: z.number().int().min(0).max(200000).nullable().optional(),
  order: z.number().int().min(0).default(0),
});

export const SessionFields = {
  date: z.string().optional(),
  title: z.string().max(80).nullable().optional(),
  kind: z.enum(["treino", "teste"]).default("treino"),
  notes: z.string().max(1000).optional(),
  entries: z.array(EntrySchema).min(1).max(40),
};

type Entry = z.infer<typeof EntrySchema>;

export function cleanEntries(entries: Entry[]) {
  if (entries.some((e) => !isValidExerciseId(e.exerciseId))) return { error: "Exercício inválido." as string };
  const clean = [];
  for (const e of entries) {
    const mode: Mode = modeOf(e.exerciseId, e.mode);
    const f = MODES[mode].fields;
    const row = {
      exerciseId: e.exerciseId,
      mode,
      order: e.order,
      sets: f.includes("sets") ? e.sets : 1,
      reps: f.includes("reps") ? e.reps : 0,
      kg: f.includes("kg") ? e.kg : 0,
      durationSec: f.includes("durationSec") || f.includes("durationMin") ? e.durationSec ?? null : null,
      distanceM: f.includes("distanceM") ? e.distanceM ?? null : null,
    };
    const missing = MODES[mode].required.find((r) =>
      r === "reps" ? !row.reps : r === "durationSec" || r === "durationMin" ? !row.durationSec : r === "distanceM" ? !row.distanceM : false
    );
    if (missing) return { error: `${exName(e.exerciseId, "pt")}: falta ${FIELD_LABEL[missing].toLowerCase()}.` };
    clean.push(row);
  }
  return { clean };
}

export const sessionDate = (date?: string) => (date ? new Date(date + "T12:00:00Z") : new Date());
