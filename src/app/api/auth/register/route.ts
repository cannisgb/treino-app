import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const RegisterSchema = z.object({
  name: z.string().min(2, "Nome demasiado curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A password tem de ter pelo menos 8 caracteres"),
});

export async function POST(req: Request) {
  const { allowed } = rateLimit(`register:${getClientIp(req)}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Demasiadas tentativas. Tenta mais tarde." }, { status: 429 });

  const parsed = RegisterSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const email = parsed.data.email.toLowerCase().trim();
  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "Já existe uma conta com esse email" }, { status: 409 });
  }

  // O email definido em TRAINER_EMAIL torna-se treinador; todos os outros são clientes.
  const trainerEmail = process.env.TRAINER_EMAIL?.toLowerCase().trim();
  const isTrainer = Boolean(trainerEmail && email === trainerEmail);

  // Um cliente que se regista sozinho fica logo ligado ao treinador principal (se existir).
  const mainTrainer = isTrainer ? null : await prisma.user.findFirst({ where: { role: "TRAINER" }, orderBy: { createdAt: "asc" } });

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: isTrainer ? "TRAINER" : "ATHLETE",
      trainerId: mainTrainer?.id ?? null,
    },
  });
  return NextResponse.json({ id: user.id }, { status: 201 });
}
