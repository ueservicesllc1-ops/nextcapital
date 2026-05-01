"use client";

import { collection, getDocs, orderBy, query, doc, getDoc } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { formatCurrency } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "En revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
  completed: "Completado",
  failed: "Fallido",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  completed: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  failed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function AdminDepositsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<any[]>([]);

  const loadDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "deposits"), orderBy("createdAt", "desc")));
      
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

      setDeposits(enriched);
    } catch (e) {
      showToast("Error al cargar depósitos.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDeposits();
  }, [loadDeposits]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    const token = await firebaseUser?.getIdToken();
    const res = await fetch(`/api/admin/deposits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message ?? "No se pudo actualizar.", "error");
      return;
    }
    showToast(data.message ?? "Estado actualizado.", "success");
    await loadDeposits();
  }

  return (
    <main className="min-h-screen bg-[#020203] p-8">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Depósitos de Inversión</h1>
          <p className="mt-1 text-sm text-zinc-500">Gestión de capital para el fondo de inversiones.</p>
        </div>
        <button onClick={loadDeposits} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors">Actualizar</button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-600">Cargando depósitos e identidades...</div>
      ) : !deposits.length ? (
        <div className="py-20 text-center text-zinc-600 border border-dashed border-white/5 rounded-[32px]">No hay depósitos registrados.</div>
      ) : (
        <div className="grid gap-6">
          {deposits.map((deposit) => (
            <article
              key={deposit.id}
              className="group overflow-hidden rounded-[32px] border border-white/[0.06] bg-zinc-900/40 p-1 backdrop-blur-xl transition-all hover:border-white/10"
            >
              <div className="flex flex-col lg:flex-row gap-8 p-7">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">{deposit.method}</span>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[deposit.status] ?? STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[deposit.status] ?? deposit.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white mb-1">{deposit.userName}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold tracking-tighter">{deposit.userNcId}</span>
                      <span className="text-[10px] text-zinc-600 font-medium tracking-tight">UID: {deposit.userId.substring(0,8)}...</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(deposit.amount)}</p>
                    <p className="text-[10px] text-zinc-600 font-bold mt-2 uppercase tracking-tight">{new Date(deposit.createdAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
                  </div>

                  <div className="flex gap-2">
                    {deposit.status === 'pending' ? (
                      <>
                        <button onClick={() => updateStatus(deposit.id, "approved")} className="flex-1 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all">Aprobar Depósito</button>
                        <button onClick={() => updateStatus(deposit.id, "rejected")} className="px-6 py-4 rounded-2xl border border-white/5 bg-white/5 text-rose-500 text-sm font-bold hover:bg-rose-500/5 transition-all">Rechazar</button>
                      </>
                    ) : (
                      <div className="flex-1 py-4 text-center rounded-2xl bg-white/5 text-zinc-500 text-[11px] font-black uppercase tracking-widest border border-white/5">Procesado ✅</div>
                    )}
                  </div>
                </div>

                {/* VISOR DE COMPROBANTE */}
                <div className="w-full lg:w-64 space-y-3">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Comprobante</p>
                   {deposit.receiptUrl ? (
                     <div className="group/receipt relative aspect-[4/3] lg:aspect-square overflow-hidden rounded-2xl border border-white/5 bg-black">
                        <img src={deposit.receiptUrl} alt="Comprobante" className="h-full w-full object-cover opacity-60 group-hover/receipt:opacity-100 transition-all" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/receipt:opacity-100 transition-all backdrop-blur-sm">
                           <a href={deposit.receiptUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase">Ver Imagen</a>
                        </div>
                     </div>
                   ) : (
                     <div className="aspect-[4/3] lg:aspect-square rounded-2xl border border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center justify-center">
                        <p className="text-[9px] text-zinc-700 font-black uppercase">Sin archivo adjunto</p>
                        <p className="text-[8px] text-zinc-800 mt-1">(Stripe / Automático)</p>
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
