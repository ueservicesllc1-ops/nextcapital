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
    <main className="relative grid min-h-screen place-items-center bg-[#020203] px-4 text-zinc-100">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
      
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-2 block text-center">
          <div className="relative mx-auto h-16 w-56">
            <img 
              src="/logo.png?cb=20260430" 
              alt="Next Capital" 
              className="absolute left-1/2 top-1/2 w-[300px] max-w-none -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" 
            />
          </div>
        </Link>
        
        <form onSubmit={handleSubmit} className="group relative rounded-[24px] border border-white/10 bg-zinc-950/50 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-white/20">
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          <div className="relative z-10">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-sm text-zinc-400">Accede a tu dashboard de inversión.</p>
            
            <div className="mt-8 grid gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Correo electrónico</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-white/20 focus:bg-white/10 focus:ring-2 focus:ring-white/10"
                  placeholder="ejemplo@correo.com"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Contraseña</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-white/20 focus:bg-white/10 focus:ring-2 focus:ring-white/10"
                  placeholder="••••••••"
                />
              </div>

              {error ? <p className="text-sm font-medium text-rose-400">{error}</p> : null}
              
              <button disabled={loading} className="mt-2 w-full rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform hover:scale-[1.02] hover:bg-zinc-100 disabled:opacity-50 disabled:hover:scale-100">
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </div>
            
            <div className="mt-8 flex flex-col items-center justify-center gap-3 border-t border-white/10 pt-6">
              <Link href="/register" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
                ¿No tienes cuenta? <span className="text-white">Crear cuenta</span>
              </Link>
              <Link href="/forgot-password" className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
