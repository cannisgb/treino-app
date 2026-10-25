import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/guards";
import AddAthleteForm from "@/components/AddAthleteForm";

function ago(d: Date | null) {
  if (!d) return "sem sessões";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  return days <= 0 ? "hoje" : days === 1 ? "ontem" : `há ${days} dias`;
}

export default async function TrainerHome() {
  const trainer = await requirePageUser("TRAINER");
  const athletes = await prisma.user.findMany({
    where: { trainerId: trainer.id, role: "ATHLETE" },
    orderBy: { name: "asc" },
    include: { sessions: { orderBy: { date: "desc" }, take: 1, select: { date: true } } },
  });

  return (
    <div className="flex flex-wrap gap-6">
      <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-3">
        <h1 className="h-display text-4xl">Clientes</h1>
        {athletes.length === 0 && <p className="text-sm text-muted">Ainda sem clientes. Adiciona o primeiro ao lado.</p>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {athletes.map((a) => (
            <Link key={a.id} href={`/treinador/clientes/${a.id}`} className="card flex items-center justify-between gap-3 p-4 hover:ring-1 hover:ring-lime">
              <div>
                <div className="font-semibold">{a.name}</div>
                <div className="text-xs text-muted">{a.email}</div>
              </div>
              <div className="font-mono text-xs text-muted">{ago(a.sessions[0]?.date ?? null)}</div>
            </Link>
          ))}
        </div>
      </section>
      <aside className="flex-[1_1_280px]">
        <AddAthleteForm />
      </aside>
    </div>
  );
}
