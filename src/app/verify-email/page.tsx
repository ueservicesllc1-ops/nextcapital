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
    <main className="relative grid min-h-screen place-items-center bg-[#020203] px-4 py-12 text-zinc-100">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
      
      <div className="relative z-10 w-full max-w-md text-center">
        <Link href="/" className="mb-8 block">
          <img src="/logo.png?cb=20260430" alt="Next Capital" className="mx-auto w-14 drop-shadow-lg" />
        </Link>
        
        <div className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950/50 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500">
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/5 to-transparent opacity-50" />
          
          <div className="relative z-10">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Verifica tu correo
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Para acceder al dashboard, primero debes verificar tu cuenta. Hemos enviado un correo a:
              <br />
              <span className="mt-1 block font-medium text-teal-400">{firebaseUser?.email ?? "tu correo"}</span>
            </p>

            <div className="mx-auto mt-4 max-w-xs rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">
              <strong>Importante:</strong> Asegúrate de revisar tu carpeta de <strong>Spam o Correo no deseado</strong>, ya que el mensaje podría llegar ahí.
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={onCheck}
                disabled={loading}
                className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform hover:scale-[1.02] hover:bg-zinc-100 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? "Verificando..." : "Ya verifiqué mi email"}
              </button>

              <button
                onClick={onResend}
                disabled={loading}
                className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                Reenviar verificación
              </button>
              
              <button 
                onClick={() => logout()} 
                className="w-full rounded-full px-6 py-3 text-sm font-medium text-zinc-500 transition-colors hover:text-white"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
