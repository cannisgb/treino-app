import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, trainerAthlete } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { generatePlan } from "@/lib/plan";

const Schema = z.object({
  athleteId: z.string(),
  goal: z.enum(["hipertrofia", "forca", "gordura", "misto"]),
  days: z.number().int().min(2).max(6),
  minutes: z.number().int().min(30).max(120),
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "TRAINER") return NextResponse.json({ error: "Só o treinador pode gerar planos" }, { status: 403 });
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  if (!(await trainerAthlete(user.id, parsed.data.athleteId))) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const a = await loadAthlete(parsed.data.athleteId);
  const oneRm = new Map([...a.best.entries()].map(([id, b]) => [id, b.oneRm]));
  const plan = generatePlan({ ...parsed.data, priorityGroups: a.priorityGroups, oneRm });
  return NextResponse.json({ plan });
}
