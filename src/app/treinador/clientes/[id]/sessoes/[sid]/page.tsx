import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import SessionForm from "@/components/SessionForm";
import { isLang } from "@/lib/catalog";

export default async function EditSessionPage({ params }: { params: { id: string; sid: string } }) {
  const trainer = await requirePageUser("TRAINER");
  const session = await prisma.workoutSession.findFirst({
    where: { id: params.sid, athleteId: params.id },
    include: { entries: { orderBy: { order: "asc" } } },
  });
  if (!session) notFound();
  const a = await loadAthlete(params.id);
  const last: Record<string, { sets: number; reps: number; kg: number; durationSec: number | null; distanceM: number | null; mode: string | null }> = {};
  for (const s of a.sessions)
    if (s.id !== session.id)
      for (const e of s.entries) last[e.exerciseId] = { sets: e.sets, reps: e.reps, kg: e.kg, durationSec: e.durationSec, distanceM: e.distanceM, mode: e.mode };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={`/treinador/clientes/${params.id}/sessoes`} className="font-mono text-xs text-muted hover:text-lime">← Sessões</Link>
        <h2 className="h-display mt-1 text-4xl">Editar sessão</h2>
      </div>
      <SessionForm
        athleteId={params.id}
        initialLang={isLang(trainer.catalogLang) ? trainer.catalogLang : "pt"}
        initialKind={session.kind === "teste" ? "teste" : "treino"}
        last={last}
        suggestions={{ pt: [], en: [] }}
        bodyweight={a.bodyweight}
        editing={{
          id: session.id,
          date: session.date.toISOString().slice(0, 10),
          title: session.title,
          kind: session.kind === "teste" ? "teste" : "treino",
          entries: session.entries.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, kg: e.kg, durationSec: e.durationSec, distanceM: e.distanceM, mode: e.mode })),
        }}
      />
    </div>
  );
}
