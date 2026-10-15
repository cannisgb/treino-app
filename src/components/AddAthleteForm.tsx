"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddAthleteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);
    const res = await fetch("/api/trainer/athletes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Algo correu mal.");
    setResult(
      data.tempPassword
        ? `Conta criada. Password temporária: ${data.tempPassword} — envia-a ao cliente; vai ter de a mudar na 1.ª entrada.`
        : "Cliente existente associado a ti."
    );
    setName("");
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3 p-4">
      <div className="h-display text-base text-muted">Adicionar cliente</div>
      <label className="flex flex-col gap-1.5">
        <span className="label">Nome</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="field" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Email</span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
      </label>
      {error && <p className="text-sm text-warn">{error}</p>}
      {result && <p className="text-sm text-lime">{result}</p>}
      <button type="submit" disabled={busy} className="btn-primary">{busy ? "A adicionar…" : "Adicionar"}</button>
    </form>
  );
}
