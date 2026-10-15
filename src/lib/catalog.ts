import raw from "@/data/catalog.json";

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

export function exName(id: string, lang: Lang): string {
  const e = byId.get(id);
  if (!e) return id;
  return lang === "en" ? e.nome_en : e.nome_pt;
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
