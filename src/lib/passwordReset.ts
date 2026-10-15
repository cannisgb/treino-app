import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { APP_NAME } from "@/lib/brand";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issuePasswordResetEmail(user: { id: string; name: string; email: string }) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: `Redefinir a tua password — ${APP_NAME}`,
    html: `<p>Olá ${user.name},</p><p>Clica no link para escolheres uma nova password (válido durante 1 hora):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Se não pediste isto, ignora este email.</p>`,
  });
}
