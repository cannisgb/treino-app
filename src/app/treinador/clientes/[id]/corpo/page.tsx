import { requirePageUser } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { BodyView } from "@/components/views";

export default async function ClientBody({ params }: { params: { id: string } }) {
  await requirePageUser("TRAINER");
  const a = await loadAthlete(params.id);
  return (
    <div className="max-w-2xl">
      <BodyView a={a} measureHref={`/treinador/clientes/${params.id}/medidas`} />
    </div>
  );
}
