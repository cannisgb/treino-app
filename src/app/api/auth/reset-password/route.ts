import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/passwordReset";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const ResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "A password tem de ter pelo menos 8 caracteres"),
});

export async function POST(req: Request) {
  const { allowed } = rateLimit(`reset-password:${getClientIp(req)}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Demasiadas tentativas." }, { status: 429 });

  const parsed = ResetSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos" }, { status: 400 });

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Este link é inválido ou expirou. Pede um novo." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10), mustChangePassword: false },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);
  return NextResponse.json({ ok: true });
}
