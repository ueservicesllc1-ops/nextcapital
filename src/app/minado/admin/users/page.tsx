"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, doc } from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { formatCurrency } from "@/lib/utils";
import { 
  Zap, 
  Cpu, 
  Users, 
  Coins, 
  ShieldCheck, 
  Search 
} from "lucide-react";

export default function MiningAdminUsersPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadUsersAndPlans = useCallback(async () => {
    setLoading(true);
    try {
      const [usersSnap, depositsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "deposits")),
      ]);

      // Map user active mining contracts
      const userPlansMap: Record<string, string[]> = {};
      depositsSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.status === "approved" && ["NC-S1", "NC-P2", "NC-I3"].includes(d.planId ?? "")) {
          if (!userPlansMap[d.userId]) {
            userPlansMap[d.userId] = [];
          }
          userPlansMap[d.userId].push(d.planId);
        }
      });

      const loaded = usersSnap.docs.map(doc => {
        const data = doc.data();
        const userId = doc.id;
        const activePlans = userPlansMap[userId] || [];
        return {
          id: userId,
          ...data,
          activePlans,
        };
      });

      setUsers(loaded);
    } catch (e) {
      console.error("Error loading users and plans:", e);
      showToast("Error al cargar la red de mineros.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadUsersAndPlans();
  }, [loadUsersAndPlans]);

  async function handleAssignPlan(userId: string, userName: string, planId: string) {
    if (!planId) return;
    
    const PLANS_NAMES: Record<string, string> = {
      "NC-S1": "Starter (100 TH/s)",
      "NC-P2": "Pro (250 TH/s)",
      "NC-I3": "Industrial (500 TH/s)",
    };

    if (!window.confirm(`¿Seguro que deseas asignar y activar manualmente el plan ${PLANS_NAMES[planId]} para el usuario ${userName}?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch("/api/admin/deposits/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId, planId }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message ?? "No se pudo asignar el plan.", "error");
        return;
      }

      showToast(data.message ?? "Contrato de minería asignado con éxito.", "success");
      await loadUsersAndPlans(); // Refresh lists
    } catch (e) {
      console.error(e);
      showToast("Error de conexión al asignar contrato.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      (u.name || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.ncId || "").toLowerCase().includes(term)
    );
  });

  return (
    <main className="p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-500 tracking-wider">CORE_MINING_OS // GESTIÓN DE NODOS</span>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">Directorio de Nodos y Plan de Asignación</h2>
        </div>
        <button 
          onClick={loadUsersAndPlans}
          disabled={loading}
          className="py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs hover:bg-amber-500/20 transition-all disabled:opacity-50"
        >
          {loading ? "Sincronizando..." : "Actualizar Mineros"}
        </button>
      </div>

      {/* Filter and Search */}
      <div className="max-w-md">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o nodo ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 pl-12 text-sm outline-none focus:border-amber-500/30 transition-all font-medium placeholder-slate-600"
          />
          <Search className="absolute left-4 top-4.5 w-4 h-4 text-zinc-500" />
        </div>
      </div>

      {/* Table view */}
      {loading ? (
        <div className="py-20 text-center text-zinc-500 font-mono text-xs">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-4" />
          Escaneando clúster de mineros...
        </div>
      ) : !filteredUsers.length ? (
        <div className="py-20 text-center border border-dashed border-white/5 rounded-[40px] text-zinc-500">
          Ningún minero encontrado con ese email o ID.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[32px] border border-white/[0.06] bg-zinc-900/20 backdrop-blur-xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] text-[10px] font-black uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-4.5">Usuario / Nodo</th>
                <th className="px-6 py-4.5">ID de Hardware</th>
                <th className="px-6 py-4.5">Estatus Minería</th>
                <th className="px-6 py-4.5">Contratos Activos</th>
                <th className="px-6 py-4.5 text-right">Asignar Contrato Manual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-medium">
              {filteredUsers.map((user) => {
                const hasActivePlan = user.activePlans && user.activePlans.length > 0;
                return (
                  <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white group-hover:text-amber-400 transition-colors">{user.name || "Miner Node"}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-mono font-bold">
                        {user.ncId || "NC-UNASSIGNED"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${hasActivePlan ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-rose-500'}`} />
                        <span className={`text-xs font-bold ${hasActivePlan ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {hasActivePlan ? "ONLINE / MINANDO" : "OFFLINE / INACTIVO"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {hasActivePlan ? (
                        <div className="flex flex-wrap gap-1.5">
                          {user.activePlans.map((plan: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black font-mono">
                              {plan}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600 font-mono">Ningún contrato físico</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select 
                          disabled={actionLoading !== null}
                          onChange={(e) => {
                            const selectedPlan = e.target.value;
                            if (selectedPlan) {
                              void handleAssignPlan(user.id, user.name || user.email, selectedPlan);
                              e.target.value = ""; // Reset dropdown
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-black border border-white/10 text-xs font-bold text-slate-300 focus:border-amber-500/30 outline-none cursor-pointer"
                        >
                          <option value="">-- Seleccionar Plan --</option>
                          <option value="NC-S1">Starter Plan ($149)</option>
                          <option value="NC-P2">Pro Plan ($329)</option>
                          <option value="NC-I3">Industrial Plan ($599)</option>
                        </select>
                        {actionLoading === user.id && (
                          <div className="w-4 h-4 rounded-full border border-amber-500 border-t-transparent animate-spin" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
