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
    <main>
      <Topbar balance={0} />
      <section className="p-6">
        <article className="max-w-xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h1 className="text-xl font-semibold">Solicitar retiro</h1>
          <p className="mt-2 text-sm text-slate-400">Las solicitudes se procesan por el equipo de compliance.</p>
          <form onSubmit={requestWithdrawal} className="mt-4 grid gap-3">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={20} required />
            <button className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950">Solicitar retiro</button>
          </form>
          {message ? <p className="mt-3 text-sm text-cyan-300">{message}</p> : null}
        </article>
        <article className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold">Estado de retiros</h2>
          {loading ? <p className="mt-2 text-sm text-slate-400">Cargando retiros...</p> : null}
          {!loading && !withdrawals.length ? (
            <p className="mt-2 text-sm text-slate-400">Aún no tienes solicitudes de retiro.</p>
          ) : null}
          <div className="mt-3 space-y-2">
            {withdrawals.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                <span>{new Date(normalizeDate(item.createdAt)).toLocaleDateString()}</span>
                <span>{formatCurrency(item.amount)}</span>
                <span className="capitalize">{item.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
