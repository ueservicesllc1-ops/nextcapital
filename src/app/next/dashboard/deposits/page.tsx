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
import { Smartphone, CheckCircle } from "lucide-react";

const INVESTMENT_PLANS = [
  { id: "inicio", name: "Plan Inicio", amount: 100, daily: "2% diario" },
  { id: "plata", name: "Plan Plata", amount: 500, daily: "2.5% diario" },
  { id: "oro", name: "Plan Oro", amount: 1000, daily: "3% diario" },
  { id: "platinium", name: "Plan Platinium", amount: 2000, daily: "3.5% diario" },
  { id: "abierto", name: "Plan Abierto", amount: 100, daily: "1.5% - 3% diario" },
];

export default function DepositsPage() {
  const { firebaseUser, appUser } = useAuth();
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(INVESTMENT_PLANS[0]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [depositType, setDepositType] = useState<"plan" | "free">("plan");
  const [freeAmount, setFreeAmount] = useState<number>(10);
  const [customOpenAmount, setCustomOpenAmount] = useState<number>(100);

  const [payphonePhone, setPayphonePhone] = useState("");
  const [payphoneSuccess, setPayphoneSuccess] = useState(false);
  const [loadingPayphone, setLoadingPayphone] = useState(false);

  const finalAmount = selectedPlan.id === "abierto" ? customOpenAmount : (depositType === "plan" ? selectedPlan.amount : freeAmount);
  const finalId = depositType === "plan" ? selectedPlan.id : "wallet_topup";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const planParam = urlParams.get("plan");
      if (planParam) {
        const found = INVESTMENT_PLANS.find(p => p.id.toLowerCase() === planParam.toLowerCase());
        if (found) {
          setSelectedPlan(found);
        }
      }
    }
  }, []);

  async function createStripeDeposit() {
    if (depositType === "free" && freeAmount < 10) {
      showToast("El monto mínimo de recarga es $10.", "error");
      return;
    }
    if (selectedPlan.id === "abierto" && customOpenAmount < 10) {
      showToast("El monto mínimo para el Plan Abierto es $10.", "error");
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

  async function createPayphoneDeposit() {
    if (!payphonePhone || payphonePhone.replace(/\D/g,'').length < 7) {
      showToast('Ingresa un número de teléfono válido registrado en PayPhone.', 'error');
      return;
    }
    if (selectedPlan.id === "abierto" && customOpenAmount < 10) {
      showToast("El monto mínimo para el Plan Abierto es $10.", "error");
      return;
    }
    setLoadingPayphone(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch('/api/payphone/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: finalAmount,
          planId: finalId,
          phoneNumber: payphonePhone,
          userId: firebaseUser?.uid,
          userName: appUser?.name ?? '',
          userEmail: firebaseUser?.email ?? '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message ?? 'Error al enviar la solicitud a PayPhone.', 'error');
        return;
      }
      setPayphoneSuccess(true);
      showToast('¡Solicitud enviada! Revisa tu app PayPhone para confirmar el pago.', 'success');
    } catch (e) {
      showToast('Error de conexión con PayPhone.', 'error');
    } finally {
      setLoadingPayphone(false);
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
        {/* Planes Estándar */}
        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {INVESTMENT_PLANS.filter(p => p.id !== "abierto").map((plan) => (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                selectedPlan.id === plan.id 
                ? "border-teal-500 bg-teal-500/10 shadow-[0_0_15px_rgba(20,184,166,0.2)]" 
                : "border-white/10 bg-zinc-900/50 hover:border-white/30"
              }`}
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-2 text-3xl font-bold text-white">{formatCurrency(plan.amount)}</p>
              </div>
              <div className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-teal-400 self-start">
                {plan.daily}
              </div>
            </div>
          ))}
        </section>

        {/* Plan Abierto (Grande y Destacado abajo) */}
        {(() => {
          const planAbierto = INVESTMENT_PLANS.find(p => p.id === "abierto")!;
          const isSelected = selectedPlan.id === "abierto";
          return (
            <div 
              onClick={() => setSelectedPlan(planAbierto)}
              className={`mt-6 cursor-pointer rounded-3xl border p-6 sm:p-8 transition-all relative overflow-hidden group ${
                isSelected 
                ? "border-teal-400 bg-teal-500/10 shadow-[0_0_25px_rgba(20,184,166,0.25)]" 
                : "border-white/10 bg-zinc-900/40 hover:border-teal-500/40 hover:bg-zinc-900/60"
              }`}
            >
              {/* Subtle background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 opacity-50 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-500/15 border border-teal-500/35 text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest">PLAN RECOMENDADO</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{planAbierto.name}</h3>
                  <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                    ¿Quieres invertir una cantidad diferente? El Plan Abierto te permite depositar la cantidad que desees (desde $10 USD) y obtener un rendimiento diario variable y optimizado entre 1.5% y 3%.
                  </p>
                </div>
                
                <div className="flex flex-col items-start md:items-end justify-between gap-3 flex-shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase">MONTO DE INVERSIÓN</span>
                    <span className="text-3xl font-black text-white tracking-tight">Personalizado</span>
                  </div>
                  <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 px-4 py-2 text-sm font-semibold text-teal-400 font-mono">
                    {planAbierto.daily}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Opciones de Pago */}
        <div className="mt-10 mb-6 text-center">
          <h2 className="text-2xl font-semibold text-white">Opciones de Pago</h2>
          {selectedPlan.id === "abierto" ? (
            <div className="mt-4 max-w-sm w-full p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2 mx-auto">
              <label className="block text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">Monto a Depositar (USD)</label>
              <input
                type="number"
                min="10"
                value={customOpenAmount}
                onChange={(e) => setCustomOpenAmount(Math.max(0, Number(e.target.value)))}
                className="w-full text-center px-4 py-2.5 rounded-xl bg-black/60 border border-teal-500/40 text-white text-xl font-bold focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
              <p className="text-[10px] text-zinc-500">Monto mínimo: $10.00 USD</p>
            </div>
          ) : (
            <p className="mt-2 text-zinc-400">Estás adquiriendo el <strong className="text-white">{selectedPlan.name}</strong> por <strong className="text-white">{formatCurrency(selectedPlan.amount)}</strong></p>
          )}
          
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
                {loadingStripe ? "Procesando..." : `Pagar ${formatCurrency(finalAmount)} con Tarjeta`}
              </button>
            </div>
          </article>

          {/* PayPhone Ecuador */}
          <article className={`rounded-[24px] border border-emerald-500/20 bg-zinc-900/50 p-8 shadow-xl backdrop-blur-xl transition-all flex flex-col justify-between ${!acceptedTerms ? 'opacity-50 grayscale pointer-events-none' : ''}`} style={{ background: 'linear-gradient(160deg, rgba(16,185,129,0.04) 0%, rgba(24,24,27,0.5) 70%)' }}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Smartphone size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">PayPhone Ecuador</h2>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-wider">🇪🇨 Pago local instantáneo</span>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Paga directamente desde tu app PayPhone. Ingresa tu número de teléfono registrado y recibirás una notificación de cobro al instante. Acepta tarjetas Visa, Mastercard, Diners y saldo PayPhone.
              </p>

              {payphoneSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-400">¡Solicitud enviada exitosamente!</p>
                  <p className="text-xs text-zinc-400 mt-1">Revisa tu app PayPhone y acepta el cobro de <strong className="text-white">{formatCurrency(finalAmount)}</strong></p>
                  <p className="text-[10px] text-zinc-500 mt-2 font-mono">El estado de tu depósito se actualizará automáticamente una vez confirmado.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-400 uppercase mb-2">Número PayPhone (Ecuador)</label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-zinc-400 text-sm font-mono flex-shrink-0">
                        🇪🇨 +593
                      </div>
                      <input
                        type="tel"
                        placeholder="098 411 1222"
                        value={payphonePhone}
                        onChange={e => setPayphonePhone(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-mono bg-white/5 border border-white/10"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 font-mono">Número registrado en tu cuenta PayPhone Personal</p>
                  </div>
                </div>
              )}
            </div>

            {!payphoneSuccess && (
              <div className="pt-6">
                <button
                  onClick={createPayphoneDeposit}
                  disabled={loadingPayphone || !acceptedTerms || !payphonePhone}
                  className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 px-4 py-4 text-sm font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone size={14} />
                  {loadingPayphone ? 'Enviando...' : `Pagar ${formatCurrency(finalAmount)} con PayPhone`}
                </button>
              </div>
            )}
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
