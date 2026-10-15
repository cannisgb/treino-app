import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser, trainerAthlete } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { buildSuggestions } from "@/lib/suggestions";
import SessionForm from "@/components/SessionForm";
import { isLang } from "@/lib/catalog";
import { fmt } from "@/lib/metrics";

export default async function NewSessionPage({ params }: { params: { id: string } }) {
  const trainer = await requirePageUser("TRAINER");
  const athlete = await trainerAthlete(trainer.id, params.id);
  if (!athlete) notFound();
  const a = await loadAthlete(athlete.id);

  // Última vez que cada exercício foi feito → pré-preenche a carga.
  const last: Record<string, { sets: number; reps: number; kg: number }> = {};
  for (const s of a.sessions) for (const e of s.entries) last[e.exerciseId] = { sets: e.sets, reps: e.reps, kg: e.kg };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={`/treinador/clientes/${athlete.id}`} className="font-mono text-xs text-muted hover:text-lime">← {athlete.name}</Link>
        <div className="font-mono text-xs text-muted">{a.bodyweight ? `${fmt(a.bodyweight)} kg` : "peso por registar"}</div>
        <h1 className="h-display mt-1 text-4xl">Registo de sessão</h1>
      </div>
      <SessionForm
        athleteId={athlete.id}
        initialLang={isLang(trainer.catalogLang) ? trainer.catalogLang : "pt"}
        last={last}
        suggestions={{ pt: buildSuggestions(a, "pt"), en: buildSuggestions(a, "en") }}
        bodyweight={a.bodyweight}
      />
    </div>
  );
}
