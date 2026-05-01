"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GrowthChart } from "@/components/dashboard/growth-chart";
import { ProfitCountdown } from "@/components/dashboard/profit-countdown";
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
      } catch (err: any) {
        console.error("Dashboard error:", err);
        setError("Error al cargar el dashboard: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [firebaseUser]);

  if (error) {
    return <div className="grid min-h-screen place-items-center px-4 text-center text-rose-400">{error}</div>;
  }

  if (loading || !balance) {
    return <div className="grid min-h-screen place-items-center">Cargando dashboard...</div>;
  }

  const dailyEstimate = balance.currentBalance * 0.01;
  const monthlyEstimate = balance.currentBalance * 0.3;

  return (
    <main className="relative min-h-screen bg-[#020203]">
      {/* Premium Background Glow */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-[40rem] w-[40rem] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Topbar balance={balance.currentBalance} />
        
        <div className="mx-auto max-w-[1600px]">
          <section className="grid gap-5 p-8 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
            <StatCard title="Total depositado" value={formatCurrency(balance.totalDeposited)} />
            <StatCard title="Balance actual" value={formatCurrency(balance.currentBalance)} positive />
            <StatCard title="Ganancias estimadas" value={formatCurrency(balance.totalProfit)} helper="rendimientos estimados" positive />
            <StatCard title="Ganancia diaria" value={formatCurrency(dailyEstimate)} helper="hasta 1% diario" />
            <StatCard title="Rendimiento mensual" value={formatCurrency(monthlyEstimate)} helper="hasta 30% mensual" />
            
            {/* Acceso a Trading CTA */}
            <div className="group relative overflow-hidden rounded-[20px] border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-5 shadow-lg shadow-cyan-500/5 transition-all hover:scale-[1.02] hover:border-cyan-500/50">
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Nuevo Servicio</h3>
                  <p className="mt-2 text-base font-bold text-white">Plataforma de Trading</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">Opera en mercados reales con ejecución instantánea.</p>
                </div>
                <Link 
                  href="/trading" 
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-black transition-all hover:bg-cyan-400"
                >
                  Ir a Trading
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" /></svg>
                </Link>
              </div>
              {/* Decorative Glow */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-cyan-500/20 blur-2xl" />
            </div>

            <ProfitCountdown deposits={deposits} />
          </section>

          <section className="grid gap-6 px-8 pb-8 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <GrowthChart data={growth} />
            </div>
            <div className="flex flex-col overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="mb-6 text-[13px] font-medium uppercase tracking-wide text-zinc-500">Últimos Depósitos</h3>
              <div className="flex-1 space-y-3">
                {!deposits.length ? <p className="text-sm text-zinc-500">No hay depósitos todavía.</p> : null}
                {deposits.slice(0, 5).map((item) => (
                  <div key={item.id} className="group flex items-center justify-between rounded-xl border border-white/[0.02] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]">
                    <span className="text-xs font-semibold tracking-wider text-zinc-300">{item.method.toUpperCase()}</span>
                    <span className="font-medium text-white">{formatCurrency(item.amount)}</span>
                    <span className={`text-xs font-medium ${item.status === 'approved' ? 'text-cyan-400' : 'text-zinc-500'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="px-8 pb-12">
            <div className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Fecha</th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Tipo</th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Descripción</th>
                      <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Monto</th>
                      <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {!transactions.length ? (
                      <tr>
                        <td className="px-6 py-8 text-center text-zinc-500" colSpan={5}>
                          No hay transacciones registradas.
                        </td>
                      </tr>
                    ) : null}
                    {transactions.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="whitespace-nowrap px-6 py-4 text-zinc-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td className="whitespace-nowrap px-6 py-4 font-medium capitalize text-zinc-300">{item.type}</td>
                        <td className="px-6 py-4 text-zinc-400">{item.description}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-white">{formatCurrency(item.amount)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-xs font-medium capitalize text-zinc-500">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p>Toda inversión conlleva riesgo. Los rendimientos no están garantizados.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
