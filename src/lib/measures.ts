// Lista das medidas (partilhada entre servidor e cliente).
import type { MeasureKey } from "@/components/MeasureGuide";

export const FIELDS: { key: MeasureKey; label: string; unit: string }[] = [
  { key: "weightKg", label: "Peso", unit: "kg" },
  { key: "wrist", label: "Pulso", unit: "cm" },
  { key: "neck", label: "Pescoço", unit: "cm" },
  { key: "shoulders", label: "Ombros", unit: "cm" },
  { key: "chest", label: "Peito", unit: "cm" },
  { key: "arm", label: "Braço", unit: "cm" },
  { key: "forearm", label: "Antebraço", unit: "cm" },
  { key: "waist", label: "Cintura", unit: "cm" },
  { key: "hips", label: "Anca", unit: "cm" },
  { key: "thigh", label: "Coxa", unit: "cm" },
  { key: "calf", label: "Gémeo", unit: "cm" },
];

export type MeasurementValues = Partial<Record<MeasureKey, number | null>>;
