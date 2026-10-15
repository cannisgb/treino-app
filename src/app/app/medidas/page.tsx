import { requirePageUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import MeasurementForm from "@/components/MeasurementForm";
import { MeasurementHistory } from "@/components/MeasurementHistory";

export default async function MeasurementsPage() {
  const user = await requirePageUser("ATHLETE");
  const history = await prisma.bodyMeasurement.findMany({ where: { athleteId: user.id }, orderBy: { date: "desc" }, take: 12 });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="h-display text-4xl">Medidas</h1>
      <MeasurementForm athleteId={user.id} askSex={!user.sex} redirectTo="/app" />
      <MeasurementHistory rows={history} />
    </div>
  );
}
