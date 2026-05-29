"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { formatCurrency } from "@/lib/utils";
import { 
  Zap, 
  Cpu, 
  Coins, 
  Users, 
  Layers, 
  Activity, 
  TrendingUp 
} from "lucide-react";

export default function MiningAdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHashratePower: 0, // In TH/s
    totalActiveCapital: 0,
    activeMinersCount: 0,
    pendingActivations: 0,
    totalMiningProfitsPaid: 0,
    starterCount: 0,
    proCount: 0,
    industrialCount: 0,
  });

  async function loadStats() {
    setLoading(true);
    try {
      const [usersSnap, depositsSnap, profitsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "deposits")),
        getDocs(query(collection(db, "transactions"), where("type", "==", "profit"), where("status", "==", "approved"))),
      ]);

      let starterCount = 0;
      let proCount = 0;
      let industrialCount = 0;
      let totalActiveCapital = 0;
      let activeMiners = new Set<string>();
      let pendingActivations = 0;

      depositsSnap.docs.forEach((doc) => {
        const d = doc.data();
        const isMiningPlan = ["NC-S1", "NC-P2", "NC-I3"].includes(d.planId ?? "");
        
        if (isMiningPlan) {
          if (d.status === "approved") {
            activeMiners.add(d.userId);
            totalActiveCapital += Number(d.amount ?? 0);
            
            if (d.planId === "NC-S1") starterCount++;
            else if (d.planId === "NC-P2") proCount++;
            else if (d.planId === "NC-I3") industrialCount++;
          } else if (d.status === "pending") {
            pendingActivations++;
          }
        }
      });

      // Calculate total hashrate: NC-S1 = 100 TH/s, NC-P2 = 250 TH/s, NC-I3 = 500 TH/s
      const totalHashratePower = (starterCount * 100) + (proCount * 250) + (industrialCount * 500);

      // Sum all approved mining profit transactions
      let totalMiningProfitsPaid = 0;
      profitsSnap.docs.forEach((doc) => {
        const t = doc.data();
        // Since we filtered by type 'profit', let's check if the user had a mining contract
        totalMiningProfitsPaid += Number(t.amount ?? 0);
      });

      setStats({
        totalUsers: usersSnap.size,
        totalHashratePower,
        totalActiveCapital,
        activeMinersCount: activeMiners.size,
        pendingActivations,
        totalMiningProfitsPaid,
        starterCount,
        proCount,
        industrialCount,
      });
    } catch (e) {
      console.error("Error loading mining stats:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500 font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-4" />
        CARGANDO SISTEMA DE TELEMETRÍA GLOBAL...
      </div>
    );
  }

  return (
    <main className="p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-500 tracking-wider">CORE_MINING_OS // PANEL DE AUDITORÍA</span>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">Consola de Control de Minería</h2>
        </div>
        <button 
          onClick={loadStats}
          className="py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs hover:bg-amber-500/20 transition-all"
        >
          Actualizar Sensores
        </button>
      </div>

      {/* Metrics Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="rounded-[28px] border border-white/5 bg-[#0d0d14] p-6 flex flex-col justify-between hover:border-white/10 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Potencia Total Hashrate</span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{stats.totalHashratePower.toLocaleString("es-ES")} <span className="text-xs text-amber-500">TH/s</span></p>
            <p className="text-[10px] text-slate-500 mt-1">Potencia total asignada a mineros activos</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/5 bg-[#0d0d14] p-6 flex flex-col justify-between hover:border-white/10 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Capital Activo en Hardware</span>
            <Coins size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{formatCurrency(stats.totalActiveCapital)}</p>
            <p className="text-[10px] text-slate-500 mt-1">Inversión total aprobada en contratos</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/5 bg-[#0d0d14] p-6 flex flex-col justify-between hover:border-white/10 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Mineros Online (Nodos)</span>
            <Cpu size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{stats.activeMinersCount} <span className="text-xs text-zinc-500">/ {stats.totalUsers}</span></p>
            <p className="text-[10px] text-slate-500 mt-1">Usuarios con contratos físicos activos</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Activaciones Pendientes</span>
            <Activity size={16} className="text-amber-400 animate-pulse" />
          </div>
          <div>
            <p className="text-3xl font-black text-amber-400">{stats.pendingActivations}</p>
            <p className="text-[10px] text-amber-500/70 mt-1">Depósitos de planes que requieren aprobación</p>
          </div>
        </div>

      </section>

      {/* Plans Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="rounded-[32px] border border-white/5 bg-[#0d0d14] p-6 lg:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <span className="text-xs font-mono font-black text-amber-500">S1</span>
            </div>
            <div>
              <h4 className="font-black text-white">Starter (100 TH/s)</h4>
              <p className="text-[10px] text-slate-500">Inversión: $149.00 USD</p>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-slate-500">Nodos Aprovisionados</span>
            <span className="text-2xl font-black text-white">{stats.starterCount}</span>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/5 bg-[#0d0d14] p-6 lg:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <span className="text-xs font-mono font-black text-amber-500">P2</span>
            </div>
            <div>
              <h4 className="font-black text-white">Pro (250 TH/s)</h4>
              <p className="text-[10px] text-slate-500">Inversión: $329.00 USD</p>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-slate-500">Nodos Aprovisionados</span>
            <span className="text-2xl font-black text-white">{stats.proCount}</span>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/5 bg-[#0d0d14] p-6 lg:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <span className="text-xs font-mono font-black text-amber-500">I3</span>
            </div>
            <div>
              <h4 className="font-black text-white">Industrial (500 TH/s)</h4>
              <p className="text-[10px] text-slate-500">Inversión: $599.00 USD</p>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-slate-500">Nodos Aprovisionados</span>
            <span className="text-2xl font-black text-white">{stats.industrialCount}</span>
          </div>
        </div>

      </section>

      {/* General Mining Status Card */}
      <article className="rounded-[32px] border border-white/5 bg-[#0d0d14] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-500/[0.01] blur-[80px] pointer-events-none" />
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-500">
            <TrendingUp size={14} />
            SITUACIÓN FINANCIERA DE LA RED
          </div>
          <h3 className="text-lg font-black text-white">Total Acreditado en Rendimientos Diarios</h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Este valor refleja la suma histórica acumulada de todos los pagos y rendimientos de minado acreditados a los inversionistas de NextCapital en su panel de ganancias de minado.
          </p>
        </div>
        <div className="text-left md:text-right p-6 rounded-2xl bg-black/40 border border-white/5 min-w-[200px]">
          <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest">RENDIMIENTO ACUMULADO</span>
          <p className="text-3xl font-black text-green-400 mt-1">{formatCurrency(stats.totalMiningProfitsPaid)}</p>
        </div>
      </article>

    </main>
  );
}
