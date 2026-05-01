"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { AppUser, Balance, Deposit, Transaction, Withdrawal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function AdminUserProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();

  const [user, setUser] = useState<AppUser | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  // Form: add profit
  const [profitAmount, setProfitAmount] = useState("");
  const [profitDesc, setProfitDesc] = useState("Rendimiento mensual acreditado");
  const [submittingProfit, setSubmittingProfit] = useState(false);

  useEffect(() => {
    async function load() {
      const [userSnap, balanceSnap, depositsSnap, trxSnap, wdSnap] = await Promise.all([
        getDoc(doc(db, "users", uid)),
        getDoc(doc(db, "balances", uid)),
        getDocs(query(collection(db, "deposits"), where("userId", "==", uid))),
        getDocs(query(collection(db, "transactions"), where("userId", "==", uid))),
        getDocs(query(collection(db, "withdrawals"), where("userId", "==", uid))),
      ]);

      if (!userSnap.exists()) {
        router.replace("/admin/users");
        return;
      }

      setUser(userSnap.data() as AppUser);
      setBalance(
        (balanceSnap.data() as Balance) ?? {
          userId: uid,
          totalDeposited: 0,
          totalProfit: 0,
          currentBalance: 0,
          updatedAt: new Date().toISOString(),
        }
      );

      setDeposits(
        depositsSnap.docs
          .map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) }) as Deposit)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
      setTransactions(
        trxSnap.docs
          .map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) }) as Transaction)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
      setWithdrawals(
        wdSnap.docs
          .map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) }) as Withdrawal)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );

      setLoading(false);
    }
    void load();
  }, [uid, router]);

  async function handleAddProfit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(profitAmount);
    if (!amount || amount <= 0) {
      showToast("Ingresa un monto válido mayor a 0.", "error");
      return;
    }
    setSubmittingProfit(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch(`/api/admin/profit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: uid, amount, description: profitDesc }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message ?? "No se pudo registrar la ganancia.", "error");
        return;
      }
      showToast("Ganancia acreditada correctamente.", "success");
      setProfitAmount("");
      // Refrescar balance y transacciones
      const [newBalanceSnap, newTrxSnap] = await Promise.all([
        getDoc(doc(db, "balances", uid)),
        getDocs(query(collection(db, "transactions"), where("userId", "==", uid))),
      ]);
      if (newBalanceSnap.exists()) setBalance(newBalanceSnap.data() as Balance);
      setTransactions(
        newTrxSnap.docs
          .map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) }) as Transaction)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    } catch {
      showToast("Error de conexión.", "error");
    } finally {
      setSubmittingProfit(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#020203] text-zinc-500 text-sm">
        Cargando perfil...
      </div>
    );
  }

  if (!user || !balance) return null;

  return (
    <main className="min-h-screen bg-[#020203] p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin/users")}
          className="mb-4 flex items-center gap-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Usuarios
        </button>
        <h1 className="text-2xl font-semibold text-white">{user.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
      </div>

      {/* Balance Stats */}
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          { label: "Balance Actual", value: formatCurrency(balance.currentBalance), accent: true },
          { label: "Total Depositado", value: formatCurrency(balance.totalDeposited), accent: false },
          { label: "Ganancias Totales", value: formatCurrency(balance.totalProfit), accent: false },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            className="rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-6 shadow-xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
            <p className={`mt-3 text-3xl font-bold ${accent ? "text-cyan-400" : "text-white"}`}>{value}</p>
            {label === "Ganancias Totales" && balance.lastInterestCredit && (
              <p className="mt-2 text-[10px] text-zinc-500 italic">
                Último crédito: {new Date(balance.lastInterestCredit).toLocaleString("es-ES")}
              </p>
            )}
          </div>
        ))}
      </section>

      {/* Add Profit Form */}
      <section className="mb-8 overflow-hidden rounded-[20px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-zinc-950/90 p-6 shadow-xl backdrop-blur-xl">
        <h2 className="mb-4 text-base font-semibold text-white">Acreditar Ganancia / Rendimiento</h2>
        <form onSubmit={handleAddProfit} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[140px] space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">Monto (USD)</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={profitAmount}
              onChange={(e) => setProfitAmount(e.target.value)}
              required
              placeholder="Ej: 150.00"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
            />
          </div>
          <div className="flex-[2] min-w-[200px] space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">Descripción</label>
            <input
              type="text"
              value={profitDesc}
              onChange={(e) => setProfitDesc(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={submittingProfit}
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-50"
          >
            {submittingProfit ? "Acreditando..." : "Acreditar Ganancia"}
          </button>
        </form>
      </section>

      {/* Transactions */}
      <section className="mb-6 overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 shadow-xl">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Historial de Transacciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.02]">
              <tr>
                {["Fecha", "Tipo", "Descripción", "Monto", "Estado"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {!transactions.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-600">Sin transacciones.</td>
                </tr>
              ) : transactions.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-6 py-3 text-zinc-400">{new Date(t.createdAt).toLocaleDateString("es-ES")}</td>
                  <td className="whitespace-nowrap px-6 py-3 capitalize font-medium text-zinc-300">{t.type}</td>
                  <td className="px-6 py-3 text-zinc-400">{t.description}</td>
                  <td className="whitespace-nowrap px-6 py-3 font-semibold text-white">{formatCurrency(t.amount)}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-xs capitalize text-zinc-500">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deposits + Withdrawals */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 shadow-xl">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Depósitos ({deposits.length})</h2>
          </div>
          <div className="space-y-2 p-4">
            {!deposits.length ? (
              <p className="py-4 text-center text-sm text-zinc-600">Sin depósitos.</p>
            ) : deposits.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-white/[0.03] bg-white/[0.02] px-4 py-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{d.method}</p>
                  <p className="font-semibold text-white">{formatCurrency(d.amount)}</p>
                  <p className="text-xs text-zinc-500">{new Date(d.createdAt).toLocaleDateString("es-ES")}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  d.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                  d.status === "rejected" ? "bg-rose-500/10 text-rose-400" :
                  "bg-amber-500/10 text-amber-400"
                }`}>
                  {d.status === "pending" ? "En revisión" : d.status === "approved" ? "Aprobado" : d.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 shadow-xl">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Retiros ({withdrawals.length})</h2>
          </div>
          <div className="space-y-2 p-4">
            {!withdrawals.length ? (
              <p className="py-4 text-center text-sm text-zinc-600">Sin retiros.</p>
            ) : withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl border border-white/[0.03] bg-white/[0.02] px-4 py-3">
                <div>
                  <p className="font-semibold text-white">{formatCurrency(w.amount)}</p>
                  <p className="text-xs text-zinc-500">{new Date(w.createdAt).toLocaleDateString("es-ES")}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  w.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                  w.status === "rejected" ? "bg-rose-500/10 text-rose-400" :
                  "bg-amber-500/10 text-amber-400"
                }`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
