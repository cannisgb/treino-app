import { requirePageUser } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { EvolutionView } from "@/components/EvolutionView";
import { isLang } from "@/lib/catalog";

export default async function ClientEvolution({ params, searchParams }: { params: { id: string }; searchParams: { ex?: string } }) {
  const trainer = await requirePageUser("TRAINER");
  const a = await loadAthlete(params.id);
  return (
    <div className="max-w-3xl">
      <EvolutionView a={a} lang={isLang(trainer.catalogLang) ? trainer.catalogLang : "pt"} selected={searchParams.ex} baseHref={`/treinador/clientes/${params.id}/evolucao`} />
    </div>
  );
}
