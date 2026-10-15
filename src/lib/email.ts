import { Resend } from "resend";

// Chave Resend PRÓPRIA desta app (não reutilizar a do Look Signature).
// Sem chave, os emails são apenas registados na consola.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY não definida — email para ${params.to} não enviado: "${params.subject}"`);
    return { skipped: true };
  }
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Treino <onboarding@resend.dev>",
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  return { skipped: false };
}
