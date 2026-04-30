"use client";

import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { trackEvent } from "@/lib/analytics-events";
import { useToast } from "@/components/providers/toast-provider";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { showToast } = useToast();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      await trackEvent("login_success", { method: "password" });
      if (!auth?.currentUser?.emailVerified) {
        showToast("Verifica tu email antes de continuar.", "info");
        router.push("/verify-email");
      } else {
        showToast("Sesión iniciada correctamente.", "success");
        router.push("/dashboard");
      }
    } catch {
      await trackEvent("login_error", { method: "password" });
      showToast("No se pudo iniciar sesión.", "error");
      setError("No se pudo iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold text-white">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-400">Accede a tu dashboard de inversión.</p>
        <div className="mt-5 grid gap-3">
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button disabled={loading} className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-50">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <Link href="/register" className="text-sm text-cyan-300">
            ¿No tienes cuenta? Crear cuenta
          </Link>
          <Link href="/forgot-password" className="text-sm text-slate-300">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </form>
    </main>
  );
}
