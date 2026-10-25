import { requirePageUser } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { StrengthView } from "@/components/views";
import { isLang } from "@/lib/catalog";

export default async function ClientStrength({ params }: { params: { id: string } }) {
  const trainer = await requirePageUser("TRAINER");
  const a = await loadAthlete(params.id);
  return (
    <div className="max-w-2xl">
      <StrengthView a={a} lang={isLang(trainer.catalogLang) ? trainer.catalogLang : "pt"} />
    </div>
  );
}
