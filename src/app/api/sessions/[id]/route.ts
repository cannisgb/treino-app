import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canWriteFor } from "@/lib/guards";
import { logUnknownExercises } from "@/lib/unknownExercises";
import { SessionFields, cleanEntries, sessionDate } from "@/lib/sessionInput";

const Schema = z.object(SessionFields);

async function access(id: string) {
  const session = await prisma.workoutSession.findUnique({ where: { id } });
  if (!session) return { res: NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 }) };
  const { user, ok } = await canWriteFor(session.athleteId);
  if (!user) return { res: NextResponse.json({ error: "Sem sessão" }, { status: 401 }) };
  if (!ok) return { res: NextResponse.json({ error: "Sem permissão" }, { status: 403 }) };
  return { session, user };
}

/** Corrige uma sessão: data, nome, tipo e a lista completa de exercícios (substituída). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const a = await access(params.id);
  if (!a.session) return a.res;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados da sessão inválidos." }, { status: 400 });
  const { date, title, kind, notes, entries } = parsed.data;
  const { clean, error } = cleanEntries(entries);
  if (!clean) return NextResponse.json({ error }, { status: 400 });

  await prisma.$transaction([
    prisma.workoutEntry.deleteMany({ where: { sessionId: a.session.id } }),
    prisma.workoutSession.update({
      where: { id: a.session.id },
      data: {
        date: date ? sessionDate(date) : a.session.date,
        title: title ?? null,
        kind,
        notes,
        entries: { create: clean },
      },
    }),
  ]);
  await logUnknownExercises(entries.map((e) => e.exerciseId), a.user.role === "TRAINER" ? a.user.id : null).catch(() => {});
  return NextResponse.json({ id: a.session.id });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const a = await access(params.id);
  if (!a.session) return a.res;
  await prisma.$transaction([
    prisma.workoutEntry.deleteMany({ where: { sessionId: a.session.id } }),
    prisma.workoutSession.delete({ where: { id: a.session.id } }),
  ]);
  return NextResponse.json({ ok: true });
}
