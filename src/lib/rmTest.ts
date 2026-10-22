// Protocolo fixo do teste de RM. Todos os treinadores testam os mesmos exercícios,
// pela mesma ordem e da mesma forma, para que os níveis de força sejam comparáveis
// entre testes e entre clientes.

export type RmTestItem = { exerciseId: string; reps: number; note: string; optional?: boolean };

export const RM_TEST: RmTestItem[] = [
  { exerciseId: "back_squat", reps: 5, note: "Coxas pelo menos paralelas ao chão." },
  { exerciseId: "barbell_bench_press", reps: 5, note: "Barra toca o peito, sem ressalto." },
  { exerciseId: "conventional_deadlift", reps: 5, note: "Do chão, costas neutras; sem straps." },
  { exerciseId: "overhead_press", reps: 5, note: "De pé, sem impulso das pernas." },
  { exerciseId: "barbell_bent_over_row", reps: 5, note: "Tronco a ~45°, barra ao umbigo." },
  { exerciseId: "pull_up", reps: 0, note: "Máximo de repetições com o peso do corpo, braços esticados em baixo." },
  { exerciseId: "leg_press_45", reps: 5, note: "Opcional. Joelhos a 90°; regista a máquina usada.", optional: true },
];

export const RM_TEST_RULES: string[] = [
  "Testa 5RM (a carga máxima para 5 repetições bem feitas). É mais seguro do que 1RM; a app estima o 1RM com a fórmula de Epley.",
  "Aquecimento por exercício: 8 reps a ~50%, 5 a ~70%, 3 a ~85% da carga esperada.",
  "Até 3 tentativas para encontrar os 5RM, com 3–5 min de descanso. Técnica falhada = tentativa falhada.",
  "Elevações: uma série ao máximo, sem balanço. Regista as reps feitas com carga 0.",
  "Sempre esta ordem, à mesma hora do dia, no início da sessão. Repete a cada 8–12 semanas.",
];

export const RM_TEST_INTERVAL_DAYS = 70; // ~10 semanas
