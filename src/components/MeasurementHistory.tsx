import type { BodyMeasurement } from "@prisma/client";
import { fmt } from "@/lib/metrics";

const COLS: { key: keyof BodyMeasurement; label: string }[] = [
  { key: "weightKg", label: "Peso" },
  { key: "chest", label: "Peito" },
  { key: "waist", label: "Cint." },
  { key: "arm", label: "Braço" },
  { key: "thigh", label: "Coxa" },
  { key: "calf", label: "Gém." },
];

export function MeasurementHistory({ rows }: { rows: BodyMeasurement[] }) {
  if (!rows.length) return null;
  return (
    <div className="card overflow-x-auto p-4">
      <div className="h-display mb-2 text-base text-muted">Histórico</div>
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="font-mono text-[11px] text-muted">
          <tr>
            <th className="py-1.5 font-normal">Data</th>
            {COLS.map((c) => (
              <th key={c.key} className="py-1.5 font-normal">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-line/60">
              <td className="py-2 font-mono text-xs">{r.date.toLocaleDateString("pt-PT")}</td>
              {COLS.map((c) => {
                const v = r[c.key] as number | null;
                return <td key={c.key} className="py-2 font-mono text-xs">{v == null ? "—" : fmt(v)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
