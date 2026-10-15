import Link from "next/link";
import { requirePageUser } from "@/lib/guards";
import SignOutButton from "@/components/SignOutButton";
import { APP_NAME } from "@/lib/brand";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser("TRAINER");
  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-line px-5 py-4 sm:px-8">
        <Link href="/treinador" className="h-display text-2xl text-lime">{APP_NAME}</Link>
        <nav aria-label="Secções" className="flex flex-wrap gap-1">
          <Link href="/treinador" className="rounded-xl px-3.5 py-2.5 text-muted hover:bg-surface hover:text-chalk">Clientes</Link>
          <Link href="/treinador/catalogo" className="rounded-xl px-3.5 py-2.5 text-muted hover:bg-surface hover:text-chalk">Catálogo</Link>
          <Link href="/change-password" className="rounded-xl px-3.5 py-2.5 text-muted hover:bg-surface hover:text-chalk">Password</Link>
        </nav>
        <div className="ml-auto"><SignOutButton /></div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8">{children}</main>
    </div>
  );
}
