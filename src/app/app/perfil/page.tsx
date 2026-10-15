import Link from "next/link";
import { requirePageUser } from "@/lib/guards";
import ProfileForm from "@/components/ProfileForm";
import SignOutButton from "@/components/SignOutButton";
import { isLang } from "@/lib/catalog";

export default async function ProfilePage() {
  const user = await requirePageUser("ATHLETE");
  return (
    <div className="flex flex-col gap-4">
      <h1 className="h-display text-4xl">Perfil</h1>
      <div className="text-sm text-muted">{user.name} · {user.email}</div>
      <ProfileForm sex={user.sex} lang={isLang(user.catalogLang) ? user.catalogLang : "pt"} />
      <div className="flex gap-3">
        <Link href="/change-password" className="btn-ghost text-sm">Mudar password</Link>
        <SignOutButton />
      </div>
    </div>
  );
}
