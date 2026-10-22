"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MeasureGuide, { MEASURE_HELP } from "@/components/MeasureGuide";

import { FIELDS, type MeasurementValues } from "@/lib/measures";

/**
 * Formulário de medidas, com a figura do sítio exato de cada medida.
 * Sem `editing`: cria uma medição nova. Com `editing`: corrige uma existente (só o treinador).
 */
export default function MeasurementForm({
  athleteId,
  askSex,
  redirectTo,
  editing,
  onDone,
}: {
  athleteId: string;
  askSex: boolean;
  redirectTo?: string;
  editing?: { id: string; date: string; values: MeasurementValues };
  onDone?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    if (editing) for (const f of FIELDS) if (editing.values[f.key] != null) v[f.key] = String(editing.values[f.key]).replace(".", ",");
    return v;
  });
  const [date, setDate] = useState(() => editing?.date ?? new Date().toISOString().slice(0, 10));
  const [sex, setSex] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: Record<string, unknown> = { athleteId, date };
    for (const f of FIELDS) {
      const raw = values[f.key]?.trim().replace(",", ".");
      if (raw) {
        const n = Number(raw);
        if (Number.isNaN(n) || n <= 0) return setError(`Valor inválido em ${f.label}.`);
        payload[f.key] = n;
      } else if (editing) payload[f.key] = null; // ao corrigir, apagar um campo é permitido
    }
    if (askSex && sex) payload.sex = sex;
    if (!editing && Object.keys(payload).length <= 2) return setError("Preenche pelo menos uma medida.");
    setSaving(true);
    const res = await fetch(editing ? `/api/measurements/${editing.id}` : "/api/measurements", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error || "Algo correu mal.");
    onDone?.();
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {!editing && (
        <p className="text-sm text-muted">
          Medidas em cm. Mede de manhã, sempre com a mesma fita e do mesmo lado. A figura e o texto de cada medida mostram o sítio exato.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label">Data</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
        </label>
        {askSex && (
          <label className="flex flex-col gap-1.5">
            <span className="label">Referência</span>
            <select value={sex} onChange={(e) => setSex(e.target.value)} className="field" required>
              <option value="">Escolher…</option>
              <option value="M">Masculina (a partir do pulso)</option>
              <option value="F">Feminina (a partir da anca)</option>
            </select>
          </label>
        )}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
        {FIELDS.map((f) => (
          <div key={f.key} className="card flex gap-3 p-3">
            <MeasureGuide k={f.key} size={f.key === "weightKg" ? 56 : 52} />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`m-${f.key}`} className="text-sm font-semibold">
                  {f.label} <span className="font-mono text-[11px] font-normal text-muted">{f.unit}</span>
                </label>
              </div>
              <input
                id={`m-${f.key}`}
                inputMode="decimal"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="field"
                placeholder="—"
              />
              <p className="text-xs leading-snug text-muted">{MEASURE_HELP[f.key]}</p>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-warn">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "A guardar…" : editing ? "Guardar correção" : "Guardar medidas"}
        </button>
        {editing && onDone && (
          <button type="button" onClick={onDone} className="btn-ghost">Cancelar</button>
        )}
      </div>
    </form>
  );
}
