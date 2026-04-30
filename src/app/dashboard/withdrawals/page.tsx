"use client";

import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { useAuth } from "@/components/providers/auth-provider";
import { trackEvent } from "@/lib/analytics-events";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { Withdrawal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function WithdrawalsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [amount, setAmount] = useState("150");
  const [message, setMessage] = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  async function requestWithdrawal(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const token = await firebaseUser?.getIdToken();
    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: Number(amount) }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message ?? "No se pudo solicitar el retiro.", "error");
      return;
    }
    await trackEvent("request_withdrawal", { amount: Number(amount) });
    showToast("Retiro solicitado correctamente.", "success");
    await loadWithdrawals();
    setMessage(data.message ?? "Retiro enviado.");
  }

  async function loadWithdrawals() {
    if (!firebaseUser) return;
    const snap = await getDocs(
      query(collection(db, "withdrawals"), where("userId", "==", firebaseUser.uid), orderBy("createdAt", "desc"))
    );
    setWithdrawals(
      snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        createdAt: normalizeDate(item.data().createdAt),
      })) as Withdrawal[]
    );
    setLoading(false);
  }

  useEffect(() => {
    void loadWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid]);

  return (
    <main className="relative min-h-screen bg-[#020203]">
      {/* Premium Background Glow */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-[40rem] w-[40rem] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Topbar balance={0} />
        
        <div className="mx-auto max-w-[1600px] p-8">
          <section className="grid gap-8 lg:grid-cols-2">
            <article className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-8 shadow-2xl backdrop-blur-xl">
              <h1 className="text-xl font-semibold text-white">Solicitar retiro</h1>
              <p className="mt-2 text-sm text-zinc-400">Las solicitudes se procesan por el equipo de compliance y deben cumplir los Términos y Condiciones.</p>
              
              {new Date().getDate() < 28 || new Date().getDate() > 30 ? (
                <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-sm font-medium text-amber-400">Ventana de Retiros Cerrada</p>
                  <p className="mt-1 text-xs text-amber-500/80">Según los Términos y Condiciones, los retiros solo pueden solicitarse los días 28, 29 y 30 de cada mes.</p>
                </div>
              ) : null}

              <form onSubmit={requestWithdrawal} className="mt-8 grid gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">Monto a retirar (USD)</label>
                  <input 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    type="number" 
                    min={20} 
                    required 
                    disabled={new Date().getDate() < 28 || new Date().getDate() > 30}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-500/50 disabled:opacity-50"
                  />
                </div>
                <button 
                  disabled={new Date().getDate() < 28 || new Date().getDate() > 30}
                  className="mt-2 w-full rounded-full bg-cyan-500 px-4 py-3.5 text-sm font-semibold text-black shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-transform hover:scale-[1.02] hover:bg-cyan-400 disabled:pointer-events-none disabled:opacity-50"
                >
                  Solicitar retiro
                </button>
              </form>
              {message ? <p className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-sm text-cyan-300">{message}</p> : null}
            </article>

            <article className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-8 shadow-2xl backdrop-blur-xl">
              <h2 className="text-[13px] font-medium uppercase tracking-wide text-zinc-500 mb-6">Estado de retiros</h2>
              {loading ? <p className="text-sm text-zinc-400">Cargando retiros...</p> : null}
              {!loading && !withdrawals.length ? (
                <p className="text-sm text-zinc-500">Aún no tienes solicitudes de retiro.</p>
              ) : null}
              <div className="space-y-3">
                {withdrawals.map((item) => (
                  <div key={item.id} className="group flex items-center justify-between rounded-xl border border-white/[0.02] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]">
                    <span className="text-xs font-medium text-zinc-400">{new Date(normalizeDate(item.createdAt)).toLocaleDateString()}</span>
                    <span className="font-semibold text-white">{formatCurrency(item.amount)}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                      item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                      item.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
