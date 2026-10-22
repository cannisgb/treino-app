"use client";

import { useEffect, useState } from "react";
import { exName, getExercise, groupName, mediaUrl, type Lang } from "@/lib/catalog";

/** Miniatura animada do exercício; ao tocar abre em grande. */
export default function ExerciseDemo({ exerciseId, lang, size = 44 }: { exerciseId: string; lang: Lang; size?: number }) {
  const [open, setOpen] = useState(false);
  const url = exerciseId ? mediaUrl(exerciseId) : null;
  const name = exerciseId ? exName(exerciseId, lang) : "";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!url) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-center font-mono text-[9px] leading-tight text-muted"
        style={{ width: size, height: size }}
        title={exerciseId ? "Sem animação para este exercício" : undefined}
      >
        {exerciseId ? "sem\nvídeo" : ""}
      </div>
    );
  }

  const ex = getExercise(exerciseId);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ver como se faz: ${name}`}
        className="shrink-0 overflow-hidden rounded-lg border border-line bg-white hover:border-lime"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label={name} className="card w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{name}</div>
                {ex && <div className="font-mono text-xs text-muted">{groupName(ex.grupo, lang)} · {lang === "en" ? ex.nome_pt : ex.nome_en}</div>}
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="min-h-[40px] min-w-[40px] text-muted hover:text-chalk">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Demonstração: ${name}`} className="w-full rounded-xl bg-white" />
            <p className="mt-2 font-mono text-[10px] text-muted">Animação: free-exercise-db (domínio público). Posição inicial ↔ final.</p>
          </div>
        </div>
      )}
    </>
  );
}
