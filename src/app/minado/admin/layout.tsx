"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Zap, 
  Cpu, 
  Layers, 
  Coins, 
  LogOut, 
  ArrowLeft, 
  Activity, 
  Users, 
  Clock, 
  ShieldAlert, 
  CreditCard 
} from "lucide-react";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "1619";

const miningAdminLinks = [
  { href: "/minado/admin", label: "Overview Minado", icon: Activity },
  { href: "/minado/admin/users", label: "Asignar Planes / Red", icon: Users },
  { href: "/minado/admin/deposits", label: "Contratos Pendientes", icon: Coins },
  { href: "/minado/admin/withdrawals", label: "Retiros de Minería", icon: CreditCard },
];

export default function MiningAdminLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, appUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    const isAdminEmail = firebaseUser?.email === "luisuf@gmail.com";
    const isDev = process.env.NODE_ENV === "development";
    if (appUser && appUser.role !== "admin" && !isAdminEmail && !isDev) {
      router.replace("/minado/dashboard");
    }
  }, [firebaseUser, appUser, loading, router]);

  if (loading || !firebaseUser || !appUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#060608] text-amber-500 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
          VERIFICANDO ACCESO A MINING_ADMIN_OS...
        </div>
      </div>
    );
  }

  const isAdminEmail = firebaseUser?.email === "luisuf@gmail.com";
  const isDev = process.env.NODE_ENV === "development";
  if (appUser.role !== "admin" && !isAdminEmail && !isDev) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#060608] px-4 text-white font-sans">
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
          className="w-full max-w-sm rounded-[32px] border border-amber-500/10 bg-[#0d0d14]/80 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
          style={{ boxShadow: '0 0 50px rgba(245,158,11,0.03)' }}
        >
          {/* Top light source */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <ShieldAlert size={28} className="text-amber-500" />
          </div>
          
          <h2 className="mb-2 text-center text-xl font-black tracking-tight text-white uppercase">MINING_CONTROL_OS</h2>
          <p className="mb-8 text-center text-xs text-slate-500">Área de acceso restringido para personal técnico y auditores.</p>
          
          <input 
            type="password" 
            placeholder="PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-4 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-amber-500/30 focus:ring-2 focus:ring-amber-500/5 transition-all font-mono"
            autoFocus
          />
          
          <button className="mt-6 w-full rounded-xl bg-amber-500 px-4 py-4 font-bold text-xs text-black shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:opacity-95 transition-all active:scale-[0.98] uppercase tracking-widest">
            Desbloquear Terminal
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[#060608] flex flex-col lg:flex-row font-sans">
      
      {/* Mining Admin Sidebar */}
      <aside className="w-full lg:w-64 bg-[#09090e] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Zap size={16} className="text-amber-400 animate-pulse" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-widest text-white leading-none">Next<span className="text-amber-400">Capital</span></h1>
            <span className="text-[9px] font-bold text-amber-500/80 tracking-widest uppercase">MINING_ADMIN</span>
          </div>
        </div>

        <div className="p-5 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <Cpu size={18} className="text-amber-400" />
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-xs truncate text-white">{appUser?.name || 'Administrador'}</div>
              <div className="font-mono text-[9px] text-slate-500 mt-0.5 truncate">ADMIN_NODE // OK</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {miningAdminLinks.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs tracking-wide transition-all ${
                  active 
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link href="/minado/dashboard" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all border border-white/5">
            <ArrowLeft size={12} /> Dashboard Minería
          </Link>
          <Link href="/next/admin" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-cyan-500/5 hover:bg-cyan-500/10 text-xs font-semibold text-cyan-400 transition-all border border-cyan-500/10">
            <Layers size={12} /> Admin NextCapital
          </Link>
        </div>
      </aside>

      {/* Main Admin Canvas */}
      <div className="flex-1 min-w-0 min-h-screen overflow-y-auto">
        {children}
      </div>

    </div>
  );
}
