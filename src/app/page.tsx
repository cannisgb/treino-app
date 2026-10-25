import { redirect } from "next/navigation";
import AuthButtons from "@/components/AuthButtons";
import { currentUser } from "@/lib/guards";
import { APP_NAME } from "@/lib/brand";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect(user.role === "TRAINER" ? "/treinador" : "/app");

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 px-5 py-12">
      <div className="h-display text-2xl text-lime">{APP_NAME}</div>
      <h1 className="h-display text-5xl sm:text-6xl">Mede o corpo. Segue a força. Treina com plano.</h1>
      <p className="text-lg text-muted">
        Proporções comparadas com uma referência ideal, níveis de força por exercício, a evolução semana a semana, e um plano feito pelo teu treinador a partir do teu histórico.
      </p>
      <AuthButtons />
      <p className="font-mono text-xs text-muted">No Android: abre no Chrome › menu › “Instalar app”. No iPhone: Safari › Partilhar › “Adicionar ao ecrã principal”.</p>
    </main>
  );
}
