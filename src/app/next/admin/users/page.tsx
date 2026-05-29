"use client";

import { collection, doc, getDocs, query, where, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { formatCurrency } from "@/lib/utils";

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all users
      const usersSnap = await getDocs(collection(db, "users"));
      // 2. Fetch all balances to match
      const balancesSnap = await getDocs(collection(db, "balances"));
      
      const balancesMap: Record<string, any> = {};
      balancesSnap.docs.forEach(doc => {
        balancesMap[doc.id] = doc.data();
      });

      const loadedUsers = usersSnap.docs.map(doc => {
        const data = doc.data();
        const userId = doc.id;
        return {
          id: userId,
          ...data,
          balance: balancesMap[userId] || {
            totalDeposited: 0,
            totalProfit: 0,
            currentBalance: 0,
          }
        };
      });

      setUsers(loadedUsers);
    } catch (e) {
      console.error("Error loading users:", e);
      showToast("Error al cargar la lista de usuarios.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function repairUserBalance(userId: string, userName: string) {
    setActionLoading(userId);
    try {
      // 1. Approved deposits
      const depSnap = await getDocs(
        query(collection(db, "deposits"), where("userId", "==", userId), where("status", "==", "approved"))
      );
      const totalDep = depSnap.docs.reduce((acc, d) => acc + (d.data().amount || 0), 0);

      // 2. Approved profit transactions
      const trxSnap = await getDocs(
        query(collection(db, "transactions"), where("userId", "==", userId), where("type", "==", "profit"), where("status", "==", "approved"))
      );
      const totalProfit = trxSnap.docs.reduce((acc, t) => acc + (t.data().amount || 0), 0);

      // 3. Approved withdrawals
      const wdSnap = await getDocs(
        query(collection(db, "withdrawals"), where("userId", "==", userId), where("status", "==", "approved"))
      );
      const totalWd = wdSnap.docs.reduce((acc, w) => acc + (w.data().amount || 0), 0);

      const newBalance = totalDep + totalProfit - totalWd;

      // 4. Update in Firestore
      await updateDoc(doc(db, "balances", userId), {
        totalDeposited: totalDep,
        totalProfit: totalProfit,
        currentBalance: newBalance,
        updatedAt: serverTimestamp()
      });

      showToast(`Balance recalculado para ${userName}: ${formatCurrency(newBalance)}`, "success");
      await loadUsers(); // Refresh the list
    } catch (e) {
      console.error("Error repairing balance:", e);
      showToast("Error al reparar saldo.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  // Filter users based on query
  const filteredUsers = users.filter(user => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      (user.name || "").toLowerCase().includes(term) ||
      (user.email || "").toLowerCase().includes(term) ||
      (user.ncId || "").toLowerCase().includes(term)
    );
  });

  return (
    <main className="min-h-screen bg-[#020203] p-8 text-white">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Gestión de Usuarios e Inversiones</h1>
          <p className="text-sm text-zinc-500 mt-1">Directorio de inversionistas de NextCapital, telemetría financiera y auditoría de saldos.</p>
        </div>
        <button 
          onClick={loadUsers} 
          disabled={loading}
          className="px-5 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Actualizar Lista"}
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="mb-8 max-w-md">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Filtrar por nombre, email o ID de nodo..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 pl-12 text-sm outline-none focus:border-cyan-500/50 transition-all font-medium"
          />
          <svg className="absolute left-4 top-4.5 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 font-mono text-xs">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto mb-4" />
          Cargando directorio de inversionistas...
        </div>
      ) : !filteredUsers.length ? (
        <div className="py-20 text-center border border-dashed border-white/5 rounded-[40px] text-zinc-500">
          Ningún usuario coincide con los criterios de búsqueda.
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="overflow-x-auto rounded-[32px] border border-white/[0.06] bg-zinc-900/20 backdrop-blur-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-[10px] font-black uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-4.5">Inversionista</th>
                  <th className="px-6 py-4.5">ID de Nodo</th>
                  <th className="px-6 py-4.5">Rol</th>
                  <th className="px-6 py-4.5">Total Depositado</th>
                  <th className="px-6 py-4.5">Balance Actual</th>
                  <th className="px-6 py-4.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-medium">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{user.name || "Inversionista"}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold">
                        {user.ncId || "Sin Asignar"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                        user.role === 'admin' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-zinc-500/10 text-zinc-400 border border-white/5'
                      }`}>
                        {user.role || 'investor'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-zinc-400">
                      {formatCurrency(user.balance?.totalDeposited || 0)}
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-white">
                      {formatCurrency(user.balance?.currentBalance || 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => router.push(`/next/admin/users/${user.id}`)}
                          className="px-4 py-2 rounded-xl bg-white text-black text-xs font-black tracking-wide hover:bg-zinc-200 transition-all active:scale-[0.98]"
                        >
                          Administrar / Acreditar
                        </button>
                        <button 
                          onClick={() => repairUserBalance(user.id, user.name || user.email)}
                          disabled={actionLoading !== null}
                          className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {actionLoading === user.id ? "Recalculando..." : "Sincronizar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
