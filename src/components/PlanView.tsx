import type { TrainingPlan } from "@prisma/client";
import { exName, type Lang } from "@/lib/catalog";
import ExerciseDemo from "@/components/ExerciseDemo";
import { GOALS, type PlanData } from "@/lib/plan";
import { fmt } from "@/lib/metrics";
import { modeOf } from "@/lib/measure";

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
            <div key={j} className="flex items-center justify-between gap-3 border-t border-line/60 py-1.5 text-sm">
              <span className="flex items-center gap-2.5">
                <ExerciseDemo exerciseId={it.exerciseId} lang={lang} size={40} />
                {exName(it.exerciseId, lang)}
              </span>
              <span className={`whitespace-nowrap font-mono text-xs ${it.priority ? "text-warn" : "text-[#C9CDD1]"}`}>
                {(() => {
                  const mode = modeOf(it.exerciseId);
                  if (mode === "cardio" || mode === "distancia") return it.reps;
                  const kg = it.kg ? (mode === "lastro" ? ` · +${fmt(it.kg)} kg` : mode === "assistencia" ? ` · −${fmt(it.kg)} kg` : ` @ ${fmt(it.kg)} kg`) : "";
                  return `${it.sets}×${it.reps}${kg}`;
                })()}
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
