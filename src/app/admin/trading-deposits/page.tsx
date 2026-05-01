"use client";

import { collection, doc, getDocs, orderBy, query, updateDoc, increment, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { formatCurrency } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function AdminTradingDepositsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<any[]>([]);

  const loadDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "trading_deposits"), orderBy("createdAt", "desc")));
      
      // Fetch user details for each deposit
      const enrichedDeposits = await Promise.all(snap.docs.map(async (item) => {
        const data = item.data();
        let userName = "Usuario Desconocido";
        let userNcId = data.ncId || "Sin ID";

        try {
          const userSnap = await getDoc(doc(db, "users", data.userId));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            userName = userData.name || userName;
            userNcId = userData.ncId || userNcId;
          }
        } catch (e) {
          console.error("Error fetching user for deposit:", e);
        }

        return {
          id: item.id,
          ...data,
          userName,
          userNcId,
          createdAt: normalizeDate(data.createdAt),
        };
      }));

      setDeposits(enrichedDeposits);
    } catch (e) {
      showToast("Error al cargar depósitos.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDeposits();
  }, [loadDeposits]);

  async function approveDeposit(deposit: any) {
    if (!window.confirm(`¿Aprobar depósito de ${formatCurrency(deposit.amount)} para ${deposit.userName} (${deposit.userNcId})?`)) return;
    
    try {
      await updateDoc(doc(db, "trading_deposits", deposit.id), {
        status: "approved",
        updatedAt: new Date()
      });

      // Acreditar al balance de trading
      const balanceRef = doc(db, "trading_balances", deposit.userId);
      const balanceSnap = await getDoc(balanceRef);
      
      if (balanceSnap.exists()) {
        await updateDoc(balanceRef, {
          currentBalance: increment(deposit.amount),
          updatedAt: new Date()
        });
      } else {
        // Si no existe, lo creamos
        await updateDoc(balanceRef, {
          userId: deposit.userId,
          currentBalance: deposit.amount,
          updatedAt: new Date()
        });
      }

      showToast(`Depósito de ${deposit.userName} aprobado.`, "success");
      loadDeposits();
    } catch (e) {
      showToast("Error al aprobar.", "error");
    }
  }

  return (
    <main className="min-h-screen bg-[#020203] p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Validación de Depósitos Trading</h1>
          <p className="mt-1 text-sm text-zinc-500">Revisa los comprobantes bancarios y acredita el saldo real.</p>
        </div>
        <button onClick={loadDeposits} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors">Actualizar lista</button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mb-4" />
          <p className="text-zinc-600 text-sm">Cargando depósitos y datos de usuarios...</p>
        </div>
      ) : !deposits.length ? (
        <div className="py-20 text-center border border-dashed border-white/5 rounded-[40px]">
          <p className="text-zinc-600">No hay depósitos registrados.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {deposits.map((d) => (
            <article key={d.id} className="group relative overflow-hidden rounded-[32px] border border-white/[0.06] bg-zinc-900/40 p-1 backdrop-blur-xl transition-all hover:border-white/10">
              <div className="flex flex-col lg:flex-row gap-6 p-7">
                
                {/* INFO PRINCIPAL */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[d.status]}`}>{d.status}</span>
                    <div className="h-1 w-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{d.method === 'stripe' ? 'STRIPE / TARJETA' : 'TRANSFERENCIA BANCARIA'}</span>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white mb-1">{d.userName}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold tracking-tighter">{d.userNcId}</span>
                      <span className="text-[10px] text-zinc-600 font-medium">UID: {d.userId.substring(0, 8)}...</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-5xl font-black text-white tracking-tighter">{formatCurrency(d.amount)}</p>
                    <p className="text-[10px] text-zinc-600 font-bold mt-2 uppercase tracking-tight">{new Date(d.createdAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    {d.status === 'pending' && (
                      <>
                        <button onClick={() => approveDeposit(d)} className="flex-1 px-8 py-4 rounded-2xl bg-emerald-500 text-black text-sm font-black hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">Aprobar Depósito</button>
                        <button className="px-6 py-4 rounded-2xl border border-white/5 bg-white/5 text-rose-500 text-sm font-bold hover:bg-rose-500/5 transition-all">Rechazar</button>
                      </>
                    )}
                    {d.status === 'approved' && (
                      <div className="flex-1 py-4 text-center rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 text-[11px] font-black uppercase tracking-widest">Saldo Acreditado ✅</div>
                    )}
                  </div>
                </div>

                {/* COMPROBANTE / ACCIONES */}
                <div className="w-full lg:w-72 space-y-4">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Comprobante de Pago</p>
                  
                  {d.receiptUrl ? (
                    <div className="group/receipt relative aspect-video lg:aspect-[4/5] overflow-hidden rounded-2xl border border-white/5 bg-black">
                      <img src={d.receiptUrl} alt="Comprobante" className="h-full w-full object-cover opacity-60 transition-all group-hover/receipt:opacity-100 group-hover/receipt:scale-105" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/receipt:opacity-100 backdrop-blur-sm">
                        <a href={d.receiptUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-cyan-400 transition-colors">Ver Recibo Completo</a>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video lg:aspect-[4/5] rounded-2xl border border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center justify-center gap-3">
                      <svg className="w-8 h-8 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">Sin imagen adjunta</p>
                    </div>
                  )}
                  
                  {d.method === 'stripe' && (
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Nota de Stripe</p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">Este pago fue procesado vía Stripe. Verifica en el dashboard de Stripe si el cargo fue exitoso antes de aprobar.</p>
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
