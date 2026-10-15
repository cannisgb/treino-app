import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function currentUser() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id as string | undefined;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

/** Para páginas: devolve o utilizador ou redireciona para o login. */
export async function requirePageUser(role?: "TRAINER" | "ATHLETE") {
  const user = await currentUser();
  if (!user) redirect("/");
  if (role && user.role !== role) redirect(user.role === "TRAINER" ? "/treinador" : "/app");
  return user;
}

/** O treinador só vê os clientes que são seus. */
export async function trainerAthlete(trainerId: string, athleteId: string) {
  return prisma.user.findFirst({ where: { id: athleteId, trainerId, role: "ATHLETE" } });
}

/**
 * Para APIs: quem pode escrever dados de um cliente?
 * O próprio cliente, ou o treinador desse cliente.
 */
export async function canWriteFor(athleteId: string) {
  const user = await currentUser();
  if (!user) return { user: null, ok: false };
  if (user.id === athleteId && user.role === "ATHLETE") return { user, ok: true };
  if (user.role === "TRAINER" && (await trainerAthlete(user.id, athleteId))) return { user, ok: true };
  return { user, ok: false };
}
