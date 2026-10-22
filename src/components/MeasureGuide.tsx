// Figura simples com a linha da fita no sítio certo, para medir sempre da mesma forma.

export type MeasureKey = "weightKg" | "wrist" | "neck" | "shoulders" | "chest" | "arm" | "forearm" | "waist" | "hips" | "thigh" | "calf";

// Linha da fita em cada medida: [x1, y1, x2, y2] no sistema 0..100 × 0..220.
const TAPE: Record<Exclude<MeasureKey, "weightKg">, [number, number, number, number]> = {
  neck: [44, 27, 56, 27],
  shoulders: [24, 39, 76, 39],
  chest: [31, 56, 69, 56],
  arm: [68, 50, 79, 53],
  forearm: [71, 76, 82, 78],
  wrist: [74, 97, 84, 98],
  waist: [35, 90, 65, 90],
  hips: [31, 111, 69, 111],
  thigh: [51, 128, 67, 128],
  calf: [54, 170, 66, 170],
};

export const MEASURE_HELP: Record<MeasureKey, string> = {
  weightKg: "De manhã, em jejum, depois de ir à casa de banho, com pouca roupa.",
  wrist: "Logo acima do osso saliente do pulso, do lado da mão dominante. Fita justa.",
  neck: "A meio do pescoço, logo abaixo da maçã de Adão. Olhar em frente.",
  shoulders: "À volta dos ombros, na parte mais larga dos deltoides. Braços relaxados ao lado.",
  chest: "Na linha dos mamilos, depois de expirar normalmente. Fita paralela ao chão.",
  arm: "Braço dominante contraído (cotovelo a 90°), no ponto mais grosso do bíceps.",
  forearm: "Braço esticado e mão fechada, no ponto mais grosso, perto do cotovelo.",
  waist: "Na linha do umbigo, barriga relaxada, no fim de uma expiração normal.",
  hips: "Pés juntos, no ponto mais largo dos glúteos.",
  thigh: "De pé, peso nas duas pernas, logo abaixo da prega do glúteo.",
  calf: "De pé, peso nas duas pernas, no ponto mais grosso do gémeo.",
};

export default function MeasureGuide({ k, size = 64 }: { k: MeasureKey; size?: number }) {
  const body = "#3A3F45";
  const lime = "#C6F432";
  const w = size;
  const h = Math.round((size * 220) / 100);

  if (k === "weightKg") {
    return (
      <svg width={w} height={w} viewBox="0 0 100 100" aria-hidden="true" className="shrink-0">
        <rect x="14" y="30" width="72" height="56" rx="10" fill={body} />
        <rect x="30" y="40" width="40" height="16" rx="4" fill="#111315" />
        <path d="M40 52 L50 45" stroke={lime} strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="52" r="2.5" fill={lime} />
      </svg>
    );
  }

  const t = TAPE[k];
  return (
    <svg width={w} height={h} viewBox="0 0 100 220" aria-hidden="true" className="shrink-0">
      {/* cabeça e pescoço */}
      <circle cx="50" cy="13" r="9" fill={body} />
      <rect x="45.5" y="20" width="9" height="12" rx="3" fill={body} />
      {/* tronco */}
      <path d="M29 35 Q50 30 71 35 L66 62 L63 90 Q68 102 68 114 L32 114 Q32 102 37 90 L34 62 Z" fill={body} />
      {/* braços */}
      <path d="M31 37 L25 68 L21 100" stroke={body} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M69 37 L75 68 L79 100" stroke={body} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* pernas */}
      <path d="M42 112 L40 160 L40 205" stroke={body} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M58 112 L60 160 L60 205" stroke={body} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* fita */}
      <line x1={t[0]} y1={t[1]} x2={t[2]} y2={t[3]} stroke={lime} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx={t[2] + 2} cy={t[3]} r="2.6" fill={lime} />
    </svg>
  );
}
