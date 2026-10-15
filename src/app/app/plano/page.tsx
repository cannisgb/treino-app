import { requirePageUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PlanView } from "@/components/PlanView";
import { isLang } from "@/lib/catalog";

export default async function AthletePlanPage() {
  const user = await requirePageUser("ATHLETE");
  const plan = await prisma.trainingPlan.findFirst({ where: { athleteId: user.id, status: "published" }, orderBy: { publishedAt: "desc" } });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="h-display text-4xl">O meu plano</h1>
      {plan ? <PlanView plan={plan} lang={isLang(user.catalogLang) ? user.catalogLang : "pt"} /> : <p className="text-sm text-muted">O teu treinador ainda não publicou um plano.</p>}
    </div>
  );
}
