"use client";

import { FormEvent, useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Topbar } from "@/components/dashboard/topbar";
import { useAuth } from "@/components/providers/auth-provider";
import { trackEvent } from "@/lib/analytics-events";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { normalizeDate } from "@/lib/firestore-client";
import { Deposit } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const INVESTMENT_PLANS = [
  { id: "inicio", name: "Plan Inicio", amount: 100, daily: "0.5% diario" },
  { id: "plata", name: "Plan Plata", amount: 500, daily: "0.75% diario" },
  { id: "oro", name: "Plan Oro", amount: 1000, daily: "1% diario" },
  { id: "platinium", name: "Plan Platinium", amount: 2000, daily: "1.25% diario" },
];

export default function DepositsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(INVESTMENT_PLANS[0]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [depositDate, setDepositDate] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [depositType, setDepositType] = useState<"plan" | "free">("plan");
  const [freeAmount, setFreeAmount] = useState<number>(10);

  const finalAmount = depositType === "plan" ? selectedPlan.amount : freeAmount;
  const finalId = depositType === "plan" ? selectedPlan.id : "wallet_topup";

  async function createStripeDeposit() {
    if (depositType === "free" && freeAmount < 10) {
      showToast("El monto mínimo de recarga es $10.", "error");
      return;
    }
    setLoadingStripe(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch("/api/stripe/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: finalAmount, planId: finalId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message ?? "No se pudo conectar con Stripe.", "error");
        setLoadingStripe(false);
        return;
      }
      await trackEvent("create_stripe_checkout", { amount: finalAmount, plan: finalId });
      
      // Redirigir a la página de cobro segura de Stripe
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast("Error: No se recibió la URL de Stripe.", "error");
        setLoadingStripe(false);
      }
    } catch (e) {
      showToast("Error de conexión con Stripe.", "error");
      setLoadingStripe(false);
    }
  }

  async function createBankDeposit(event: FormEvent) {
    event.preventDefault();
    if (depositType === "free" && freeAmount < 10) {
      showToast("El monto mínimo de recarga es $10.", "error");
      return;
    }
    if (!receipt) {
      showToast("Debes subir un comprobante.", "error");
      return;
    }
    setLoadingSubmit(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const formData = new FormData();
      formData.append("amount", finalAmount.toString());
      formData.append("planId", finalId);
      formData.append("depositDate", depositDate);
      formData.append("receipt", receipt);
      
      const res = await fetch("/api/deposits/bank", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message ?? "No se pudo enviar el depósito.", "error");
        return;
      }
      await trackEvent("submit_bank_deposit", { amount: finalAmount, plan: finalId });
      showToast("Comprobante subido. Depósito en revisión.", "success");
      setReceipt(null);
      setDepositDate("");
      await loadDeposits();
    } catch (e: any) {
      showToast("Error de conexión al enviar depósito.", "error");
    } finally {
      setLoadingSubmit(false);
    }
  }

  async function loadDeposits() {
    if (!firebaseUser) return;
    try {
      const depositsSnap = await getDocs(
        query(collection(db, "deposits"), where("userId", "==", firebaseUser.uid))
      );
      const loaded = depositsSnap.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
          createdAt: normalizeDate(item.data().createdAt),
        })) as Deposit[];
        
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDeposits(loaded);
    } catch (e) {
      console.error("Error loading deposits:", e);
    } finally {
      setLoadingDeposits(false);
    }
  }

  useEffect(() => {
    void loadDeposits();
  }, [firebaseUser?.uid]);

  // Verificación instantánea de pagos de Stripe al volver de Checkout
  useEffect(() => {
    if (!firebaseUser) return;
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const success = urlParams.get("success");

    if (success === "true" && sessionId) {
      // Limpiar la URL para evitar verificaciones duplicadas al recargar
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const verifyPayment = async () => {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch(`/api/stripe/verify?session_id=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            showToast("¡Pago procesado exitosamente! Tu saldo ha sido actualizado.", "success");
            await loadDeposits();
          }
        } catch (e) {
          console.error("Error verificando pago:", e);
        }
      };
      
      void verifyPayment();
    } else if (urlParams.get("canceled") === "true") {
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast("Cancelaste el proceso de pago.", "error");
    }
  }, [firebaseUser]);

  return (
    <main className="min-h-screen bg-[#020203]">
      <Topbar />
      
      <div className="mx-auto max-w-5xl p-6">
        {/* Planes */}
        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {INVESTMENT_PLANS.map((plan) => (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                selectedPlan.id === plan.id 
                ? "border-teal-500 bg-teal-500/10 shadow-[0_0_15px_rgba(20,184,166,0.2)]" 
                : "border-white/10 bg-zinc-900/50 hover:border-white/30"
              }`}
            >
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(plan.amount)}</p>
              <div className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-teal-400">
                {plan.daily}
              </div>
            </div>
          ))}
        </section>

        {/* Opciones de Pago */}
        <div className="mt-10 mb-6 text-center">
          <h2 className="text-2xl font-semibold text-white">Opciones de Pago</h2>
          <p className="mt-2 text-zinc-400">Estás adquiriendo el <strong className="text-white">{selectedPlan.name}</strong> por <strong className="text-white">{formatCurrency(selectedPlan.amount)}</strong></p>
          
          <div className="mx-auto mt-6 flex max-w-md items-start justify-center gap-3 text-left">
            <input 
              type="checkbox" 
              id="terms" 
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 cursor-pointer rounded border-white/20 bg-zinc-900 accent-teal-500"
            />
            <label htmlFor="terms" className="cursor-pointer text-sm text-zinc-400 select-none">
              He leído y acepto los <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">Términos y Condiciones</a>, incluyendo las políticas de retiros y depósitos mínimos.
            </label>
          </div>
        </div>

        <section className="grid gap-8 lg:grid-cols-2">
          {/* Pago con Tarjeta (Stripe) */}
          <article className={`rounded-[24px] border border-white/10 bg-zinc-900/50 p-8 shadow-xl backdrop-blur-xl transition-opacity ${!acceptedTerms ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
                <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Pago con Tarjeta</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Pago rápido, seguro e inmediato procesado a través de nuestra pasarela de pagos Stripe. Tu inversión se activará automáticamente al confirmarse.
            </p>
            
            <div className="mt-8">
              <button 
                onClick={createStripeDeposit}
                disabled={loadingStripe || !acceptedTerms}
                className="w-full rounded-full bg-indigo-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-transform hover:scale-[1.02] hover:bg-indigo-400 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loadingStripe ? "Procesando..." : `Pagar ${formatCurrency(selectedPlan.amount)} con Tarjeta`}
              </button>
            </div>
          </article>

          {/* Transferencia Bancaria */}
          <article className={`rounded-[24px] border border-white/10 bg-zinc-900/50 p-8 shadow-xl backdrop-blur-xl transition-opacity ${!acceptedTerms ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Transferencia Bancaria</h2>
            </div>
            <p className="mt-4 text-sm text-zinc-400">Transfiere exactamente {formatCurrency(selectedPlan.amount)} a la siguiente cuenta y sube el comprobante:</p>
            
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-white/5 bg-black/20 p-3 flex justify-between">
                <span className="text-xs text-zinc-500">Banco</span>
                <span className="text-sm font-medium text-white">Banco Pichincha</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/20 p-3 flex justify-between">
                <span className="text-xs text-zinc-500">Beneficiario</span>
                <span className="text-sm font-medium text-white">Next Capital Holdings</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/20 p-3 flex justify-between">
                <span className="text-xs text-zinc-500">Cuenta Corriente</span>
                <span className="text-sm font-medium text-white">220044113399</span>
              </div>
            </div>

            <form onSubmit={createBankDeposit} className="mt-6 grid gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Fecha del depósito</label>
                <input 
                  value={depositDate} 
                  onChange={(e) => setDepositDate(e.target.value)} 
                  type="date" 
                  required 
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Comprobante (Imagen o PDF)</label>
                <input 
                  type="file" 
                  accept=".png,.jpg,.jpeg,.pdf" 
                  onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} 
                  required 
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-1 file:text-sm file:text-white hover:file:bg-white/20"
                />
              </div>

              <button 
                disabled={loadingSubmit || !acceptedTerms}
                className="mt-2 w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform hover:scale-[1.02] hover:bg-zinc-100 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loadingSubmit ? "Enviando..." : "Reportar Transferencia"}
              </button>
            </form>
          </article>
        </section>

        {/* Historial */}
        <section className="mt-12 rounded-[24px] border border-white/10 bg-zinc-900/50 p-8">
          <h2 className="text-lg font-semibold text-white">Historial de Inversiones</h2>
          {loadingDeposits ? <p className="mt-4 text-sm text-zinc-400">Cargando...</p> : null}
          {!loadingDeposits && !deposits.length ? (
            <p className="mt-4 text-sm text-zinc-400">Aún no has adquirido ningún plan.</p>
          ) : null}
          
          <div className="mt-6 space-y-3">
            {deposits.map((deposit) => (
              <div key={deposit.id} className="flex flex-wrap items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-sm">
                <span className="text-zinc-300">{new Date(normalizeDate(deposit.createdAt)).toLocaleDateString()}</span>
                <span className="font-medium text-white">{formatCurrency(deposit.amount)}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  deposit.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                  deposit.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {deposit.status === 'pending' ? 'En revisión' : deposit.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
