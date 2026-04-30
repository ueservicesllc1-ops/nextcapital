"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { Withdrawal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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
    let active = true;
    const run = async () => {
      const snap = await getDocs(query(collection(db, "withdrawals"), orderBy("createdAt", "desc")));
      if (!active) return;
      setWithdrawals(
        snap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
          createdAt: normalizeDate(item.data().createdAt),
        })) as Withdrawal[]
      );
      setLoading(false);
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

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
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Retiros</h1>
      <p className="mt-1 text-sm text-slate-400">Aprobación y rechazo de solicitudes de retiro.</p>
      {loading ? <p className="mt-4 text-sm text-slate-400">Cargando retiros...</p> : null}
      <div className="mt-4 space-y-3">
        {!loading && !withdrawals.length ? <p className="text-sm text-slate-400">No hay retiros registrados.</p> : null}
        {withdrawals.map((withdrawal) => (
          <article key={withdrawal.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium text-white">{formatCurrency(withdrawal.amount)}</p>
                <p className="text-slate-400">Usuario: {withdrawal.userId}</p>
                <p className="text-slate-400">Estado: {withdrawal.status}</p>
                <p className="text-slate-400">
                  Fecha: {new Date(normalizeDate(withdrawal.createdAt)).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={withdrawal.status !== "pending"}
                  onClick={() => updateStatus(withdrawal.id, "approved")}
                  className="rounded-lg bg-emerald-500 px-3 py-1 text-sm font-medium text-slate-950 disabled:opacity-50"
                >
                  Aprobar
                </button>
                <button
                  disabled={withdrawal.status !== "pending"}
                  onClick={() => updateStatus(withdrawal.id, "rejected")}
                  className="rounded-lg bg-rose-500 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
