"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) return <p className="text-sm text-muted">Este link não é válido. Pede um novo no ecrã de entrada.</p>;
  if (done)
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">Password atualizada. Já podes entrar.</p>
        <Link href="/" className="btn-primary self-start">Ir para a entrada</Link>
      </div>
    );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) return setError("As passwords não coincidem.");
    setSaving(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || "Algo correu mal.");
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="label">Nova password</span>
        <input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="field" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Confirmar</span>
        <input required type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="field" />
      </label>
      {error && <p className="text-sm text-warn">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary self-start">
        {saving ? "A guardar…" : "Atualizar password"}
      </button>
    </form>
  );
}
