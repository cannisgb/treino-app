import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canWriteFor } from "@/lib/guards";
import { logUnknownExercises } from "@/lib/unknownExercises";
import { SessionFields, cleanEntries, sessionDate } from "@/lib/sessionInput";

const Schema = z.object({ athleteId: z.string(), ...SessionFields });

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados da sessão inválidos." }, { status: 400 });
  const { athleteId, date, title, kind, notes, entries } = parsed.data;

  const { user, ok } = await canWriteFor(athleteId);
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  if (!ok) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { clean, error } = cleanEntries(entries);
  if (!clean) return NextResponse.json({ error }, { status: 400 });

  const session = await prisma.workoutSession.create({
    data: {
      athleteId,
      trainerId: user.role === "TRAINER" ? user.id : null,
      date: sessionDate(date),
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
