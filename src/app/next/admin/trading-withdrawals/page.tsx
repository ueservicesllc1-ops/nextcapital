"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { formatCurrency } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function AdminTradingWithdrawalsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const loadWithdrawals = useCallback(async () => {
    const snap = await getDocs(query(collection(db, "trading_withdrawals"), orderBy("createdAt", "desc")));
    setWithdrawals(
      snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        createdAt: normalizeDate(item.data().createdAt),
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadWithdrawals();
  }, [loadWithdrawals]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    // Aquí podrías llamar a una API específica para trading o usar la genérica si está preparada
    // Por ahora, lo haré directamente en el cliente para rapidez, 
    // pero idealmente debería ser vía API para seguridad y auditoría.
    
    // NOTA: Para producción, crear /api/admin/trading-withdrawals/[id]
    showToast("Función de aprobación en desarrollo. Contacta soporte.", "info");
  }

  return (
    <main className="min-h-screen bg-[#020203] p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Retiros de Trading (Real)</h1>
        <p className="mt-1 text-sm text-zinc-500">Gestión de solicitudes de retiro de la billetera de trading.</p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-zinc-500 text-sm">Cargando...</div>
      ) : !withdrawals.length ? (
        <div className="grid place-items-center py-20 text-zinc-500 text-sm">No hay solicitudes registradas.</div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <article key={w.id} className="rounded-[20px] border border-white/[0.06] bg-zinc-900/80 p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Trading</span>
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${STATUS_COLORS[w.status] || STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[w.status] || w.status}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white">{formatCurrency(w.amount)}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">ID Usuario: {w.userId}</p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-white/[0.02] p-4 text-xs">
                    <div>
                      <p className="text-zinc-500 uppercase font-bold text-[9px]">Beneficiario</p>
                      <p className="text-zinc-200">{w.details?.fullName}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 uppercase font-bold text-[9px]">Banco</p>
                      <p className="text-zinc-200">{w.details?.bankName} ({w.details?.accountType})</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-zinc-500 uppercase font-bold text-[9px]">Nº Cuenta</p>
                      <p className="text-cyan-400 font-mono text-sm">{w.details?.accountNumber}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 self-start">
                  <button onClick={() => updateStatus(w.id, "approved")} className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-black shadow-lg shadow-emerald-900/20">Aprobar</button>
                  <button onClick={() => updateStatus(w.id, "rejected")} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-6 py-2 text-sm font-bold text-rose-400">Rechazar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
