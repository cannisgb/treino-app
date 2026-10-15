import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issuePasswordResetEmail } from "@/lib/passwordReset";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const ForgotSchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`forgot-password:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados pedidos. Tenta novamente mais tarde." },
      { status: 429 }
    );
  }

  const parsed = ForgotSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return the same success response whether or not the account
    // exists — confirming/denying an email's existence here would let
    // someone enumerate registered clients.
    if (user) {
      await issuePasswordResetEmail(user);
    }
  } catch (err) {
    console.error("[forgot-password] failed:", err);
  }

  return NextResponse.json({ ok: true });
}
