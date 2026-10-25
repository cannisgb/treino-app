import { notFound } from "next/navigation";
import { requirePageUser, trainerAthlete } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { buildSuggestions } from "@/lib/suggestions";
import SessionForm from "@/components/SessionForm";
import { isLang } from "@/lib/catalog";

export default async function NewSessionPage({ params, searchParams }: { params: { id: string }; searchParams: { tipo?: string } }) {
  const trainer = await requirePageUser("TRAINER");
  const athlete = await trainerAthlete(trainer.id, params.id);
  if (!athlete) notFound();
  const a = await loadAthlete(athlete.id);

  // Última vez que cada exercício foi feito → pré-preenche a carga.
  const last: Record<string, { sets: number; reps: number; kg: number; durationSec: number | null; distanceM: number | null; mode: string | null }> = {};
  for (const s of a.sessions)
    for (const e of s.entries) last[e.exerciseId] = { sets: e.sets, reps: e.reps, kg: e.kg, durationSec: e.durationSec, distanceM: e.distanceM, mode: e.mode };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="h-display text-4xl">{searchParams.tipo === "teste" ? "Teste de RM" : "Registar sessão"}</h2>
      </div>
      <SessionForm
        athleteId={athlete.id}
        initialLang={isLang(trainer.catalogLang) ? trainer.catalogLang : "pt"}
        initialKind={searchParams.tipo === "teste" ? "teste" : "treino"}
        last={last}
        suggestions={{ pt: buildSuggestions(a, "pt"), en: buildSuggestions(a, "en") }}
        bodyweight={a.bodyweight}
      />
    </div>
  );
}
