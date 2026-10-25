import { redirect } from "next/navigation";
import { currentUser } from "@/lib/guards";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const user = await currentUser();
  if (!user) redirect("/");
  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <h1 className="h-display mb-3 text-4xl">{user.mustChangePassword ? "Define uma password nova" : "Mudar password"}</h1>
      {user.mustChangePassword && <p className="mb-6 text-sm text-muted">A tua conta foi criada com uma password temporária. Escolhe uma nova para continuar.</p>}
      <ChangePasswordForm />
    </main>
  );
}
