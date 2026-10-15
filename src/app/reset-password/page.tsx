import { Suspense } from "react";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <h1 className="h-display mb-6 text-4xl">Redefinir password</h1>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
