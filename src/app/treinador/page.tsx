import Link from "next/link";
import { requirePageUser } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { bodyPriorities, overallLevel } from "@/components/views";
import { exName, isLang } from "@/lib/catalog";
import { fmt } from "@/lib/metrics";
import { RM_TEST_INTERVAL_DAYS } from "@/lib/rmTest";
import { formatEntry, performanceSeries } from "@/lib/measure";

function ago(d: Date) {
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  return days <= 0 ? "hoje" : days === 1 ? "ontem" : `há ${days} dias`;
}

function Tile({ href, label, value, sub, accent }: { href: string; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <Link href={href} className="card flex flex-col gap-1 p-4 hover:ring-1 hover:ring-lime">
      <div className="font-mono text-[11px] text-muted">{label}</div>
      <div className={`h-display text-3xl ${accent ? "text-lime" : ""}`}>{value}</div>
      <div className="text-xs text-muted">{sub}</div>
    </Link>
  );
}

export default async function ClientSummary({ params }: { params: { id: string } }) {
  const trainer = await requirePageUser("TRAINER");
  const a = await loadAthlete(params.id);
  const lang = isLang(trainer.catalogLang) ? trainer.catalogLang : "pt";
  const base = `/treinador/clientes/${params.id}`;
  const prio = bodyPriorities(a);
  const level = overallLevel(a);
  const lastSession = a.sessions[a.sessions.length - 1];
  const month = a.sessions.filter((s) => Date.now() - s.date.getTime() < 30 * 86400000).length;
  const lastMeasure = a.measurements[a.measurements.length - 1];
  const daysSinceTest = a.lastTestDate ? Math.floor((Date.now() - a.lastTestDate.getTime()) / 86400000) : null;
  const testDue = daysSinceTest === null || daysSinceTest >= RM_TEST_INTERVAL_DAYS;

  // Destaques: exercícios com mais progresso desde a 1.ª sessão.
  const ids = [...new Set(a.entries.map((e) => e.exerciseId))];
  const highlights = ids
    .map((id) => {
      const s = performanceSeries(a.entries, id, a.bodyweight);
      return s.length > 1 ? { id, change: Math.round(s[s.length - 1].index - 100), sessions: s.length } : null;
    })
    .filter((x): x is { id: string; change: number; sessions: number } => !!x)
    .sort((x, y) => y.change - x.change)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-5">
      <h2 className="h-display text-4xl">Resumo</h2>

      {testDue && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lime/40 bg-surface px-4 py-3">
          <p className="text-sm">
            {daysSinceTest === null
              ? "Ainda não há nenhum teste de RM. Faz o primeiro para ter níveis de força comparáveis."
              : `Último teste de RM há ${daysSinceTest} dias: está na altura de repetir.`}
          </p>
          <Link href={`${base}/sessao?tipo=teste`} className="btn-ghost border-lime text-lime">Fazer teste de RM</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile href={`${base}/corpo`} label="Corpo" value={a.now.score !== null ? `${a.now.score}%` : "—"} sub={a.now.score !== null ? "do ideal" : "faltam medidas"} accent />
        <Tile href={`${base}/forca`} label="Força" value={level ?? "—"} sub={a.levelSource === "teste" ? "pelo teste de RM" : level ? "estimativa dos treinos" : "sem dados"} accent />
        <Tile
          href={`${base}/medidas`}
          label="Peso"
          value={a.bodyweight ? `${fmt(a.bodyweight)} kg` : "—"}
          sub={lastMeasure ? `medido ${ago(lastMeasure.date)}` : "por registar"}
        />
        <Tile href={`${base}/sessoes`} label="Treinos (30 dias)" value={String(month)} sub={lastSession ? `último ${ago(lastSession.date)}` : "sem sessões"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h3 className="h-display text-xl text-muted">Última sessão</h3>
            <Link href={`${base}/sessoes`} className="font-mono text-xs text-muted hover:text-lime">ver todas →</Link>
          </div>
          {lastSession ? (
            <div className="card p-4">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="font-semibold">
                  {lastSession.title || "Sessão"} <span className="font-mono text-xs font-normal text-muted">· {lastSession.date.toLocaleDateString("pt-PT")}</span>
                </span>
                <Link href={`${base}/sessoes/${lastSession.id}`} className="btn-ghost min-h-0 px-3 py-1.5 text-xs">Editar</Link>
              </div>
              {[...lastSession.entries]
                .sort((x, y) => x.order - y.order)
                .map((e) => (
                  <div key={e.id} className="flex justify-between gap-3 border-t border-line/60 py-1.5 text-sm">
                    <span>{exName(e.exerciseId, lang)}</span>
                    <span className="whitespace-nowrap font-mono text-xs text-muted">{formatEntry(e)}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Sem sessões registadas.</p>
          )}
        </section>

        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h3 className="h-display text-xl text-muted">Prioridades do corpo</h3>
              <Link href={`${base}/corpo`} className="font-mono text-xs text-muted hover:text-lime">ver corpo →</Link>
            </div>
            {prio.length ? (
              <div className="card divide-y divide-line/60 px-4">
                {prio.map((p) => (
                  <div key={p.key} className="flex items-center gap-3 py-2.5">
                    <div className="h-display w-12 text-xl text-warn">{p.pct}%</div>
                    <div className="flex-1 font-semibold">{p.label}</div>
                    <div className="font-mono text-xs text-muted">faltam {fmt((p.target ?? 0) - (p.actual ?? 0))} cm</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{a.now.score === null ? "Regista medidas para ver as prioridades." : "Nenhuma medida abaixo de 85% do ideal."}</p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h3 className="h-display text-xl text-muted">Maior progresso</h3>
              <Link href={`${base}/evolucao`} className="font-mono text-xs text-muted hover:text-lime">ver evolução →</Link>
            </div>
            {highlights.length ? (
              <div className="card divide-y divide-line/60 px-4">
                {highlights.map((h) => (
                  <Link key={h.id} href={`${base}/evolucao?ex=${encodeURIComponent(h.id)}`} className="flex items-center gap-3 py-2.5 hover:text-lime">
                    <div className={`h-display w-14 text-xl ${h.change > 0 ? "text-lime" : "text-muted"}`}>{h.change > 0 ? "+" : ""}{h.change}%</div>
                    <div className="flex-1 font-semibold">{exName(h.id, lang)}</div>
                    <div className="font-mono text-xs text-muted">{h.sessions} sessões</div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">O progresso aparece quando um exercício tiver pelo menos 2 sessões.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
