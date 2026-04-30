"use client";

import { useParams } from "next/navigation";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { AppUser, Balance } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function AdminUserDetailPage() {
  const params = useParams<{ uid: string }>();
  const [user, setUser] = useState<AppUser | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [depositsCount, setDepositsCount] = useState(0);
  const [withdrawalsCount, setWithdrawalsCount] = useState(0);

  useEffect(() => {
    async function load() {
      const uid = params.uid;
      if (!uid) return;
      const [userSnap, balanceSnap, depositsSnap, withdrawalsSnap] = await Promise.all([
        getDoc(doc(db, "users", uid)),
        getDoc(doc(db, "balances", uid)),
        getDocs(query(collection(db, "deposits"), where("userId", "==", uid))),
        getDocs(query(collection(db, "withdrawals"), where("userId", "==", uid))),
      ]);
      setUser(userSnap.data() as AppUser);
      setBalance(balanceSnap.data() as Balance);
      setDepositsCount(depositsSnap.size);
      setWithdrawalsCount(withdrawalsSnap.size);
    }
    void load();
  }, [params.uid]);

  if (!user) return <main className="p-6">Cargando perfil...</main>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">{user.name}</h1>
      <p className="text-slate-400">{user.email}</p>
      <section className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">Rol: {user.role}</div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">Estado: {user.status}</div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          Balance: {formatCurrency(balance?.currentBalance ?? 0)}
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          Movimientos: {depositsCount} depósitos / {withdrawalsCount} retiros
        </div>
      </section>
    </main>
  );
}
