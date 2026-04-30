"use client";

import { FormEvent, useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { Topbar } from "@/components/dashboard/topbar";
import { useAuth } from "@/components/providers/auth-provider";
import { trackEvent } from "@/lib/analytics-events";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { Deposit } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function DepositsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [amount, setAmount] = useState("500");
  const [message, setMessage] = useState("");
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [bankAmount, setBankAmount] = useState("750");
  const [depositDate, setDepositDate] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  async function createStripeDeposit() {
    setMessage("");
    const token = await firebaseUser?.getIdToken();
    const res = await fetch("/api/stripe/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: Number(amount) }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message ?? "No se pudo crear la intención de pago.", "error");
      return;
    }
    await trackEvent("create_stripe_intent", { amount: Number(amount) });
    showToast("Depósito Stripe creado con estado pending.", "success");
    await loadDeposits();
    setMessage(data.message ?? "Intento de pago creado.");
  }

  async function createBankDeposit(event: FormEvent) {
    event.preventDefault();
    if (!receipt) {
      setMessage("Debes subir un comprobante.");
      return;
    }
    const token = await firebaseUser?.getIdToken();
    const formData = new FormData();
    formData.append("amount", bankAmount);
    formData.append("depositDate", depositDate);
    formData.append("receipt", receipt);
    const res = await fetch("/api/deposits/bank", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message ?? "No se pudo enviar el depósito manual.", "error");
      return;
    }
    await trackEvent("submit_bank_deposit", { amount: Number(bankAmount) });
    showToast("Comprobante subido. Depósito en revisión.", "success");
    await loadDeposits();
    setMessage(data.message ?? "Depósito enviado para revisión.");
  }

  async function loadDeposits() {
    if (!firebaseUser) return;
    const depositsSnap = await getDocs(
      query(collection(db, "deposits"), where("userId", "==", firebaseUser.uid), orderBy("createdAt", "desc"))
    );
    setDeposits(
      depositsSnap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        createdAt: normalizeDate(item.data().createdAt),
      })) as Deposit[]
    );
    setLoadingDeposits(false);
  }

  useEffect(() => {
    void loadDeposits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid]);

  return (
    <main>
      <Topbar balance={0} />
      <section className="grid gap-6 p-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h1 className="text-xl font-semibold">Depósito con tarjeta (Stripe)</h1>
          <p className="mt-2 text-sm text-slate-400">Crea una intención de pago y registra el depósito.</p>
          <div className="mt-4 grid gap-3">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={10} />
            <button onClick={createStripeDeposit} className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950">
              Crear intento de pago
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Depósito bancario manual</h2>
          <form onSubmit={createBankDeposit} className="mt-4 grid gap-3">
            <input value="Banco Pichincha" readOnly />
            <input value="Next Capital Holdings" readOnly />
            <input value="220044113399" readOnly />
            <input value="Cuenta Corriente" readOnly />
            <input value={bankAmount} onChange={(e) => setBankAmount(e.target.value)} type="number" min={10} />
            <input value={depositDate} onChange={(e) => setDepositDate(e.target.value)} type="date" required />
            <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} required />
            <button className="rounded-xl bg-emerald-500 px-4 py-2 font-medium text-slate-950">Subir comprobante</button>
          </form>
        </article>
      </section>
      <section className="px-6 pb-6">
        <h2 className="text-lg font-semibold">Mis depósitos</h2>
        {loadingDeposits ? <p className="mt-2 text-sm text-slate-400">Cargando depósitos...</p> : null}
        {!loadingDeposits && !deposits.length ? (
          <p className="mt-2 text-sm text-slate-400">Aún no tienes depósitos registrados.</p>
        ) : null}
        <div className="mt-3 space-y-2">
          {deposits.map((deposit) => (
            <div key={deposit.id} className="flex flex-wrap items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
              <span>{new Date(normalizeDate(deposit.createdAt)).toLocaleDateString()}</span>
              <span>{deposit.method.toUpperCase()}</span>
              <span>{formatCurrency(deposit.amount)}</span>
              <span className="capitalize text-slate-300">{deposit.status}</span>
            </div>
          ))}
        </div>
      </section>
      {message ? <p className="px-6 pb-6 text-sm text-cyan-300">{message}</p> : null}
    </main>
  );
}
