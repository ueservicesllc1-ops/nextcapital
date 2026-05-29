"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, orderBy, query, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { formatCurrency } from "@/lib/utils";
import { 
  Zap, 
  Coins, 
  Clock, 
  ExternalLink,
  Check,
  X
} from "lucide-react";

const PLANS_NAMES: Record<string, string> = {
  "NC-S1": "Starter (100 TH/s)",
  "NC-P2": "Pro (250 TH/s)",
  "NC-I3": "Industrial (500 TH/s)",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function MiningAdminDepositsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<any[]>([]);

  const loadMiningDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "deposits"), orderBy("createdAt", "desc")));
      
      const enriched = await Promise.all(snap.docs.map(async (item) => {
        const data = item.data();
        
        // Filter: only mining plans
        const isMiningPlan = ["NC-S1", "NC-P2", "NC-I3"].includes(data.planId ?? "");
        if (!isMiningPlan) return null;

        let userName = "Usuario Desconocido";
        let userNcId = "Sin ID";

        try {
          const userSnap = await getDoc(doc(db, "users", data.userId));
          if (userSnap.exists()) {
            userName = userSnap.data().name || userName;
            userNcId = userSnap.data().ncId || userNcId;
          }
        } catch (e) {}

        return {
          id: item.id,
          ...data,
          userName,
          userNcId,
          createdAt: normalizeDate(data.createdAt),
        };
      }));

      // Filter out non-mining deposits
      const filtered = enriched.filter(d => d !== null);
      setDeposits(filtered);
    } catch (e) {
      console.error(e);
      showToast("Error al cargar depósitos de minería.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadMiningDeposits();
  }, [loadMiningDeposits]);

  async function updateDepositStatus(id: string, status: "approved" | "rejected") {
    if (!window.confirm(`¿Seguro que deseas marcar esta transacción de contrato como ${status === 'approved' ? 'APROBADA' : 'RECHAZADA'}?`)) {
      return;
    }

    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch(`/api/admin/deposits/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message ?? "No se pudo actualizar la transacción.", "error");
        return;
      }
      showToast(`El contrato fue ${status === 'approved' ? 'aprobado y activado' : 'rechazado'} con éxito.`, "success");
      await loadMiningDeposits();
    } catch (e) {
      showToast("Error de conexión al actualizar contrato.", "error");
    }
  }

  return (
    <main className="p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-500 tracking-wider">CORE_MINING_OS // FACTURACIÓN</span>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">Auditoría de Adquisiciones de Hashrate</h2>
        </div>
        <button 
          onClick={loadMiningDeposits}
          className="px-5 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all"
        >
          Actualizar Lista
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 font-mono text-xs">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-4" />
          Verificando libro contable de hashrate...
        </div>
      ) : !deposits.length ? (
        <div className="py-20 text-center border border-dashed border-white/5 rounded-[40px] text-zinc-500">
          No hay solicitudes de adquisición de contratos de hashrate registradas.
        </div>
      ) : (
        <div className="grid gap-6">
          {deposits.map((dep) => (
            <article 
              key={dep.id}
              className="group overflow-hidden rounded-[32px] border border-white/[0.06] bg-zinc-900/40 p-1 backdrop-blur-xl transition-all hover:border-white/10"
            >
              <div className="flex flex-col lg:flex-row gap-6 p-7">
                
                {/* Details */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <span className={`rounded-full border px-3.5 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[dep.status] ?? STATUS_COLORS.pending}`}>
                      {dep.status === 'pending' ? 'En revisión' : dep.status === 'approved' ? 'Aprobado' : dep.status}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                      {dep.method === 'stripe' ? 'STRIPE' : dep.method === 'payphone' ? 'PAYPHONE' : dep.method === 'bank' ? 'TRANS. BANCARIA' : 'ASIGNACIÓN MANUAL'}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white mb-1">{dep.userName}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold tracking-tighter">{dep.userNcId}</span>
                      <span className="text-[10px] text-zinc-600 font-medium">Plan: <strong className="text-white">{PLANS_NAMES[dep.planId] ?? dep.planId}</strong></span>
                    </div>
                  </div>

                  <div>
                    <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(dep.amount)}</p>
                    <p className="text-[10px] text-zinc-600 font-bold mt-2 uppercase tracking-tight">{new Date(dep.createdAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
                  </div>

                  <div className="flex gap-2">
                    {dep.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => updateDepositStatus(dep.id, "approved")} 
                          className="flex-1 rounded-2xl bg-amber-500 px-5 py-4 text-xs font-black text-black shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check size={14} /> Aprobar Contrato y Activar ASIC
                        </button>
                        <button 
                          onClick={() => updateDepositStatus(dep.id, "rejected")} 
                          className="px-6 py-4 rounded-2xl border border-white/5 bg-white/5 text-rose-500 text-xs font-bold hover:bg-rose-500/5 transition-all flex items-center justify-center gap-1.5"
                        >
                          <X size={14} /> Rechazar
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 py-4 text-center rounded-2xl bg-white/5 text-zinc-500 text-[10px] font-black uppercase tracking-widest border border-white/5">Activo / Procesado ✅</div>
                    )}
                  </div>
                </div>

                {/* VISOR DE COMPROBANTE BANCARIO */}
                <div className="w-full lg:w-64 space-y-3">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Comprobante Bancario</p>
                  
                  {dep.receiptUrl ? (
                    <div className="group/receipt relative aspect-[4/3] lg:aspect-square overflow-hidden rounded-2xl border border-white/5 bg-black">
                      <img src={dep.receiptUrl} alt="Comprobante" className="h-full w-full object-cover opacity-60 group-hover/receipt:opacity-100 transition-all" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/receipt:opacity-100 transition-all backdrop-blur-sm">
                        <a href={dep.receiptUrl} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          Ver Recibo <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[4/3] lg:aspect-square rounded-2xl border border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center justify-center">
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-wider">Pasarela Automática</p>
                      <p className="text-[8px] text-zinc-700 mt-1">Sin comprobante manual</p>
                    </div>
                  )}
                </div>

              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
