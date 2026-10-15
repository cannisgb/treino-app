"use client";

import { useState } from "react";
import AuthModal from "@/components/AuthModal";

export default function AuthButtons() {
  const [mode, setMode] = useState<"login" | "register" | null>(null);
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setMode("login")} className="btn-primary">Entrar</button>
        <button type="button" onClick={() => setMode("register")} className="btn-ghost">Criar conta</button>
      </div>
      {mode && <AuthModal initialMode={mode} onClose={() => setMode(null)} />}
    </>
  );
}
