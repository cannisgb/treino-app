import Link from "next/link";
import type { AthleteData } from "@/lib/athleteData";
import { exName, getExercise, groupName, type Lang } from "@/lib/catalog";
import { fmt } from "@/lib/metrics";
import { formatEntry, modeOf, performance, performanceSeries, usesLoadFor1RM } from "@/lib/measure";
import { IndexChart } from "@/components/charts";

export function EvolutionView({ a, lang, selected, baseHref }: { a: AthleteData; lang: Lang; selected?: string; baseHref: string }) {
  // Exercícios mais frequentes primeiro.
  const freq = new Map<string, number>();
  for (const e of a.entries) freq.set(e.exerciseId, (freq.get(e.exerciseId) ?? 0) + 1);
  const ids = [...freq.entries()].sort((x, y) => y[1] - x[1]).map(([id]) => id).filter((id) => performanceSeries(a.entries, id, a.bodyweight).length > 0);
  const top = ids.slice(0, 6);
  const sel = selected && ids.includes(selected) ? selected : top[0];

  // Séries por grupo nos últimos 7 dias.
  const weekAgo = Date.now() - 7 * 86400000;
  const vol = new Map<string, number>();
  for (const e of a.entries) {
    if (e.date.getTime() < weekAgo) continue;
    const g = getExercise(e.exerciseId)?.grupo;
    if (g && g !== "cardio") vol.set(g, (vol.get(g) ?? 0) + e.sets);
  }
  const volRows = [...vol.entries()].sort((x, y) => y[1] - x[1]);

  if (!sel) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="h-display text-4xl">Evolução</h1>
        <p className="text-sm text-muted">A evolução aparece depois das primeiras sessões registadas.</p>
      </div>
    );
  }

  const series = top.map((id) => ({ id, points: performanceSeries(a.entries, id, a.bodyweight) }));
  if (!top.includes(sel)) series.push({ id: sel, points: performanceSeries(a.entries, sel, a.bodyweight) });
  const s = series.find((x) => x.id === sel)!.points;
  const last = s[s.length - 1];
  const selMode = modeOf(sel, a.entries.find((e) => e.exerciseId === sel)?.mode);
  const bestEntry = a.entries
    .filter((e) => e.exerciseId === sel)
    .reduce<{ e: (typeof a.entries)[number]; v: number } | null>((b, e) => {
      const v = performance(e, a.bodyweight).value;
      return !b || v > b.v ? { e, v } : b;
    }, null);
  const valueText = (v: number, unit: string) => (unit === "kg" ? `${fmt(v, 0)} kg` : unit === "m/min" ? `${fmt(v, 0)} m/min` : `${fmt(v, unit === "min" ? 0 : 0)} ${unit}`);
  const weeks = s.length > 1 ? Math.max(1, Math.round((last.date.getTime() - s[0].date.getTime()) / (7 * 86400000))) : 0;

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <div className="font-mono text-xs text-muted">1.ª sessão = 100 · melhor resultado por sessão (1RM, reps, tempo ou ritmo)</div>
        <h1 className="h-display mt-1 text-4xl">Evolução</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {top.map((id) => (
          <Link
            key={id}
            href={`${baseHref}?ex=${id}`}
            aria-current={id === sel ? "true" : undefined}
            className={`flex min-h-[40px] items-center rounded-full border px-3.5 text-sm font-semibold ${id === sel ? "border-lime bg-lime text-ground" : "border-line text-chalk"}`}
          >
            {exName(id, lang)}
          </Link>
        ))}
      </div>
      <div className="card flex flex-col gap-1.5 p-3.5">
        <div className="flex items-baseline justify-between">
          <div className="h-display text-4xl text-lime">{Math.round(last.index)}</div>
          <div className="text-right font-mono text-xs text-muted">
            {exName(sel, lang)}
            <br />
            {s.length > 1 ? `${last.index >= 100 ? "+" : ""}${Math.round(last.index - 100)}% em ${weeks} semana${weeks === 1 ? "" : "s"}` : "1 sessão registada"}
          </div>
        </div>
        <IndexChart series={series} highlight={sel} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="card px-3 py-2.5"><div className="font-mono text-[10px] text-muted">{last.label}</div><div className="h-display text-2xl">{valueText(last.value, last.unit)}</div></div>
        <div className="card px-3 py-2.5"><div className="font-mono text-[10px] text-muted">Melhor registo</div><div className="h-display text-xl">{bestEntry ? formatEntry(bestEntry.e) : "—"}</div></div>
        <div className="card px-3 py-2.5">
          <div className="font-mono text-[10px] text-muted">{usesLoadFor1RM(selMode) && last.unit === "kg" ? "Força rel." : "Sessões"}</div>
          <div className="h-display text-2xl">{usesLoadFor1RM(selMode) && last.unit === "kg" ? (a.bodyweight ? `${fmt(last.value / a.bodyweight, 2)}×` : "—") : s.length}</div>
        </div>
      </div>
      {volRows.length > 0 && (
        <div className="card flex flex-col gap-2 px-4 py-3">
          <div className="flex justify-between">
            <div className="h-display text-base text-muted">Séries nos últimos 7 dias</div>
            <div className="font-mono text-[10px] text-muted">faixa útil 10–20</div>
          </div>
          {volRows.map(([g, n]) => (
            <div key={g} className="flex items-center gap-2.5 text-sm">
              <div className="w-24">{groupName(g, lang)}</div>
              <div className="relative h-2 flex-1 rounded bg-line">
                <div className="absolute -bottom-1 -top-1 border-x border-[#4A5057]" style={{ left: "41.7%", width: "41.7%" }} />
                <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${Math.min(100, (n / 24) * 100)}%`, background: n < 10 ? "#FF8A57" : "#C6F432" }} />
              </div>
              <div className="w-6 text-right font-mono">{n}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
