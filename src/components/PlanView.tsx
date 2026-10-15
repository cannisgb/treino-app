import type { TrainingPlan } from "@prisma/client";
import { exName, type Lang } from "@/lib/catalog";
import { GOALS, type PlanData } from "@/lib/plan";
import { fmt } from "@/lib/metrics";

export function PlanView({ plan, lang }: { plan: TrainingPlan; lang: Lang }) {
  const data = plan.data as unknown as PlanData;
  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs text-muted">
        {GOALS.find((g) => g.id === plan.goal)?.label} · {plan.daysPerWeek} dias · {plan.minutes} min
        {plan.publishedAt ? ` · publicado a ${plan.publishedAt.toLocaleDateString("pt-PT")}` : ""}
      </div>
      {data.days.map((d, i) => (
        <div key={i} className="card flex flex-col gap-1.5 p-4">
          <div className="flex items-baseline justify-between">
            <div className="h-display text-xl">{d.name}</div>
            <div className="font-mono text-xs text-muted">Dia {i + 1}</div>
          </div>
          {d.items.map((it, j) => (
            <div key={j} className="flex justify-between gap-3 border-t border-line/60 py-1.5 text-sm">
              <span>{exName(it.exerciseId, lang)}</span>
              <span className={`whitespace-nowrap font-mono text-xs ${it.priority ? "text-warn" : "text-[#C9CDD1]"}`}>
                {it.sets}×{it.reps}
                {it.kg ? ` @ ${fmt(it.kg)} kg` : ""}
              </span>
            </div>
          ))}
        </div>
      ))}
      <ul className="flex flex-col gap-1 font-mono text-xs text-muted">
        {data.notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
