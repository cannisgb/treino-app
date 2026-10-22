"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { customId, exName, groupName, isCustom, searchExercises, type Lang } from "@/lib/catalog";

/**
 * Campo de exercício onde se escreve: pesquisa no catálogo (PT e EN ao mesmo tempo).
 * Se o exercício não existir, permite usá-lo na mesma — fica registado para revisão.
 */
export default function ExercisePicker({
  value,
  lang,
  onChange,
}: {
  value: string;
  lang: Lang;
  onChange: (exerciseId: string) => void;
}) {
  const [text, setText] = useState(value ? exName(value, lang) : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  // Quando muda o idioma ou o valor vem de fora, mostra o nome certo.
  useEffect(() => {
    setText(value ? exName(value, lang) : "");
  }, [value, lang]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const results = useMemo(() => searchExercises(text, lang, 10), [text, lang]);
  const typed = text.trim();
  const exact = results.some((e) => exName(e.id, lang).toLowerCase() === typed.toLowerCase());
  const options = [
    ...results.map((e) => ({ id: e.id, label: exName(e.id, lang), hint: groupName(e.grupo, lang), custom: false })),
    ...(typed.length >= 3 && !exact ? [{ id: customId(typed), label: `Usar “${typed}”`, hint: "não está na lista · fica registado para revisão", custom: true }] : []),
  ];

  function pick(id: string) {
    onChange(id);
    setText(exName(id, lang));
    setOpen(false);
  }

  return (
    <div ref={wrap} className="relative w-full">
      <input
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Exercício"
        value={text}
        placeholder="Escreve para procurar…"
        onFocus={(e) => {
          setOpen(true);
          e.target.select();
        }}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (!options.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(options[active].id);
          } else if (e.key === "Escape") setOpen(false);
        }}
        className={`field ${value && isCustom(value) ? "border-warn/60" : ""}`}
      />
      {open && options.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-72 w-full min-w-[260px] overflow-auto rounded-xl border border-line bg-raised p-1 shadow-2xl">
          {options.map((o, i) => (
            <li
              key={o.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(o.id);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${i === active ? "bg-surface" : ""} ${o.custom ? "border-t border-line text-warn" : ""}`}
            >
              <div>{o.label}</div>
              <div className="font-mono text-[10px] text-muted">{o.hint}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
