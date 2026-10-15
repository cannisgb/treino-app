import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { requirePageUser } from "@/lib/guards";

export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("ATHLETE");
  return (
    <div className="mx-auto min-h-screen max-w-md pb-28">
      <header className="flex items-center justify-between px-5 pt-5">
        <div className="font-mono text-xs text-muted">Olá, {user.name.split(" ")[0]}</div>
        <Link href="/app/perfil" aria-label="Perfil" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted hover:text-chalk">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          </svg>
        </Link>
      </header>
      <main className="px-5 pt-2">{children}</main>
      <BottomNav />
    </div>
  );
}
