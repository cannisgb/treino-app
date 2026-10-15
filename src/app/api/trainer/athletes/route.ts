import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guards";

const Schema = z.object({ name: z.string().max(80).optional(), email: z.string().email() });

// O treinador adiciona um cliente: se a conta já existe (e não tem treinador)
// fica associada; se não existe, é criada com uma password temporária que o
// cliente é obrigado a mudar na primeira entrada.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "TRAINER") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "TRAINER") return NextResponse.json({ error: "Esse email é de um treinador" }, { status: 409 });
    if (existing.trainerId && existing.trainerId !== user.id) {
      return NextResponse.json({ error: "Esse cliente já tem outro treinador" }, { status: 409 });
    }
    await prisma.user.update({ where: { id: existing.id }, data: { trainerId: user.id } });
    return NextResponse.json({ id: existing.id });
  }

  const tempPassword = crypto.randomBytes(6).toString("base64url");
  const created = await prisma.user.create({
    data: {
      name: parsed.data.name?.trim() || email.split("@")[0],
      email,
      passwordHash: await bcrypt.hash(tempPassword, 10),
      role: "ATHLETE",
      trainerId: user.id,
      mustChangePassword: true,
    },
  });
  return NextResponse.json({ id: created.id, tempPassword }, { status: 201 });
}
