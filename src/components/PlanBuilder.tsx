"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GROUPS, type Lang } from "@/lib/catalog";
import ExercisePicker from "@/components/ExercisePicker";
import ExerciseDemo from "@/components/ExerciseDemo";
import { GOALS, type Goal, type PlanData } from "@/lib/plan";
import LangToggle from "@/components/LangToggle";

export default function PlanBuilder({
  athleteId,
  initialLang,
  priorities,
  historyNote,
}: {
  athleteId: string;
  initialLang: Lang;
  priorities: string[];
  historyNote: string;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [goal, setGoal] = useState<Goal>("hipertrofia");
  const [days, setDays] = useState(4);
  const [minutes, setMinutes] = useState(60);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/plans/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, goal, days, minutes }),
    });
    setBusy(false);
    if (!res.ok) return setMsg((await res.json()).error || "Algo correu mal.");
    setPlan((await res.json()).plan);
  }

  async function save(publish: boolean) {
    if (!plan) return;
    setBusy(true);
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, goal, days, minutes, data: plan, publish }),
    });
    setBusy(false);
    if (!res.ok) return setMsg((await res.json()).error || "Algo correu mal.");
    setMsg(publish ? "Plano publicado: o cliente já o vê na app." : "Rascunho guardado.");
    router.refresh();
  }

  function editItem(d: number, i: number, patch: Record<string, unknown>) {
    setPlan((p) =>
      p ? { ...p, days: p.days.map((day, di) => (di !== d ? day : { ...day, items: day.items.map((it, ii) => (ii !== i ? it : { ...it, ...patch })) })) } : p
    );
  }

  const chip = (on: boolean) =>
    `min-h-[44px] rounded-xl border px-3 font-semibold ${on ? "border-lime bg-lime text-ground" : "border-line bg-ground text-chalk hover:border-lime"}`;

  return (
    <div className="flex flex-wrap gap-6">
      <section className="card flex flex-[1_1_300px] flex-col gap-5 self-start p-5">
        <div className="font-mono text-xs text-muted">{historyNote}</div>
        <div className="flex flex-col gap-2">
          <span className="label">Objetivo</span>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((g) => (
              <button key={g.id} type="button" aria-pressed={goal === g.id} onClick={() => setGoal(g.id)} className={chip(goal === g.id)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="label">Dias por semana</span>
          <div className="grid grid-cols-5 gap-2">
            {[2, 3, 4, 5, 6].map((d) => (
              <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)} className={chip(days === d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="label">Duração por sessão</span>
          <div className="grid grid-cols-3 gap-2">
            {[45, 60, 75].map((m) => (
              <button key={m} type="button" aria-pressed={minutes === m} onClick={() => setMinutes(m)} className={chip(minutes === m)}>
                {m} min
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl bg-ground p-3">
          <span className="label">Prioridades detetadas</span>
          <span className="text-sm">
            {priorities.length ? priorities.map((g) => GROUPS.find((x) => x.id === g)?.[lang] ?? g).join(", ") : "Nenhuma — corpo e força equilibrados."}
          </span>
        </div>
        <button type="button" onClick={generate} disabled={busy} className="btn-primary">
          {busy && !plan ? "A gerar…" : plan ? "Gerar outra vez" : "Gerar plano"}
        </button>
      </section>

      <section className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="h-display text-3xl">Plano proposto</h2>
          <div className="flex flex-wrap items-center gap-2">
            <LangToggle lang={lang} onChange={setLang} />
            <button type="button" disabled={!plan || busy} onClick={() => save(false)} className="btn-ghost">Guardar rascunho</button>
            <button type="button" disabled={!plan || busy} onClick={() => save(true)} className="btn-primary">Publicar para o cliente</button>
          </div>
        </div>
        {msg && <p className="text-sm text-lime">{msg}</p>}
        {!plan && <p className="text-sm text-muted">Escolhe o objetivo, os dias e a duração, e carrega em “Gerar plano”. Depois podes ajustar cada linha.</p>}
        {plan && (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
              {plan.days.map((day, d) => (
                <div key={d} className="card flex flex-col gap-2 p-4">
                  <div className="flex items-baseline justify-between">
                    <div className="h-display text-xl">{day.name}</div>
                    <div className="font-mono text-xs text-muted">Dia {d + 1}</div>
                  </div>
                  {day.items.map((it, i) => (
                    <div key={i} className="flex flex-col gap-1.5 border-t border-line/60 pt-2">
                      <div className="flex items-center gap-2">
                        <ExerciseDemo exerciseId={it.exerciseId} lang={lang} size={40} />
                        <div className={`min-w-0 flex-1 ${it.priority ? "[&_input]:text-warn" : ""}`}>
                          <ExercisePicker value={it.exerciseId} lang={lang} onChange={(id) => editItem(d, i, { exerciseId: id })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input aria-label="Séries" inputMode="numeric" value={it.sets} onChange={(e) => editItem(d, i, { sets: Number(e.target.value) || 0 })} className="field" />
                        <input aria-label="Repetições" value={it.reps} onChange={(e) => editItem(d, i, { reps: e.target.value })} className="field" />
                        <input
                          aria-label="Carga em kg"
                          inputMode="decimal"
                          value={it.kg ?? ""}
                          placeholder="kg"
                          onChange={(e) => editItem(d, i, { kg: e.target.value === "" ? null : Number(e.target.value.replace(",", ".")) })}
                          className="field"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <ul className="flex flex-col gap-1 font-mono text-xs text-muted">
              {plan.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
              <li>A laranja: exercícios de grupos prioritários. Carga vazia = ainda sem histórico nesse exercício.</li>
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
