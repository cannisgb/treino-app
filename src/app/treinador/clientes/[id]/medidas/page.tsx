import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser, trainerAthlete } from "@/lib/guards";
import MeasurementForm from "@/components/MeasurementForm";
import { FIELDS } from "@/lib/measures";
import EditableMeasurementHistory, { type MeasurementRow } from "@/components/EditableMeasurementHistory";
import ProfileForm from "@/components/ProfileForm";

export default async function ClientMeasurementsPage({ params }: { params: { id: string } }) {
  const trainer = await requirePageUser("TRAINER");
  const athlete = await trainerAthlete(trainer.id, params.id);
  if (!athlete) notFound();
  const history = await prisma.bodyMeasurement.findMany({ where: { athleteId: athlete.id }, orderBy: { date: "desc" }, take: 30 });
  const rows: MeasurementRow[] = history.map((m) => ({
    id: m.id,
    date: m.date.toISOString().slice(0, 10),
    values: Object.fromEntries(FIELDS.map((f) => [f.key, m[f.key]])),
  }));
  const base = `/treinador/clientes/${athlete.id}`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="h-display text-4xl">Medidas</h2>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="min-w-0 flex-[999_1_560px]">
          <MeasurementForm athleteId={athlete.id} askSex={false} redirectTo={base} />
        </div>
        <div className="flex flex-[1_1_320px] flex-col gap-4">
          <ProfileForm sex={athlete.sex} athleteId={athlete.id} />
          <EditableMeasurementHistory athleteId={athlete.id} rows={rows} />
        </div>
      </div>
    </div>
  );
}
