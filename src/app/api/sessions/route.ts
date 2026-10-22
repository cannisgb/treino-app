import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canWriteFor } from "@/lib/guards";
import { isValidExerciseId } from "@/lib/catalog";
import { logUnknownExercises } from "@/lib/unknownExercises";

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
        sets: z.number().int().min(1).max(20),
        reps: z.number().int().min(1).max(100),
        kg: z.number().min(0).max(1000),
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

  const session = await prisma.workoutSession.create({
    data: {
      athleteId,
      trainerId: user.role === "TRAINER" ? user.id : null,
      date: date ? new Date(date + "T12:00:00Z") : new Date(),
      title: title ?? null,
      kind,
      notes,
      entries: { create: entries },
    },
  });
  await logUnknownExercises(entries.map((e) => e.exerciseId), user.role === "TRAINER" ? user.id : null).catch((e) =>
    console.error("[sessions] registo de exercícios desconhecidos falhou", e)
  );
  return NextResponse.json({ id: session.id }, { status: 201 });
}
