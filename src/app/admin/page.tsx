"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { db } from "@/lib/firebase/client";
import { formatCurrency } from "@/lib/utils";

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposited: 0,
    pendingDeposits: 0,
    totalProfit: 0,
  });

  useEffect(() => {
    async function load() {
      const [usersSnap, balancesSnap, pendingDepositsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "balances")),
        getDocs(query(collection(db, "deposits"), where("status", "==", "pending"))),
      ]);

      let totalDeposited = 0;
      let totalProfit = 0;
      balancesSnap.docs.forEach((doc) => {
        const data = doc.data();
        totalDeposited += Number(data.totalDeposited ?? 0);
        totalProfit += Number(data.totalProfit ?? 0);
      });

      setStats({
        totalUsers: usersSnap.size,
        totalDeposited,
        pendingDeposits: pendingDepositsSnap.size,
        totalProfit,
      });
    }

    void load();
  }, []);

  return (
    <main className="min-h-screen bg-[#020203] p-8">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 flex justify-center overflow-hidden">
        <div className="h-[40rem] w-[40rem] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Gestión operativa de usuarios, depósitos, ganancias y retiros.</p>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total usuarios" value={String(stats.totalUsers)} />
          <StatCard title="Capital depositado" value={formatCurrency(stats.totalDeposited)} positive />
          <StatCard title="Depósitos pendientes" value={String(stats.pendingDeposits)} helper="requieren revisión" />
          <StatCard title="Ganancias registradas" value={formatCurrency(stats.totalProfit)} positive />
        </section>
      </div>
    </main>
  );
}

