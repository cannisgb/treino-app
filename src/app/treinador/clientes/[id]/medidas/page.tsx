import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser, trainerAthlete } from "@/lib/guards";
import MeasurementForm from "@/components/MeasurementForm";
import { MeasurementHistory } from "@/components/MeasurementHistory";
import ProfileForm from "@/components/ProfileForm";

export default async function ClientMeasurementsPage({ params }: { params: { id: string } }) {
  const trainer = await requirePageUser("TRAINER");
  const athlete = await trainerAthlete(trainer.id, params.id);
  if (!athlete) notFound();
  const history = await prisma.bodyMeasurement.findMany({ where: { athleteId: athlete.id }, orderBy: { date: "desc" }, take: 20 });
  const base = `/treinador/clientes/${athlete.id}`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={base} className="font-mono text-xs text-muted hover:text-lime">← {athlete.name}</Link>
        <h1 className="h-display mt-1 text-4xl">Medidas</h1>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="min-w-0 flex-[999_1_480px]">
          <MeasurementForm athleteId={athlete.id} askSex={false} redirectTo={base} />
        </div>
        <div className="flex flex-[1_1_280px] flex-col gap-4">
          <ProfileForm sex={athlete.sex} athleteId={athlete.id} />
          <MeasurementHistory rows={history} />
        </div>
      </div>
    </div>
  );
}
