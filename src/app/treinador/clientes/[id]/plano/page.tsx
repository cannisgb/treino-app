import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser, trainerAthlete } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import PlanBuilder from "@/components/PlanBuilder";
import { PlanView } from "@/components/PlanView";
import { isLang } from "@/lib/catalog";

export default async function PlanPage({ params }: { params: { id: string } }) {
  const trainer = await requirePageUser("TRAINER");
  const athlete = await trainerAthlete(trainer.id, params.id);
  if (!athlete) notFound();
  const a = await loadAthlete(athlete.id);
  const lang = isLang(trainer.catalogLang) ? trainer.catalogLang : "pt";
  const current = await prisma.trainingPlan.findFirst({ where: { athleteId: athlete.id, status: "published" }, orderBy: { publishedAt: "desc" } });

  const weeks = a.sessions.length > 1 ? Math.round((a.sessions[a.sessions.length - 1].date.getTime() - a.sessions[0].date.getTime()) / (7 * 86400000)) : 0;
  const historyNote = `${athlete.name} · base: ${weeks} semana${weeks === 1 ? "" : "s"}, ${a.sessions.length} sessões, ${a.measurements.length} medições`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="h-display text-4xl">Plano</h2>
      </div>
      {a.sessions.length < 4 && (
        <p className="text-sm text-warn">Com menos de 4 sessões registadas, as cargas ficam por preencher: o plano usa o histórico para as calcular.</p>
      )}
      <PlanBuilder athleteId={athlete.id} initialLang={lang} priorities={a.priorityGroups} historyNote={historyNote} />
      {current && (
        <section className="flex flex-col gap-3">
          <h2 className="h-display text-2xl text-muted">Plano ativo</h2>
          <PlanView plan={current} lang={lang} />
        </section>
      )}
    </div>
  );
}
