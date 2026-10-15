import { requirePageUser } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { EvolutionView } from "@/components/EvolutionView";
import { isLang } from "@/lib/catalog";

export default async function EvolutionPage({ searchParams }: { searchParams: { ex?: string } }) {
  const user = await requirePageUser("ATHLETE");
  const a = await loadAthlete(user.id);
  return <EvolutionView a={a} lang={isLang(user.catalogLang) ? user.catalogLang : "pt"} selected={searchParams.ex} baseHref="/app/evolucao" />;
}
