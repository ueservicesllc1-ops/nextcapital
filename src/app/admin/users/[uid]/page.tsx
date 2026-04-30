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

  const [addAmount, setAddAmount] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAddFunds(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(addAmount);
    if (!val || val <= 0) return;
    
    if (!confirm(`¿Confirmas agregar ${formatCurrency(val)} a ${user?.name}?`)) return;
    setAdding(true);
    try {
      const { doc, addDoc, collection, serverTimestamp, updateDoc } = await import("firebase/firestore");
      
      // 1. Crear transacción
      await addDoc(collection(db, "transactions"), {
        userId: params.uid,
        amount: val,
        type: "deposit",
        description: "Fondo agregado manualmente por Admin",
        status: "approved",
        createdAt: serverTimestamp(),
      });

      // 2. Actualizar balance
      const newCurrent = (balance?.currentBalance ?? 0) + val;
      const newTotal = (balance?.totalDeposited ?? 0) + val;
      
      await updateDoc(doc(db, "balances", params.uid), {
        currentBalance: newCurrent,
        totalDeposited: newTotal,
        updatedAt: serverTimestamp()
      });

      setBalance(prev => prev ? { ...prev, currentBalance: newCurrent, totalDeposited: newTotal } : null);
      setAddAmount("");
      alert("Fondos agregados correctamente.");
    } catch (err: any) {
      alert("Error agregando fondos: " + err.message);
    } finally {
      setAdding(false);
    }
  }

  if (!user) return <main className="p-6">Cargando perfil...</main>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">{user.name}</h1>
      <p className="text-slate-400">{user.email}</p>
      
      <section className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Rol</p>
          <p className="font-medium capitalize">{user.role}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Estado</p>
          <p className="font-medium capitalize">{user.status}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
          <p className="text-xs text-emerald-500/50">Balance Actual</p>
          <p className="text-xl font-bold">{formatCurrency(balance?.currentBalance ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Movimientos</p>
          <p className="font-medium">{depositsCount} depósitos / {withdrawalsCount} retiros</p>
        </div>
      </section>

      {/* Agregar fondos manual */}
      <section className="mt-8 max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Inyección Manual de Fondos</h2>
        <p className="mt-1 text-sm text-slate-400">Agrega saldo directamente a la cuenta de este usuario como una transacción aprobada.</p>
        
        <form onSubmit={handleAddFunds} className="mt-5 grid gap-4">
          <div>
            <label className="text-xs font-medium text-slate-400">Monto (USD)</label>
            <input 
              type="number" 
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              min={1}
              required
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-cyan-500"
              placeholder="Ej: 500"
            />
          </div>
          <button 
            disabled={adding}
            className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-50"
          >
            {adding ? "Agregando..." : "Agregar Fondos"}
          </button>
        </form>
      </section>
    </main>
  );
}
