"use client";

import { collection, doc, getDocs, query, where, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { formatCurrency } from "@/lib/utils";

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);

  async function searchUser() {
    if (!searchEmail) return;
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("email", "==", searchEmail.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        showToast("Usuario no encontrado", "error");
        setFoundUser(null);
      } else {
        const u = { id: snap.docs[0].id, ...snap.docs[0].data() };
        // Fetch balance
        const bSnap = await getDoc(doc(db, "balances", u.id));
        setFoundUser({ ...u, balance: bSnap.data() });
      }
    } catch (e) {
      showToast("Error al buscar", "error");
    } finally {
      setLoading(false);
    }
  }

  async function repairBalance() {
    if (!foundUser) return;
    setLoading(true);
    try {
      // 1. Obtener todos los depósitos aprobados
      const depSnap = await getDocs(query(collection(db, "deposits"), where("userId", "==", foundUser.id), where("status", "==", "approved")));
      const totalDep = depSnap.docs.reduce((acc, d) => acc + (d.data().amount || 0), 0);

      // 2. Obtener todas las ganancias (profits) aprobadas
      const trxSnap = await getDocs(query(collection(db, "transactions"), where("userId", "==", foundUser.id), where("type", "==", "profit"), where("status", "==", "approved")));
      const totalProfit = trxSnap.docs.reduce((acc, t) => acc + (t.data().amount || 0), 0);

      // 3. Obtener solo retiros APROBADOS
      const wdSnap = await getDocs(query(collection(db, "withdrawals"), where("userId", "==", foundUser.id), where("status", "==", "approved")));
      const totalWd = wdSnap.docs.reduce((acc, w) => acc + (w.data().amount || 0), 0);

      const newBalance = totalDep + totalProfit - totalWd;

      // 4. Actualizar Firestore
      await updateDoc(doc(db, "balances", foundUser.id), {
        totalDeposited: totalDep,
        totalProfit: totalProfit,
        currentBalance: newBalance,
        updatedAt: serverTimestamp()
      });

      showToast(`Balance reparado: ${formatCurrency(newBalance)}`, "success");
      searchUser(); // Refresh UI
    } catch (e) {
      showToast("Error al reparar saldo", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020203] p-8 text-white">
      <div className="mb-10">
        <h1 className="text-2xl font-bold">Gestión de Usuarios e Inversiones</h1>
        <p className="text-sm text-zinc-500">Herramientas de auditoría y reparación de saldos.</p>
      </div>

      <div className="max-w-xl space-y-6">
        <div className="flex gap-2">
          <input 
            type="email" 
            placeholder="Email del usuario..." 
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-cyan-500/50"
          />
          <button onClick={searchUser} disabled={loading} className="rounded-xl bg-white px-6 py-3 font-bold text-black hover:bg-zinc-200">Buscar</button>
        </div>

        {foundUser && (
          <div className="animate-in fade-in slide-in-from-top-4 rounded-[32px] border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-bold">{foundUser.name}</h2>
                <p className="text-xs text-zinc-500">{foundUser.email}</p>
                <p className="text-[10px] font-mono text-cyan-500 mt-1 uppercase tracking-widest">{foundUser.ncId || 'Sin ID'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${foundUser.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {foundUser.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Depósitos Totales</p>
                <p className="text-xl font-bold">{formatCurrency(foundUser.balance?.totalDeposited || 0)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Balance Actual</p>
                <p className="text-xl font-bold text-cyan-400">{formatCurrency(foundUser.balance?.currentBalance || 0)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={repairBalance} 
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 py-4 text-sm font-black text-white shadow-lg shadow-orange-900/20 hover:scale-[1.02] transition-transform active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Reparar y Sincronizar Balance
              </button>
              <p className="text-[10px] text-zinc-500 text-center px-4 leading-relaxed">
                Esta acción recalcula el saldo sumando depósitos/ganancias aprobados y restando SOLO retiros aprobados. Ignora solicitudes pendientes.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
