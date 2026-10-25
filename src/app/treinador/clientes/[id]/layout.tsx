import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser, trainerAthlete } from "@/lib/guards";
import { fmt } from "@/lib/metrics";
import { RM_TEST_INTERVAL_DAYS } from "@/lib/rmTest";
import ClientNav from "@/components/ClientNav";

export default async function ClientLayout({ params, children }: { params: { id: string }; children: React.ReactNode }) {
  const trainer = await requirePageUser("TRAINER");
  const athlete = await trainerAthlete(trainer.id, params.id);
  if (!athlete) notFound();
  const base = `/treinador/clientes/${athlete.id}`;
  const [weight, lastTest] = await Promise.all([
    prisma.bodyMeasurement.findFirst({ where: { athleteId: athlete.id, weightKg: { not: null } }, orderBy: { date: "desc" }, select: { weightKg: true } }),
    prisma.workoutSession.findFirst({ where: { athleteId: athlete.id, kind: "teste" }, orderBy: { date: "desc" }, select: { date: true } }),
  ]);
  const testDue = !lastTest || (Date.now() - lastTest.date.getTime()) / 86400000 >= RM_TEST_INTERVAL_DAYS;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:w-56 lg:shrink-0">
        <div>
          <Link href="/treinador" className="font-mono text-xs text-muted hover:text-lime">← Clientes</Link>
          <h1 className="h-display mt-1 text-3xl leading-none">{athlete.name}</h1>
          <div className="mt-1.5 break-all font-mono text-[11px] leading-relaxed text-muted">
            {athlete.email}
            <br />
            {weight?.weightKg ? `${fmt(weight.weightKg)} kg` : "peso por registar"} ·{" "}
            {athlete.sex ? `ref. ${athlete.sex === "F" ? "feminina" : "masculina"}` : <Link href={`${base}/medidas`} className="text-warn hover:underline">ref. por definir</Link>}
          </div>
        </div>
        <Link href={`${base}/sessao`} className="btn-primary text-center">Registar sessão</Link>
        <ClientNav base={base} testDue={testDue} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
