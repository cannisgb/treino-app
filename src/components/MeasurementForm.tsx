"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "weightKg", label: "Peso (kg)" },
  { key: "wrist", label: "Pulso", hint: "base do cálculo (homem)" },
  { key: "neck", label: "Pescoço" },
  { key: "shoulders", label: "Ombros", hint: "perímetro" },
  { key: "chest", label: "Peito" },
  { key: "arm", label: "Braço", hint: "contraído" },
  { key: "forearm", label: "Antebraço" },
  { key: "waist", label: "Cintura", hint: "no umbigo" },
  { key: "hips", label: "Anca", hint: "base do cálculo (mulher)" },
  { key: "thigh", label: "Coxa" },
  { key: "calf", label: "Gémeo" },
];

export default function MeasurementForm({
  athleteId,
  askSex,
  redirectTo,
}: {
  athleteId: string;
  askSex: boolean;
  redirectTo: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sex, setSex] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: Record<string, unknown> = { athleteId, date };
    for (const f of FIELDS) {
      const v = values[f.key]?.replace(",", ".");
      if (v) payload[f.key] = Number(v);
    }
    if (askSex && sex) payload.sex = sex;
    if (Object.keys(payload).length <= 2) return setError("Preenche pelo menos uma medida.");
    setSaving(true);
    const res = await fetch("/api/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error || "Algo correu mal.");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm text-muted">Medidas em cm. Mede de manhã, sempre com a mesma fita. Só preenches o que mediste.</p>
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
              <option value="M">Masculina</option>
              <option value="F">Feminina</option>
            </select>
          </label>
        )}
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1.5">
            <span className="label">
              {f.label}
              {f.hint ? <span className="text-muted/70"> · {f.hint}</span> : null}
            </span>
            <input
              inputMode="decimal"
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="field"
              placeholder="—"
            />
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-warn">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "A guardar…" : "Guardar medidas"}
      </button>
    </form>
  );
}
