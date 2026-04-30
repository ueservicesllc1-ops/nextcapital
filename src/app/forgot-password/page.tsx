"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      showToast("Te enviamos un enlace para restablecer contraseña.", "success");
    } catch {
      showToast("No se pudo enviar el correo de recuperación.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold text-white">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-slate-400">Ingresa tu email y recibirás un enlace para restablecerla.</p>
        <div className="mt-5 grid gap-3">
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            disabled={loading}
            className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
          <Link href="/login" className="text-sm text-cyan-300">
            Volver al login
          </Link>
        </div>
      </form>
    </main>
  );
}
