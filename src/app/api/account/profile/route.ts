import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUser, trainerAthlete } from "@/lib/guards";

const Schema = z.object({
  catalogLang: z.enum(["pt", "en"]).optional(),
  sex: z.enum(["M", "F"]).optional(),
  athleteId: z.string().optional(), // o treinador pode definir o sexo de referência de um cliente
});

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  let targetId = user.id;
  if (parsed.data.athleteId && parsed.data.athleteId !== user.id) {
    if (user.role !== "TRAINER" || !(await trainerAthlete(user.id, parsed.data.athleteId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    targetId = parsed.data.athleteId;
  }
  const data: { catalogLang?: string; sex?: string } = {};
  if (parsed.data.catalogLang && targetId === user.id) data.catalogLang = parsed.data.catalogLang;
  if (parsed.data.sex) data.sex = parsed.data.sex;
  await prisma.user.update({ where: { id: targetId }, data });
  return NextResponse.json({ ok: true });
}
