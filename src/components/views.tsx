// Blocos de visualização reutilizados pelo cliente (telemóvel) e pelo treinador.
import Link from "next/link";
import type { AthleteData } from "@/lib/athleteData";
import { exName, type Lang } from "@/lib/catalog";
import { LEVEL_LABEL, LEVELS, fmt } from "@/lib/metrics";
import { LevelBar, Radar } from "@/components/charts";

/** As 3 medidas mais longe do ideal (abaixo de 85%). */
export function bodyPriorities(a: AthleteData) {
  return a.now.axes
    .filter((x) => x.pct !== null && x.pct < 85 && x.key !== "waist")
    .sort((x, y) => (x.pct ?? 0) - (y.pct ?? 0))
    .slice(0, 3);
}

/** Nível geral de força (texto) ou null sem dados. */
export function overallLevel(a: AthleteData) {
  if (!a.levels.length) return null;
  const overall = Math.round(a.levels.reduce((s, l) => s + Math.max(0, l.levelIndex) + l.progress, 0) / a.levels.length);
  return LEVEL_LABEL[LEVELS[Math.min(4, overall)]];
}

export function BodyView({ a, measureHref }: { a: AthleteData; measureHref: string }) {
  const labels = a.now.axes.map((x) => x.label);
  const hasTarget = a.now.axes.some((x) => x.target);
  const prio = bodyPriorities(a);
  const last = a.measurements[a.measurements.length - 1];
  const delta = a.then?.score != null && a.now.score != null ? a.now.score - a.then.score : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xs text-muted">
            {last ? `Última medição · ${last.date.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}` : "Sem medições"}
          </div>
          <h1 className="h-display mt-1 text-4xl">Corpo</h1>
        </div>
        {a.now.score !== null && (
          <div className="text-right">
            <div className="h-display text-5xl text-lime">{a.now.score}%</div>
            <div className="font-mono text-[11px] text-muted">
              do ideal{delta !== null ? ` · ${delta >= 0 ? "+" : ""}${delta} desde o início` : ""}
            </div>
          </div>
        )}
      </div>

      {!hasTarget ? (
        <div className="card flex flex-col gap-3 p-5">
          <p className="text-sm text-muted">
            Para calcular as proporções ideais é preciso o <strong className="text-chalk">pulso</strong> (referência masculina) ou a{" "}
            <strong className="text-chalk">anca</strong> (referência feminina), e a referência escolhida.
          </p>
          <Link href={measureHref} className="btn-primary self-start">Registar medidas</Link>
        </div>
      ) : (
        <div className="card flex flex-col gap-2 p-4">
          <div className="flex gap-4 font-mono text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-lime" />Agora</span>
            {a.then && <span className="flex items-center gap-1.5"><span className="h-0.5 w-2.5 bg-[#7C838A]" />Início</span>}
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-chalk" />Ideal</span>
          </div>
          <Radar labels={labels} now={a.now.axes.map((x) => x.pct)} then={a.then?.axes.map((x) => x.pct)} />
        </div>
      )}

      {prio.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="h-display text-lg text-muted">Prioridades</div>
          {prio.map((p) => (
            <div key={p.key} className="card flex items-center gap-3 px-4 py-3">
              <div className="h-display w-14 text-2xl text-warn">{p.pct}%</div>
              <div>
                <div className="font-semibold">{p.label}</div>
                <div className="text-sm text-muted">
                  {fmt(p.actual ?? 0)} cm · alvo {fmt(p.target ?? 0)} cm (faltam {fmt((p.target ?? 0) - (p.actual ?? 0))})
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StrengthView({ a, lang }: { a: AthleteData; lang: Lang }) {
  const overall =
    a.levels.length > 0 ? Math.round(a.levels.reduce((s, l) => s + Math.max(0, l.levelIndex) + l.progress, 0) / a.levels.length) : null;
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xs text-muted">
            1RM estimado ÷ peso corporal{a.bodyweight ? ` (${fmt(a.bodyweight)} kg)` : ""}
          </div>
          <h1 className="h-display mt-1 text-4xl">Força</h1>
        </div>
        {overall !== null && (
          <div className="text-right">
            <div className="h-display text-2xl text-lime">{LEVEL_LABEL[LEVELS[Math.min(4, overall)]]}</div>
            <div className="font-mono text-[11px] text-muted">nível geral</div>
          </div>
        )}
      </div>

      {!a.bodyweight && <p className="text-sm text-warn">Regista o peso corporal para calcular os níveis de força.</p>}
      {a.levels.length > 0 && (
        <p className="font-mono text-[11px] text-muted">
          {a.levelSource === "teste"
            ? `Fonte: teste de RM de ${a.lastTestDate?.toLocaleDateString("pt-PT")} (${a.testCount} teste${a.testCount === 1 ? "" : "s"} no total)`
            : "Fonte: estimativa a partir dos treinos — faz um teste de RM para valores comparáveis"}
        </p>
      )}
      {a.levels.length === 0 ? (
        <p className="text-sm text-muted">
          Os níveis aparecem quando houver sessões com exercícios de referência (agachamento, supino, peso morto, press militar, remada, prensa, elevações…).
        </p>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9.5px] text-muted">
            {LEVELS.map((l) => <div key={l}>{LEVEL_LABEL[l]}</div>)}
          </div>
          <div className="flex flex-col gap-2">
            {a.levels.map((l) => (
              <div key={l.exerciseId} className="card flex flex-col gap-2 px-4 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-semibold">{exName(l.exerciseId, lang)}</div>
                  <div className="font-mono text-xs">
                    {l.metric === "reps" ? `${l.value} reps` : <>{fmt(l.oneRm ?? 0, 0)} kg<span className="text-muted"> · {fmt(l.value, 2)}×</span></>}
                  </div>
                </div>
                <LevelBar levelIndex={l.levelIndex} progress={l.progress} />
                <div className="font-mono text-[11px] text-muted">
                  {l.nextIndex === null
                    ? "Nível máximo"
                    : l.metric === "reps"
                      ? `${LEVEL_LABEL[LEVELS[l.nextIndex]]} às ${l.nextTarget} reps`
                      : `${LEVEL_LABEL[LEVELS[l.nextIndex]]} aos ${l.nextTarget} kg · faltam ${Math.max(0, Math.ceil((l.nextTarget ?? 0) - (l.oneRm ?? 0)))} kg`}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {a.balance.length > 0 && (
        <div className="card flex flex-col gap-2 px-4 py-3">
          <div className="h-display text-base text-muted">Equilíbrio entre exercícios</div>
          {a.balance.map((b) => (
            <div key={b.a + b.b} className="flex justify-between gap-3 text-sm">
              <span>{exName(b.a, lang)} ÷ {exName(b.b, lang)}</span>
              <span className={`whitespace-nowrap font-mono ${b.ok ? "text-lime" : "text-warn"}`}>
                {Math.round(b.ratio * 100)}% · alvo {Math.round(b.min * 100)}–{Math.round(b.max * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
