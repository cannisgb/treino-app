import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canWriteFor } from "@/lib/guards";
import { exName, isValidExerciseId } from "@/lib/catalog";
import { logUnknownExercises } from "@/lib/unknownExercises";
import { FIELD_LABEL, MODES, modeOf, type Mode } from "@/lib/measure";

const Schema = z.object({
  athleteId: z.string(),
  date: z.string().optional(),
  title: z.string().max(80).nullable().optional(),
  kind: z.enum(["treino", "teste"]).default("treino"),
  notes: z.string().max(1000).optional(),
  entries: z
    .array(
      z.object({
        exerciseId: z.string().max(100),
        mode: z.enum(["carga", "lastro", "assistencia", "reps", "tempo", "cardio", "distancia", "carga_distancia"]).optional(),
        sets: z.number().int().min(1).max(20).default(1),
        reps: z.number().int().min(0).max(500).default(0),
        kg: z.number().min(0).max(1000).default(0),
        durationSec: z.number().int().min(0).max(86400).nullable().optional(),
        distanceM: z.number().int().min(0).max(200000).nullable().optional(),
        order: z.number().int().min(0).default(0),
      })
    )
    .min(1)
    .max(40),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados da sessão inválidos." }, { status: 400 });
  const { athleteId, date, title, kind, notes, entries } = parsed.data;

  const { user, ok } = await canWriteFor(athleteId);
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  if (!ok) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  if (entries.some((e) => !isValidExerciseId(e.exerciseId))) {
    return NextResponse.json({ error: "Exercício inválido." }, { status: 400 });
  }
  // Cada exercício guarda o modo com que foi medido e só os campos que lhe pertencem.
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
    if (missing)
      return NextResponse.json({ error: `${exName(e.exerciseId, "pt")}: falta ${FIELD_LABEL[missing].toLowerCase()}.` }, { status: 400 });
    clean.push(row);
  }

  const session = await prisma.workoutSession.create({
    data: {
      athleteId,
      trainerId: user.role === "TRAINER" ? user.id : null,
      date: date ? new Date(date + "T12:00:00Z") : new Date(),
      title: title ?? null,
      kind,
      notes,
      entries: { create: clean },
    },
  });
  await logUnknownExercises(entries.map((e) => e.exerciseId), user.role === "TRAINER" ? user.id : null).catch((e) =>
    console.error("[sessions] registo de exercícios desconhecidos falhou", e)
  );
  return NextResponse.json({ id: session.id }, { status: 201 });
}
