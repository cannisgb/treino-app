import raw from "@/data/catalog.json";
import media from "@/data/media.json";

export type Lang = "pt" | "en";

export type Exercise = {
  id: string;
  nome_pt: string;
  nome_en: string;
  grupo: string;
  secundarios: string[];
  equipamento: string;
  tipo: string; // composto | isolado | cardio
  padrao_movimento: string;
  unilateral: boolean;
  tipo_carga: string; // barra_total | por_halter | maquina | maquina_discos | cabo | lastro | assistencia | peso_corporal | tempo | distancia
};

export type StrengthStandard = {
  exercicio_id: string;
  metrica: "rácio" | "reps";
  homem: Record<string, number>;
  mulher: Record<string, number>;
};

export type BalanceRule = { exercicio_id: string; relativo_a: string; min: number; max: number };

const data = raw as unknown as {
  exercicios: Exercise[];
  padroes_forca: StrengthStandard[];
  equilibrio: BalanceRule[];
};

export const EXERCISES: Exercise[] = data.exercicios;
export const STANDARDS: StrengthStandard[] = data.padroes_forca;
export const BALANCE: BalanceRule[] = data.equilibrio.filter((b) => b.exercicio_id !== b.relativo_a);

const byId = new Map(EXERCISES.map((e) => [e.id, e]));
export function getExercise(id: string): Exercise | undefined {
  return byId.get(id);
}

// ---------- Exercícios escritos à mão (fora do catálogo) ----------
// Guardam-se como "custom:<nome tal como foi escrito>", por isso o nome viaja no próprio id.
export const CUSTOM_PREFIX = "custom:";
export function isCustom(id: string) {
  return id.startsWith(CUSTOM_PREFIX);
}
export function customId(name: string) {
  return CUSTOM_PREFIX + name.trim().replace(/\s+/g, " ").slice(0, 80);
}
export function isValidExerciseId(id: string) {
  return byId.has(id) || (isCustom(id) && id.length > CUSTOM_PREFIX.length + 1);
}

export function exName(id: string, lang: Lang): string {
  if (isCustom(id)) return id.slice(CUSTOM_PREFIX.length);
  const e = byId.get(id);
  if (!e) return id;
  return lang === "en" ? e.nome_en : e.nome_pt;
}

/** Normaliza para pesquisa: minúsculas, sem acentos nem pontuação. */
export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Pesquisa em PT e EN ao mesmo tempo; todas as palavras escritas têm de aparecer. */
export function searchExercises(q: string, lang: Lang, limit = 12): Exercise[] {
  const words = normalize(q).split(" ").filter(Boolean);
  if (!words.length) return [];
  const scored: { e: Exercise; score: number }[] = [];
  for (const e of EXERCISES) {
    const main = normalize(lang === "en" ? e.nome_en : e.nome_pt);
    const other = normalize(lang === "en" ? e.nome_pt : e.nome_en);
    const hay = main + " " + other;
    if (!words.every((w) => hay.includes(w))) continue;
    const score = (main.startsWith(words[0]) ? 0 : 1) + (main.includes(words.join(" ")) ? 0 : 1) + main.length / 200;
    scored.push({ e, score });
  }
  return scored.sort((a, b) => a.score - b.score).slice(0, limit).map((x) => x.e);
}

// ---------- Animações dos exercícios ----------
// GIFs em public/exercises/<id>.gif, gerados a partir do free-exercise-db (domínio público).
const MEDIA = new Set<string>(media as string[]);
export function mediaUrl(id: string): string | null {
  return MEDIA.has(id) ? `/exercises/${id}.gif` : null;
}

export const GROUPS: { id: string; pt: string; en: string }[] = [
  { id: "peito", pt: "Peito", en: "Chest" },
  { id: "costas", pt: "Costas", en: "Back" },
  { id: "ombros", pt: "Ombros", en: "Shoulders" },
  { id: "biceps", pt: "Bíceps", en: "Biceps" },
  { id: "triceps", pt: "Tríceps", en: "Triceps" },
  { id: "antebraco", pt: "Antebraço", en: "Forearms" },
  { id: "quadriceps", pt: "Quadríceps", en: "Quads" },
  { id: "isquiotibiais", pt: "Isquiotibiais", en: "Hamstrings" },
  { id: "gluteos", pt: "Glúteos", en: "Glutes" },
  { id: "adutores", pt: "Adutores", en: "Adductors" },
  { id: "gemeos", pt: "Gémeos", en: "Calves" },
  { id: "core", pt: "Core", en: "Core" },
  { id: "corpo_inteiro", pt: "Corpo inteiro", en: "Full body" },
  { id: "cardio", pt: "Cardio", en: "Cardio" },
];

export function groupName(id: string, lang: Lang): string {
  const g = GROUPS.find((x) => x.id === id);
  return g ? g[lang] : id;
}

export function isLang(v: unknown): v is Lang {
  return v === "pt" || v === "en";
}
