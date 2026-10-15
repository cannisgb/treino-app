import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canWriteFor } from "@/lib/guards";
import { getExercise } from "@/lib/catalog";

const Schema = z.object({
  athleteId: z.string(),
  date: z.string().optional(),
  title: z.string().max(80).nullable().optional(),
  notes: z.string().max(1000).optional(),
  entries: z
    .array(
      z.object({
        exerciseId: z.string(),
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
  const { athleteId, date, title, notes, entries } = parsed.data;

  const { user, ok } = await canWriteFor(athleteId);
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  if (!ok) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  if (entries.some((e) => !getExercise(e.exerciseId))) {
    return NextResponse.json({ error: "Exercício desconhecido." }, { status: 400 });
  }

  const session = await prisma.workoutSession.create({
    data: {
      athleteId,
      trainerId: user.role === "TRAINER" ? user.id : null,
      date: date ? new Date(date + "T12:00:00Z") : new Date(),
      title: title ?? null,
      notes,
      entries: { create: entries },
    },
  });
  return NextResponse.json({ id: session.id }, { status: 201 });
}
