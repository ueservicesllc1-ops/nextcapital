"use client";

import { useEffect, useState } from "react";
import { GrowthChart } from "@/components/dashboard/growth-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { Topbar } from "@/components/dashboard/topbar";
import { useAuth } from "@/components/providers/auth-provider";
import { getInvestorData } from "@/lib/data";
import { Balance, Deposit, Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function InvestorDashboardPage() {
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState<Balance | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [growth, setGrowth] = useState<Array<{ name: string; balance: number }>>([]);

  useEffect(() => {
    async function load() {
      if (!firebaseUser) return;
      try {
        const data = await getInvestorData(firebaseUser.uid);
        setBalance(data.balance);
        setDeposits(data.deposits);
        setTransactions(data.transactions);
        setGrowth(data.growth);
      } catch {
        setError("No se pudo cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [firebaseUser]);

  if (loading || !balance) {
    return <div className="grid min-h-screen place-items-center">Cargando dashboard...</div>;
  }

  if (error) {
    return <div className="grid min-h-screen place-items-center text-rose-400">{error}</div>;
  }

  const dailyEstimate = balance.currentBalance * 0.01;
  const monthlyEstimate = balance.currentBalance * 0.3;

  return (
    <main>
      <Topbar balance={balance.currentBalance} />
      <section className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total depositado" value={formatCurrency(balance.totalDeposited)} />
        <StatCard title="Balance actual" value={formatCurrency(balance.currentBalance)} positive />
        <StatCard title="Ganancias estimadas" value={formatCurrency(balance.totalProfit)} helper="rendimientos estimados" positive />
        <StatCard title="Ganancia diaria estimada" value={formatCurrency(dailyEstimate)} helper="hasta 1% diario en condiciones favorables" />
        <StatCard title="Rendimiento mensual estimado" value={formatCurrency(monthlyEstimate)} helper="hasta 30% mensual estimado" />
      </section>

      <section className="grid gap-6 px-6 pb-8 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <GrowthChart data={growth} />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-sm font-medium text-slate-300">Depósitos</h3>
          <div className="mt-3 space-y-2 text-sm">
            {!deposits.length ? <p className="text-slate-400">No hay depósitos todavía.</p> : null}
            {deposits.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2">
                <span>{item.method.toUpperCase()}</span>
                <span>{formatCurrency(item.amount)}</span>
                <span className="text-slate-400">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {!transactions.length ? (
                <tr>
                  <td className="px-4 py-4 text-slate-400" colSpan={5}>
                    No hay transacciones registradas.
                  </td>
                </tr>
              ) : null}
              {transactions.map((item) => (
                <tr key={item.id} className="border-t border-slate-800">
                  <td className="px-4 py-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 capitalize">{item.type}</td>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 capitalize">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
          Toda inversión conlleva riesgo. Los rendimientos no están garantizados. los resultados pueden variar.
        </p>
      </section>
    </main>
  );
}
