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
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-400">Gestión operativa de usuarios, depósitos, ganancias y retiros.</p>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total usuarios" value={String(stats.totalUsers)} />
        <StatCard title="Total capital depositado" value={formatCurrency(stats.totalDeposited)} />
        <StatCard title="Depósitos pendientes" value={String(stats.pendingDeposits)} />
        <StatCard title="Ganancias registradas" value={formatCurrency(stats.totalProfit)} />
      </section>
    </main>
  );
}
