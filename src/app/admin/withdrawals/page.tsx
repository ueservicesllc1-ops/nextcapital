"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { Withdrawal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function AdminWithdrawalsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const loadWithdrawals = useCallback(async () => {
    const snap = await getDocs(query(collection(db, "withdrawals"), orderBy("createdAt", "desc")));
    setWithdrawals(
      snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        createdAt: normalizeDate(item.data().createdAt),
      })) as Withdrawal[]
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadWithdrawals();
  }, [loadWithdrawals]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    const token = await firebaseUser?.getIdToken();
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message ?? "No se pudo procesar el retiro.", "error");
      return;
    }
    showToast(data.message ?? "Retiro actualizado.", "success");
    await loadWithdrawals();
  }

  return (
    <main className="min-h-screen bg-[#020203] p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Solicitudes de Retiro</h1>
        <p className="mt-1 text-sm text-zinc-500">Aprobación y rechazo de solicitudes de retiro de inversores.</p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-zinc-500 text-sm">Cargando retiros...</div>
      ) : !withdrawals.length ? (
        <div className="grid place-items-center py-20 text-zinc-500 text-sm">No hay solicitudes de retiro registradas.</div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((withdrawal) => (
            <article
              key={withdrawal.id}
              className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-6 shadow-xl backdrop-blur-xl transition-all hover:border-white/[0.10]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Retiro</span>
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${STATUS_COLORS[withdrawal.status] ?? STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[withdrawal.status] ?? withdrawal.status}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white">{formatCurrency(withdrawal.amount)}</p>
                  <p className="text-xs text-zinc-500">
                    Usuario: <span className="font-mono text-zinc-400">{withdrawal.userId}</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    Fecha: {new Date(normalizeDate(withdrawal.createdAt)).toLocaleDateString("es-ES", { dateStyle: "medium" })}
                  </p>

                  {/* Datos Bancarios */}
                  <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Datos para Transferencia</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Beneficiario</p>
                        <p className="text-sm font-medium text-zinc-200">{(withdrawal as any).details?.fullName || "No especificado"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Banco</p>
                        <p className="text-sm font-medium text-zinc-200">{(withdrawal as any).details?.bankName || "No especificado"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Tipo</p>
                        <p className="text-sm font-medium text-zinc-200">{(withdrawal as any).details?.accountType || "No especificado"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Nº de Cuenta</p>
                        <p className="text-sm font-medium text-cyan-400 font-mono">{(withdrawal as any).details?.accountNumber || "No especificado"}</p>
                      </div>
                    </div>
                    {!(withdrawal as any).details && withdrawal.bankAccount && (
                      <p className="text-xs text-zinc-400 mt-2 italic">{withdrawal.bankAccount}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 self-start">
                  <button
                    disabled={withdrawal.status !== "pending"}
                    onClick={() => updateStatus(withdrawal.id, "approved")}
                    className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-30"
                  >
                    Aprobar
                  </button>
                  <button
                    disabled={withdrawal.status !== "pending"}
                    onClick={() => updateStatus(withdrawal.id, "rejected")}
                    className="rounded-full border border-rose-500/30 bg-rose-500/10 px-5 py-2 text-sm font-semibold text-rose-400 transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-30"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}


