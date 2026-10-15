import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canWriteFor } from "@/lib/guards";

const cm = z.number().positive().max(300).optional();
const Schema = z.object({
  athleteId: z.string(),
  date: z.string().optional(),
  sex: z.enum(["M", "F"]).optional(),
  weightKg: z.number().positive().max(400).optional(),
  wrist: cm, neck: cm, shoulders: cm, chest: cm, arm: cm, forearm: cm, waist: cm, hips: cm, thigh: cm, calf: cm,
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Valores inválidos — confirma as medidas." }, { status: 400 });
  const { athleteId, date, sex, ...m } = parsed.data;

  const { user, ok } = await canWriteFor(athleteId);
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  if (!ok) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  if (sex) await prisma.user.update({ where: { id: athleteId }, data: { sex } });
  const created = await prisma.bodyMeasurement.create({
    data: { athleteId, date: date ? new Date(date + "T12:00:00Z") : new Date(), ...m },
  });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
