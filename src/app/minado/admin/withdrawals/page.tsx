"use client";

import { collection, getDocs, orderBy, query, doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { Withdrawal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { 
  Zap, 
  Clock, 
  ExternalLink,
  Check,
  X,
  CreditCard
} from "lucide-react";

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

export default function MiningAdminWithdrawalsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const loadWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "withdrawals"), orderBy("createdAt", "desc")));
      
      const enriched = await Promise.all(snap.docs.map(async (item) => {
        const data = item.data();
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

      setWithdrawals(enriched);
    } catch (e) {
      console.error(e);
      showToast("Error al cargar solicitudes de retiros.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadWithdrawals();
  }, [loadWithdrawals]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    if (!window.confirm(`¿Seguro que deseas marcar esta solicitud de retiro como ${status === 'approved' ? 'APROBADA' : 'RECHAZADA'}?`)) {
      return;
    }

    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message ?? "No se pudo procesar el retiro.", "error");
        return;
      }
      showToast(`El retiro fue ${status === 'approved' ? 'aprobado' : 'rechazado'} con éxito.`, "success");
      await loadWithdrawals();
    } catch (e) {
      showToast("Error de conexión al procesar retiro.", "error");
    }
  }

  return (
    <main className="p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-500 tracking-wider">CORE_MINING_OS // LIQUIDACIÓN</span>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">Gestión de Retiros de Minería</h2>
        </div>
        <button 
          onClick={loadWithdrawals}
          className="px-5 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all"
        >
          Actualizar Retiros
        </button>
      </div>

      {/* Withdrawals List */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 font-mono text-xs">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-4" />
          Cargando libro de retiros pendientes...
        </div>
      ) : !withdrawals.length ? (
        <div className="py-20 text-center border border-dashed border-white/5 rounded-[40px] text-zinc-500">
          No hay solicitudes de retiro registradas.
        </div>
      ) : (
        <div className="grid gap-6">
          {withdrawals.map((withdrawal) => (
            <article
              key={withdrawal.id}
              className="overflow-hidden rounded-[32px] border border-white/[0.06] bg-zinc-900/40 p-6 backdrop-blur-xl transition-all hover:border-white/10"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <span className={`rounded-full border px-3.5 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[withdrawal.status] ?? STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[withdrawal.status] ?? withdrawal.status}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <CreditCard size={12} /> RETIRO DE GANANCIAS
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-mono text-zinc-500">Beneficiario / Usuario</p>
                    <p className="text-base font-bold text-white mt-0.5">{withdrawal.userName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold tracking-tighter">{withdrawal.userNcId}</span>
                      <span className="text-[10px] text-zinc-600 font-medium">ID de usuario: {withdrawal.userId}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Monto Solicitado</span>
                    <p className="text-4xl font-black text-white tracking-tighter mt-1">{formatCurrency(withdrawal.amount)}</p>
                    <p className="text-[10px] text-zinc-600 font-bold mt-2 uppercase tracking-tight">Fecha de Solicitud: {new Date(withdrawal.createdAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
                  </div>

                  {/* Transfer details */}
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 max-w-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2">Datos para Transferencia de Liquidación</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs font-mono">
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase">Titular de Cuenta</p>
                        <p className="text-sm font-bold text-zinc-300 mt-0.5">{withdrawal.details?.fullName || "No provisto"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase">Entidad Financiera</p>
                        <p className="text-sm font-bold text-zinc-300 mt-0.5">{withdrawal.details?.bankName || "No provisto"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase">Tipo de Cuenta</p>
                        <p className="text-sm font-bold text-zinc-300 mt-0.5">{withdrawal.details?.accountType || "No provisto"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase">Número de Cuenta</p>
                        <p className="text-sm font-black text-amber-500 mt-0.5">{withdrawal.details?.accountNumber || "No provisto"}</p>
                      </div>
                    </div>
                    {!withdrawal.details && withdrawal.bankAccount && (
                      <p className="text-xs text-zinc-400 mt-2 italic border-t border-white/5 pt-2 font-mono">
                        Especificación: {withdrawal.bankAccount}
                      </p>
                    )}
                  </div>

                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col gap-2 self-start w-full lg:w-44 pt-2">
                  <button
                    disabled={withdrawal.status !== "pending"}
                    onClick={() => updateStatus(withdrawal.id, "approved")}
                    className="flex-1 rounded-2xl bg-amber-500 text-black text-xs font-black py-4 hover:opacity-95 disabled:opacity-30 transition-all flex items-center justify-center gap-1 shadow-lg shadow-amber-500/10 uppercase tracking-widest active:scale-[0.98]"
                  >
                    <Check size={14} /> Aprobar
                  </button>
                  <button
                    disabled={withdrawal.status !== "pending"}
                    onClick={() => updateStatus(withdrawal.id, "rejected")}
                    className="flex-1 lg:flex-initial rounded-2xl border border-rose-500/30 bg-rose-500/10 py-4 text-rose-400 text-xs font-black hover:bg-rose-500/20 disabled:opacity-30 transition-all flex items-center justify-center gap-1 uppercase tracking-widest active:scale-[0.98]"
                  >
                    <X size={14} /> Rechazar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
