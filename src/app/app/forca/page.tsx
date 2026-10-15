import { requirePageUser } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { StrengthView } from "@/components/views";
import { isLang } from "@/lib/catalog";

export default async function StrengthPage() {
  const user = await requirePageUser("ATHLETE");
  const a = await loadAthlete(user.id);
  return <StrengthView a={a} lang={isLang(user.catalogLang) ? user.catalogLang : "pt"} />;
}
