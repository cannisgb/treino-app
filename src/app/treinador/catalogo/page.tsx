import { requirePageUser } from "@/lib/guards";
import CatalogBrowser from "@/components/CatalogBrowser";
import { isLang } from "@/lib/catalog";

export default async function CatalogPage() {
  const user = await requirePageUser("TRAINER");
  return (
    <div className="flex flex-col gap-4">
      <h1 className="h-display text-4xl">Catálogo de exercícios</h1>
      <CatalogBrowser initialLang={isLang(user.catalogLang) ? user.catalogLang : "pt"} />
    </div>
  );
}
