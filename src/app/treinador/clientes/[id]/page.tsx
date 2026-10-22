import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser, trainerAthlete } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { BodyView, StrengthView } from "@/components/views";
import { EvolutionView } from "@/components/EvolutionView";
import { exName, isLang } from "@/lib/catalog";
import { fmt } from "@/lib/metrics";
import { RM_TEST_INTERVAL_DAYS } from "@/lib/rmTest";

export default async function ClientPage({ params, searchParams }: { params: { id: string }; searchParams: { ex?: string } }) {
  const trainer = await requirePageUser("TRAINER");
  const athlete = await trainerAthlete(trainer.id, params.id);
  if (!athlete) notFound();
  const a = await loadAthlete(athlete.id);
  const lang = isLang(trainer.catalogLang) ? trainer.catalogLang : "pt";
  const base = `/treinador/clientes/${athlete.id}`;
  const recent = [...a.sessions].reverse().slice(0, 6);
  const daysSinceTest = a.lastTestDate ? Math.floor((Date.now() - a.lastTestDate.getTime()) / 86400000) : null;
  const testDue = daysSinceTest === null || daysSinceTest >= RM_TEST_INTERVAL_DAYS;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-muted">
            {athlete.email}
            {a.bodyweight ? ` · ${fmt(a.bodyweight)} kg` : ""}
            {athlete.sex ? ` · referência ${athlete.sex === "F" ? "feminina" : "masculina"}` : " · referência por definir"}
          </div>
          <h1 className="h-display mt-1 text-4xl">{athlete.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`${base}/medidas`} className="btn-ghost">Medidas</Link>
          <Link href={`${base}/plano`} className="btn-ghost">Plano</Link>
          <Link href={`${base}/sessao?tipo=teste`} className={testDue ? "btn-ghost border-lime text-lime" : "btn-ghost"}>Teste de RM</Link>
          <Link href={`${base}/sessao`} className="btn-primary">Registar sessão</Link>
        </div>
      </div>

      {testDue && (
        <p className="rounded-xl border border-lime/40 bg-surface px-4 py-3 text-sm">
          {daysSinceTest === null
            ? "Ainda não há nenhum teste de RM. Faz o primeiro para ter níveis de força comparáveis."
            : `Último teste de RM há ${daysSinceTest} dias: está na altura de repetir (a cada 8–12 semanas).`}
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-6">
        <BodyView a={a} measureHref={`${base}/medidas`} />
        <StrengthView a={a} lang={lang} />
        <EvolutionView a={a} lang={lang} selected={searchParams.ex} baseHref={base} />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="h-display text-2xl text-muted">Últimas sessões</h2>
        {recent.length === 0 && <p className="text-sm text-muted">Sem sessões registadas.</p>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
          {recent.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="mb-1.5 flex justify-between">
                <span className="font-semibold">
                  {s.title || "Sessão"}
                  {s.kind === "teste" && <span className="ml-2 rounded bg-lime px-1.5 py-0.5 font-mono text-[10px] text-ground">TESTE RM</span>}
                </span>
                <span className="font-mono text-xs text-muted">{s.date.toLocaleDateString("pt-PT")}</span>
              </div>
              {s.entries
                .sort((x, y) => x.order - y.order)
                .map((e) => (
                  <div key={e.id} className="flex justify-between gap-3 border-t border-line/60 py-1.5 text-sm">
                    <span>{exName(e.exerciseId, lang)}</span>
                    <span className="whitespace-nowrap font-mono text-xs text-muted">{e.sets}×{e.reps} · {fmt(e.kg)} kg</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
