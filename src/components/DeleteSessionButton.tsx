"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Apagar com confirmação em dois passos (sem janelas do browser). */
export default function DeleteSessionButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  async function del() {
    setBusy(true);
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }
  if (!confirm)
    return (
      <button type="button" onClick={() => setConfirm(true)} className="btn-ghost min-h-0 px-3 py-1.5 text-xs text-muted">
        Apagar
      </button>
    );
  return (
    <span className="flex items-center gap-1.5">
      <button type="button" onClick={del} disabled={busy} className="btn-ghost min-h-0 border-warn px-3 py-1.5 text-xs text-warn">
        {busy ? "A apagar…" : "Confirmar"}
      </button>
      <button type="button" onClick={() => setConfirm(false)} className="btn-ghost min-h-0 px-3 py-1.5 text-xs">Cancelar</button>
    </span>
  );
}
