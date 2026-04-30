"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { Deposit } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function AdminDepositsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    const token = await firebaseUser?.getIdToken();
    const res = await fetch(`/api/admin/deposits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message ?? "No se pudo actualizar.", "error");
      return;
    }
    showToast(data.message ?? "Estado actualizado.", "success");
    await loadDeposits();
  }

  async function loadDeposits() {
    const snap = await getDocs(query(collection(db, "deposits"), orderBy("createdAt", "desc")));
    setDeposits(
      snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        createdAt: normalizeDate(item.data().createdAt),
      })) as Deposit[]
    );
    setLoading(false);
  }

  useEffect(() => {
    void loadDeposits();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Aprobación de depósitos</h1>
      <p className="mt-1 text-sm text-slate-400">Solo admin puede aprobar o rechazar depósitos manuales.</p>
      {loading ? <p className="mt-4 text-sm text-slate-400">Cargando depósitos...</p> : null}
      <div className="mt-4 space-y-3">
        {!loading && !deposits.length ? <p className="text-sm text-slate-400">No hay depósitos registrados.</p> : null}
        {deposits.map((deposit) => (
          <article key={deposit.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium text-white">
                  {deposit.method.toUpperCase()} - {formatCurrency(deposit.amount)}
                </p>
                <p className="text-slate-400">Estado actual: {deposit.status}</p>
                <p className="text-slate-400">Usuario: {deposit.userId}</p>
                {deposit.receiptUrl ? (
                  <a className="text-cyan-300" href={deposit.receiptUrl} target="_blank" rel="noreferrer">
                    Ver comprobante
                  </a>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={deposit.status !== "pending"}
                  onClick={() => updateStatus(deposit.id, "approved")}
                  className="rounded-lg bg-emerald-500 px-3 py-1 text-sm font-medium text-slate-950 disabled:opacity-50"
                >
                  Aprobar
                </button>
                <button
                  disabled={deposit.status !== "pending"}
                  onClick={() => updateStatus(deposit.id, "rejected")}
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
