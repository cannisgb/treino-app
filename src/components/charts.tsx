// Gráficos em SVG simples, renderizados no servidor (sem bibliotecas).

const LIME = "#C6F432";
const WARN = "#FF8A57";

export function Radar({
  labels,
  now,
  then,
  size = 300,
}: {
  labels: string[];
  now: (number | null)[];
  then?: (number | null)[] | null;
  size?: number;
}) {
  const n = labels.length;
  const c = size / 2;
  const R = size * 0.37;
  const pt = (i: number, v: number) => {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
    const r = (Math.max(0, v) / 110) * R;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const poly = (vals: (number | null)[]) => vals.map((v, i) => pt(i, v ?? 0).map((x) => x.toFixed(1)).join(",")).join(" ");
  const ring = (v: number) => poly(labels.map(() => v));

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar das proporções: atual, primeira medição e ideal">
        {[50, 75].map((v) => (
          <polygon key={v} points={ring(v)} fill="none" stroke="#2A2E33" />
        ))}
        {labels.map((_, i) => {
          const [x, y] = pt(i, 108);
          return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#2A2E33" />;
        })}
        <polygon points={ring(100)} fill="none" stroke="#EDEBE6" strokeWidth={1.2} strokeDasharray="4 4" />
        {then && <polygon points={poly(then)} fill="none" stroke="#7C838A" strokeWidth={1.5} />}
        <polygon points={poly(now)} fill={LIME} fillOpacity={0.18} stroke={LIME} strokeWidth={2} />
      </svg>
      {labels.map((l, i) => {
        const [x, y] = pt(i, 130);
        const v = now[i];
        return (
          <div
            key={l}
            className="absolute w-20 text-center font-mono text-[10.5px] leading-[13px]"
            style={{ left: x - 40, top: y - 13, color: v !== null && v < 85 ? WARN : "#C9CDD1" }}
          >
            {l}
            <br />
            {v === null ? "—" : `${v}%`}
          </div>
        );
      })}
    </div>
  );
}

export function LevelBar({ levelIndex, progress }: { levelIndex: number; progress: number }) {
  return (
    <div className="grid grid-cols-5 gap-1" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        let bg = "#2A2E33";
        if (i <= levelIndex) bg = LIME;
        else if (i === levelIndex + 1) {
          const p = Math.round(progress * 100);
          bg = `linear-gradient(90deg, ${LIME} ${p}%, #2A2E33 ${p}%)`;
        }
        return <div key={i} className="h-2 rounded" style={{ background: bg }} />;
      })}
    </div>
  );
}

export function IndexChart({
  series,
  highlight,
  width = 322,
  height = 170,
}: {
  series: { id: string; points: { index: number }[] }[];
  highlight: string;
  width?: number;
  height?: number;
}) {
  const all = series.flatMap((s) => s.points.map((p) => p.index));
  const lo = Math.min(95, ...all);
  const hi = Math.max(125, ...all) + 3;
  const x0 = 30, x1 = width - 6, top = 8, bot = height - 10;
  const y = (v: number) => bot - ((v - lo) / (hi - lo)) * (bot - top);
  const path = (pts: { index: number }[]) =>
    pts.map((p, i) => `${(x0 + (pts.length === 1 ? 0 : (i * (x1 - x0)) / (pts.length - 1))).toFixed(1)},${y(p.index).toFixed(1)}`).join(" ");
  const sel = series.find((s) => s.id === highlight);
  const last = sel?.points[sel.points.length - 1];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução do 1RM estimado em índice, primeira sessão igual a 100">
      {[100, 120].map((v) => (
        <g key={v}>
          <line x1={28} x2={x1} y1={y(v)} y2={y(v)} stroke={v === 100 ? "#4A5057" : "#2A2E33"} strokeDasharray={v === 100 ? "3 4" : undefined} />
          <text x={0} y={y(v) + 3} fill="#A3A9AF" fontSize={10} fontFamily="monospace">
            {v}
          </text>
        </g>
      ))}
      {series
        .filter((s) => s.id !== highlight)
        .map((s) => (
          <polyline key={s.id} points={path(s.points)} fill="none" stroke="#3A3F45" strokeWidth={1.5} />
        ))}
      {sel && <polyline points={path(sel.points)} fill="none" stroke={LIME} strokeWidth={2.5} strokeLinejoin="round" />}
      {sel && last && <circle cx={x1} cy={y(last.index)} r={4} fill={LIME} />}
    </svg>
  );
}
