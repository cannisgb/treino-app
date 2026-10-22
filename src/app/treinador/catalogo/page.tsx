import { requirePageUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import CatalogBrowser from "@/components/CatalogBrowser";
import { isLang } from "@/lib/catalog";

export default async function CatalogPage() {
  const user = await requirePageUser("TRAINER");
  const unknown = await prisma.unknownExercise.findMany({ where: { status: "pending" }, orderBy: [{ count: "desc" }, { lastSeen: "desc" }], take: 50 });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="h-display text-4xl">Catálogo de exercícios</h1>
      {unknown.length > 0 && (
        <section className="card flex flex-col gap-2 p-4">
          <div className="h-display text-base text-muted">Exercícios escritos fora da lista · por rever</div>
          <p className="text-sm text-muted">Foram usados em sessões ou planos mas não existem no catálogo. Os mais frequentes são candidatos a entrar na próxima atualização.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="font-mono text-[11px] text-muted">
                <tr>
                  <th className="py-1.5 font-normal">Nome escrito</th>
                  <th className="py-1.5 font-normal">Vezes</th>
                  <th className="py-1.5 font-normal">1.ª vez</th>
                  <th className="py-1.5 font-normal">Última vez</th>
                </tr>
              </thead>
              <tbody>
                {unknown.map((u) => (
                  <tr key={u.id} className="border-t border-line/60">
                    <td className="py-2 text-warn">{u.name}</td>
                    <td className="py-2 font-mono">{u.count}</td>
                    <td className="py-2 font-mono text-xs">{u.firstSeen.toLocaleDateString("pt-PT")}</td>
                    <td className="py-2 font-mono text-xs">{u.lastSeen.toLocaleDateString("pt-PT")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <CatalogBrowser initialLang={isLang(user.catalogLang) ? user.catalogLang : "pt"} />
    </div>
  );
}
