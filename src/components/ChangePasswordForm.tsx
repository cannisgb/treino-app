"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ChangePasswordForm() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) return setError("As passwords novas não coincidem.");
    setSaving(true);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || "Algo correu mal.");
    await update();
    router.push((session?.user as any)?.role === "TRAINER" ? "/treinador" : "/app");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="label">Password atual</span>
        <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="field" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Nova password</span>
        <input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="field" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Confirmar nova password</span>
        <input required type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="field" />
      </label>
      {error && <p className="text-sm text-warn">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary self-start">
        {saving ? "A guardar…" : "Atualizar password"}
      </button>
    </form>
  );
}
