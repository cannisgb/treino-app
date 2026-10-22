import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUser, trainerAthlete } from "@/lib/guards";

// Correções às medidas: só o treinador do cliente pode editar ou apagar.
const cm = z.number().positive().max(300).nullable().optional();
const Schema = z.object({
  date: z.string().optional(),
  weightKg: z.number().positive().max(400).nullable().optional(),
  wrist: cm, neck: cm, shoulders: cm, chest: cm, arm: cm, forearm: cm, waist: cm, hips: cm, thigh: cm, calf: cm,
  notes: z.string().max(500).nullable().optional(),
});

async function authorize(id: string) {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "Sem sessão" }, { status: 401 }) };
  if (user.role !== "TRAINER") return { error: NextResponse.json({ error: "Só o treinador pode corrigir medidas" }, { status: 403 }) };
  const m = await prisma.bodyMeasurement.findUnique({ where: { id } });
  if (!m || !(await trainerAthlete(user.id, m.athleteId))) return { error: NextResponse.json({ error: "Medição não encontrada" }, { status: 404 }) };
  return { m };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await authorize(params.id);
  if (auth.error) return auth.error;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Valores inválidos — confirma as medidas." }, { status: 400 });
  const { date, ...m } = parsed.data;
  await prisma.bodyMeasurement.update({
    where: { id: params.id },
    data: { ...m, ...(date ? { date: new Date(date + "T12:00:00Z") } : {}) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await authorize(params.id);
  if (auth.error) return auth.error;
  await prisma.bodyMeasurement.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
