import Link from "next/link";
import { requirePageUser } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { BodyView } from "@/components/views";

export default async function BodyPage() {
  const user = await requirePageUser("ATHLETE");
  const a = await loadAthlete(user.id);
  return (
    <div className="flex flex-col gap-4">
      <BodyView a={a} measureHref="/app/medidas" />
      <Link href="/app/medidas" className="btn-primary">Registar medidas</Link>
    </div>
  );
}
