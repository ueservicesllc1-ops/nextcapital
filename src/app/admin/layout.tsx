"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "1619";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, appUser, loading } = useAuth();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    const isAdminEmail = firebaseUser?.email === "luisuf@gmail.com";
    if (appUser && appUser.role !== "admin" && !isAdminEmail) {
      router.replace("/dashboard");
    }
  }, [firebaseUser, appUser, loading, router]);

  if (loading || !firebaseUser || !appUser) {
    return <div className="grid min-h-screen place-items-center bg-[#020203] text-white">Cargando acceso...</div>;
  }

  const isAdminEmail = firebaseUser?.email === "luisuf@gmail.com";
  if (appUser.role !== "admin" && !isAdminEmail) {
    return null; // useEffect se encarga de redirigir
  }

  if (!isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#020203] px-4 text-white">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (pin === ADMIN_PIN) {
              setIsAuthenticated(true);
            } else {
              alert("PIN incorrecto. Acceso denegado.");
              setPin("");
            }
          }}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/50 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
            <svg className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mb-6 text-center text-xl font-semibold tracking-tight text-white">Acceso Restringido</h2>
          <input 
            type="password" 
            placeholder="Ingresa el PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10"
            autoFocus
          />
          <button className="mt-6 w-full rounded-full bg-white px-4 py-3 font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform hover:scale-[1.02] hover:bg-zinc-100">
            Desbloquear Admin
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="lg:flex">
      <Sidebar admin />
      <div className="min-h-screen flex-1">{children}</div>
    </div>
  );
}
