"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "forgot";

export default function AuthModal({ initialMode, onClose }: { initialMode: "login" | "register"; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const router = useRouter();

  async function routeAfterSignIn() {
    const user = (await getSession())?.user as any;
    if (user?.mustChangePassword) router.push("/change-password");
    else router.push(user?.role === "TRAINER" ? "/treinador" : "/app");
    router.refresh();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) return setError("Email ou password incorretos.");
    onClose();
    await routeAfterSignIn();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setError(data.error || "Algo correu mal.");
    }
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      setMode("login");
      return setError("Conta criada — entra para continuar.");
    }
    onClose();
    await routeAfterSignIn();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setForgotSent(true);
  }

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => {
        setMode(m);
        setError(null);
      }}
      className={`min-h-[40px] px-1 text-sm font-semibold ${mode === m ? "text-lime" : "text-muted hover:text-chalk"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Entrar ou registar"
        className="card w-full max-w-sm p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-4">
            {tab("login", "Entrar")}
            {tab("register", "Registar")}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="min-h-[40px] min-w-[40px] text-muted hover:text-chalk">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {mode === "forgot" ? (
          forgotSent ? (
            <p className="text-sm text-muted">Se existir uma conta com esse email, vais receber um link para escolheres uma nova password.</p>
          ) : (
            <form onSubmit={handleForgot} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="label">Email</span>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
              </label>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "A enviar…" : "Enviar link"}
              </button>
              <button type="button" onClick={() => setMode("login")} className="text-sm text-muted hover:text-chalk">
                Voltar
              </button>
            </form>
          )
        ) : (
          <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="flex flex-col gap-4">
            {mode === "register" && (
              <label className="flex flex-col gap-1.5">
                <span className="label">Nome</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="field" />
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="label">Email</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label">Password</span>
              <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
              {mode === "register" && <span className="text-xs text-muted">Pelo menos 8 caracteres.</span>}
            </label>
            {mode === "login" && (
              <button type="button" onClick={() => { setMode("forgot"); setForgotSent(false); }} className="self-start text-sm text-muted hover:text-lime">
                Esqueceste a password?
              </button>
            )}
            {error && <p className="text-sm text-warn">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Aguarda…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
