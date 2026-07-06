"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GrowthChart } from "@/components/dashboard/growth-chart";
import { ProfitCountdown } from "@/components/dashboard/profit-countdown";
import { Topbar } from "@/components/dashboard/topbar";
import { useAuth } from "@/components/providers/auth-provider";
import { getInvestorData } from "@/lib/data";
import { Balance, Deposit, Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function MiniStatCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent?: boolean;
  sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-4 shadow-xl backdrop-blur-xl">
      {accent && (
        <div className="absolute -top-px left-4 h-[2px] w-10 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      )}
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className={`mt-1.5 text-xl font-black tracking-tight truncate ${accent ? "text-white" : "text-zinc-100"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[10px] text-zinc-600">{sub}</p>}
    </div>
  );
}

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
        await fetch("/api/investor/credit-interests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: firebaseUser.uid }),
        });
        const data = await getInvestorData(firebaseUser.uid);
        setBalance(data.balance);
        setDeposits(data.deposits);
        setTransactions(data.transactions);
        setGrowth(data.growth);
      } catch (err: any) {
        setError("Error al cargar el dashboard: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [firebaseUser]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#020203] px-4 text-center text-rose-400">
        {error}
      </div>
    );
  }

  if (loading || !balance) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#020203]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-400" />
          <p className="text-sm text-zinc-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const dailyEstimate = balance.totalDeposited * 0.01;
  const monthlyEstimate = balance.totalDeposited * 0.3;
  const approvedDeposits = deposits.filter((d) => d.status === "approved");

  return (
    <main className="relative min-h-screen bg-[#020203]">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 flex justify-center overflow-hidden">
        <div className="h-[30rem] w-[30rem] rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10">
        <Topbar balance={balance.currentBalance} />

        <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-12">

          {/* ── BALANCE HERO CARD (mobile) ── */}
          <div className="mb-5 overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-zinc-900/80 to-zinc-950/90 p-5 shadow-2xl shadow-cyan-500/5 sm:hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">Balance Actual</p>
            <p className="mt-1 text-4xl font-black tracking-tight text-white">
              {formatCurrency(balance.currentBalance)}
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ganando {formatCurrency(dailyEstimate)}/día
              </span>
              <span className="text-zinc-600">|</span>
              <span>{approvedDeposits.length} plan{approvedDeposits.length !== 1 ? "es" : ""} activo{approvedDeposits.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* ── STAT CARDS GRID ── */}
          <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
            <MiniStatCard label="Total Depositado" value={formatCurrency(balance.totalDeposited)} />
            <MiniStatCard label="Balance Actual" value={formatCurrency(balance.currentBalance)} accent />
            <MiniStatCard label="Ganancias" value={formatCurrency(balance.totalProfit)} accent sub="rendimientos totales" />
            <MiniStatCard label="Ganancia Diaria" value={formatCurrency(dailyEstimate)} sub="rendimiento estimado" />
            <MiniStatCard label="Est. Mensual" value={formatCurrency(monthlyEstimate)} sub="hasta 30% mensual" />

            {/* Trading CTA — hidden on 2-col mobile, shown from md */}
            <div className="col-span-2 md:col-span-1 xl:col-span-1 group relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-4 shadow-lg shadow-cyan-500/5 transition-all hover:border-cyan-500/50">
              <div className="relative z-10 flex h-full flex-col justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Nuevo</p>
                  <p className="mt-1 text-sm font-bold text-white">Plataforma de Trading</p>
                  <p className="mt-0.5 text-[10px] text-zinc-400">Opera en mercados reales.</p>
                </div>
                <Link
                  href="/next/trading"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 py-2 text-xs font-bold text-black transition-all hover:bg-cyan-400"
                >
                  Ir a Trading
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-cyan-500/20 blur-2xl" />
            </div>

            {/* Profit Countdown */}
            <div className="col-span-2 sm:col-span-1 2xl:col-span-1">
              <ProfitCountdown deposits={deposits} />
            </div>
          </section>

          {/* ── CHART + DEPOSITS ── */}
          <section className="mt-5 grid gap-4 sm:mt-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <GrowthChart data={growth} />
            </div>

            {/* Recent Deposits */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-5 shadow-2xl backdrop-blur-xl">
              <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Últimos Depósitos</h3>
              <div className="flex-1 space-y-2">
                {!deposits.length ? (
                  <p className="py-4 text-center text-sm text-zinc-600">No hay depósitos todavía.</p>
                ) : null}
                {deposits.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.03] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${item.status === "approved" ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 truncate">
                        {(item.planId || item.method || "—").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-bold text-white">{formatCurrency(item.amount)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.status === "approved" ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/next/dashboard/deposits"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
              >
                Ver todos los depósitos
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>

          {/* ── TRANSACTIONS ── */}
          <section className="mt-4 sm:mt-6">
            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 shadow-2xl backdrop-blur-xl">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Historial de Transacciones</h3>
              </div>

              {/* Mobile card list */}
              <div className="divide-y divide-white/[0.04] xl:hidden">
                {!transactions.length ? (
                  <p className="px-5 py-8 text-center text-sm text-zinc-600">No hay transacciones registradas.</p>
                ) : null}
                {transactions.slice(0, 20).map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold ${item.type === "profit" ? "bg-emerald-500/15 text-emerald-400" : "bg-indigo-500/15 text-indigo-400"}`}>
                        {item.type === "profit" ? "%" : "$"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold capitalize text-zinc-200">{item.type === "profit" ? "Rendimiento" : "Depósito"}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{new Date(item.createdAt).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-sm font-bold ${item.type === "profit" ? "text-emerald-400" : "text-white"}`}>
                        +{formatCurrency(item.amount)}
                      </p>
                      <p className={`text-[10px] font-semibold ${item.status === "approved" ? "text-emerald-500/80" : "text-zinc-600"}`}>
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden xl:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Fecha</th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Tipo</th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Descripción</th>
                      <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Monto</th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Estado</th>
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
                        <td className="px-6 py-4 text-zinc-400 max-w-[280px] truncate">{item.description}</td>
                        <td className={`whitespace-nowrap px-6 py-4 text-right font-bold ${item.type === "profit" ? "text-emerald-400" : "text-white"}`}>
                          +{formatCurrency(item.amount)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${item.status === "approved" ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Toda inversión conlleva riesgo. Los rendimientos no están garantizados.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
