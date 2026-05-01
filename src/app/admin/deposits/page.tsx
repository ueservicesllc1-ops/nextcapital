"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { Deposit } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "En revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
  completed: "Completado",
  failed: "Fallido",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  completed: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  failed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

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
    <main className="min-h-screen bg-[#020203] p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Aprobación de Depósitos</h1>
        <p className="mt-1 text-sm text-zinc-500">Revisa y aprueba o rechaza los depósitos manuales de los inversores.</p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-zinc-500 text-sm">Cargando depósitos...</div>
      ) : !deposits.length ? (
        <div className="grid place-items-center py-20 text-zinc-500 text-sm">No hay depósitos registrados.</div>
      ) : (
        <div className="space-y-3">
          {deposits.map((deposit) => (
            <article
              key={deposit.id}
              className="group overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-6 shadow-xl backdrop-blur-xl transition-all hover:border-white/[0.10]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">{deposit.method}</span>
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${STATUS_COLORS[deposit.status] ?? STATUS_COLORS.pending}`}>
                      {STATUS_LABELS[deposit.status] ?? deposit.status}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white">{formatCurrency(deposit.amount)}</p>
                  <p className="text-xs text-zinc-500">
                    Usuario: <span className="font-mono text-zinc-400">{deposit.userId}</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    Fecha: {new Date(normalizeDate(deposit.createdAt)).toLocaleDateString("es-ES", { dateStyle: "medium" })}
                  </p>
                  {deposit.receiptUrl && (
                    <a
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
                      href={deposit.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Ver comprobante
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={deposit.status !== "pending"}
                    onClick={() => updateStatus(deposit.id, "approved")}
                    className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-30"
                  >
                    Aprobar
                  </button>
                  <button
                    disabled={deposit.status !== "pending"}
                    onClick={() => updateStatus(deposit.id, "rejected")}
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

