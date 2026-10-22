"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MeasurementForm from "@/components/MeasurementForm";
import { FIELDS, type MeasurementValues } from "@/lib/measures";

export type MeasurementRow = { id: string; date: string; values: MeasurementValues };

const fmt = (v: number | null | undefined) => (v == null ? "—" : String(Math.round(v * 10) / 10).replace(".", ","));

/** Histórico de medidas com correção e eliminação (área do treinador). */
export default function EditableMeasurementHistory({ athleteId, rows }: { athleteId: string; rows: MeasurementRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/measurements/${id}`, { method: "DELETE" });
    setBusy(false);
    setConfirmDel(null);
    router.refresh();
  }

  if (!rows.length) return null;
  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="h-display text-base text-muted">Histórico · corrigir medições</div>
      {rows.map((r) => (
        <div key={r.id} className="border-t border-line/60 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-mono text-xs">{new Date(r.date + "T12:00:00Z").toLocaleDateString("pt-PT")}</div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setEditing(editing === r.id ? null : r.id)} className="min-h-[36px] rounded-lg border border-line px-3 text-xs hover:border-lime">
                {editing === r.id ? "Fechar" : "Corrigir"}
              </button>
              {confirmDel === r.id ? (
                <>
                  <button type="button" disabled={busy} onClick={() => remove(r.id)} className="min-h-[36px] rounded-lg bg-warn px-3 text-xs font-semibold text-ground">
                    Confirmar apagar
                  </button>
                  <button type="button" onClick={() => setConfirmDel(null)} className="min-h-[36px] rounded-lg border border-line px-3 text-xs">
                    Cancelar
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmDel(r.id)} className="min-h-[36px] rounded-lg border border-line px-3 text-xs text-muted hover:border-warn hover:text-warn">
                  Apagar
                </button>
              )}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-muted">
            {FIELDS.filter((f) => r.values[f.key] != null).map((f) => (
              <span key={f.key}>
                {f.label} <span className="text-chalk">{fmt(r.values[f.key])}</span>
              </span>
            ))}
          </div>
          {editing === r.id && (
            <div className="mt-3">
              <MeasurementForm athleteId={athleteId} askSex={false} editing={{ id: r.id, date: r.date, values: r.values }} onDone={() => setEditing(null)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
