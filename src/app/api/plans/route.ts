import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUser, trainerAthlete } from "@/lib/guards";
import { getExercise } from "@/lib/catalog";
import { sendEmail } from "@/lib/email";
import { APP_NAME } from "@/lib/brand";

const Item = z.object({
  exerciseId: z.string(),
  sets: z.number().int().min(0).max(20),
  reps: z.string().max(20),
  kg: z.number().min(0).max(1000).nullable(),
  priority: z.boolean(),
});
const Schema = z.object({
  athleteId: z.string(),
  goal: z.enum(["hipertrofia", "forca", "gordura", "misto"]),
  days: z.number().int().min(2).max(6),
  minutes: z.number().int().min(30).max(120),
  publish: z.boolean(),
  data: z.object({
    days: z.array(z.object({ name: z.string().max(60), items: z.array(Item).max(15) })).min(1).max(7),
    notes: z.array(z.string().max(300)).max(10),
  }),
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "TRAINER") return NextResponse.json({ error: "Só o treinador pode guardar planos" }, { status: 403 });
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  const { athleteId, goal, days, minutes, publish, data } = parsed.data;
  const athlete = await trainerAthlete(user.id, athleteId);
  if (!athlete) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  if (data.days.some((d) => d.items.some((i) => !getExercise(i.exerciseId)))) {
    return NextResponse.json({ error: "Exercício desconhecido no plano" }, { status: 400 });
  }

  const plan = await prisma.$transaction(async (tx) => {
    if (publish) {
      // Só um plano ativo de cada vez: os anteriores passam a arquivados.
      await tx.trainingPlan.updateMany({ where: { athleteId, status: "published" }, data: { status: "archived" } });
    }
    return tx.trainingPlan.create({
      data: {
        athleteId,
        trainerId: user.id,
        goal,
        daysPerWeek: days,
        minutes,
        data,
        status: publish ? "published" : "draft",
        publishedAt: publish ? new Date() : null,
      },
    });
  });

  if (publish) {
    await sendEmail({
      to: athlete.email,
      subject: `Tens um plano novo — ${APP_NAME}`,
      html: `<p>Olá ${athlete.name},</p><p>O teu treinador publicou um plano novo. Abre a app em <a href="${process.env.NEXTAUTH_URL}/app/plano">${process.env.NEXTAUTH_URL}/app/plano</a>.</p>`,
    }).catch((e) => console.error("[plans] email falhou", e));
  }
  return NextResponse.json({ id: plan.id }, { status: 201 });
}
