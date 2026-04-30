"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { trackEvent } from "@/lib/analytics-events";
import { useToast } from "@/components/providers/toast-provider";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
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
      await register({ name, email, password, role: "investor" });
      await trackEvent("sign_up_success", { method: "password" });
      showToast("Cuenta creada. Revisa tu email para verificarla.", "success");
      router.push("/verify-email");
    } catch {
      await trackEvent("sign_up_error", { method: "password" });
      showToast("No se pudo crear la cuenta.", "error");
      setError("No se pudo crear la cuenta. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold text-white">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-400">Empieza a monitorear tu capital en Next Capital.</p>
        <div className="mt-5 grid gap-3">
          <input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button disabled={loading} className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-50">
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
          <Link href="/login" className="text-sm text-cyan-300">
            ¿Ya tienes cuenta? Iniciar sesión
          </Link>
        </div>
      </form>
    </main>
  );
}
