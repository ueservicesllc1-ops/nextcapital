"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";

export default function VerifyEmailPage() {
  const { firebaseUser, sendVerificationEmail, refreshUser, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onResend() {
    setLoading(true);
    try {
      await sendVerificationEmail();
      showToast("Correo de verificación reenviado.", "success");
    } catch {
      showToast("No se pudo reenviar el correo.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function onCheck() {
    setLoading(true);
    await refreshUser();
    if (auth?.currentUser?.emailVerified) {
      showToast("Email verificado. Bienvenido.", "success");
      router.push("/dashboard");
    } else {
      showToast("Tu email aún no está verificado.", "info");
    }
    setLoading(false);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold">Verifica tu correo electrónico</h1>
        <p className="mt-2 text-sm text-slate-300">
          Para acceder al dashboard debes verificar tu email. Revisa tu bandeja de entrada de{" "}
          <span className="text-cyan-300">{firebaseUser?.email ?? "tu correo"}</span>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={onResend}
            disabled={loading}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50"
          >
            Reenviar verificación
          </button>
          <button
            onClick={onCheck}
            disabled={loading}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-100 disabled:opacity-50"
          >
            Ya verifiqué mi email
          </button>
          <button onClick={() => logout()} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-100">
            Cerrar sesión
          </button>
        </div>
        <Link href="/login" className="mt-4 inline-block text-sm text-cyan-300">
          Volver a login
        </Link>
      </div>
    </main>
  );
}
