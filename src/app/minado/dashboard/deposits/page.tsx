'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { trackEvent } from '@/lib/analytics-events';
import { useToast } from '@/components/providers/toast-provider';
import { db } from '@/lib/firebase/client';
import { normalizeDate } from '@/lib/firestore-client';
import { Deposit } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { 
  Zap, 
  Cpu, 
  Layers, 
  Coins, 
  LogOut, 
  ArrowLeft, 
  Activity, 
  CreditCard, 
  Banknote, 
  Calendar, 
  UploadCloud,
  CheckCircle,
  Clock
} from 'lucide-react';

const CLOUD_MINING_PLANS = [
  { id: "NC-S1", name: "Minería Starter (NC-S1)", amount: 149, daily: "0.75% - 1.10% diario", hashrate: "100 TH/s" },
  { id: "NC-P2", name: "Minería Pro (NC-P2)", amount: 329, daily: "0.80% - 1.10% diario", hashrate: "250 TH/s" },
  { id: "NC-I3", name: "Minería Industrial (NC-I3)", amount: 599, daily: "0.85% - 1.10% diario", hashrate: "500 TH/s" },
];

export default function MinadoDepositsPage() {
  const { firebaseUser, appUser, logout } = useAuth();
  const { showToast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState(CLOUD_MINING_PLANS[0]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  
  // Bank transfer inputs
  const [depositDate, setDepositDate] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // URL parsing to auto-select plan
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const planParam = urlParams.get("plan");
      if (planParam) {
        const found = CLOUD_MINING_PLANS.find(p => p.id.toLowerCase() === planParam.toLowerCase());
        if (found) {
          setSelectedPlan(found);
        }
      }
    }
  }, []);

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
        
      // Filter only mining plans
      const miningLoaded = loaded.filter(d => ['NC-S1', 'NC-P2', 'NC-I3'].includes(d.planId ?? ''));
      miningLoaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDeposits(miningLoaded);
    } catch (e) {
      console.error("Error loading mining deposits:", e);
    } finally {
      setLoadingDeposits(false);
    }
  }

  useEffect(() => {
    void loadDeposits();
  }, [firebaseUser?.uid]);

  // Verification of Stripe Payments returning to checkout
  useEffect(() => {
    if (!firebaseUser) return;
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const success = urlParams.get("success");

    if (success === "true" && sessionId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const verifyPayment = async () => {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch(`/api/stripe/verify?session_id=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            showToast("¡Pago de contrato procesado! Tu hardware físico está listo.", "success");
            await loadDeposits();
          }
        } catch (e) {
          console.error("Error verifying payment:", e);
        }
      };
      
      void verifyPayment();
    } else if (urlParams.get("canceled") === "true") {
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast("Cancelaste el proceso de pago.", "error");
    }
  }, [firebaseUser]);

  async function createStripeDeposit() {
    setLoadingStripe(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch("/api/stripe/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: selectedPlan.amount, planId: selectedPlan.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message ?? "No se pudo conectar con Stripe.", "error");
        setLoadingStripe(false);
        return;
      }
      await trackEvent("create_stripe_checkout", { amount: selectedPlan.amount, plan: selectedPlan.id });
      
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
    if (!receipt) {
      showToast("Debes subir un comprobante.", "error");
      return;
    }
    setLoadingSubmit(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const formData = new FormData();
      formData.append("amount", selectedPlan.amount.toString());
      formData.append("planId", selectedPlan.id);
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
      await trackEvent("submit_bank_deposit", { amount: selectedPlan.amount, plan: selectedPlan.id });
      showToast("Comprobante enviado. Plan en revisión.", "success");
      setReceipt(null);
      setDepositDate("");
      await loadDeposits();
    } catch (e: any) {
      showToast("Error de conexión al enviar depósito.", "error");
    } finally {
      setLoadingSubmit(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      showToast('Sesión cerrada.', 'info');
    } catch (err) {
      showToast('Error al cerrar sesión.', 'error');
    }
  }

  return (
    <div className="min-h-screen text-white bg-[#060608] flex flex-col lg:flex-row" style={{ fontFamily: 'var(--font-geist-sans), Inter, sans-serif' }}>
      
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-64 bg-[#09090e] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Zap size={16} className="text-amber-400" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-widest text-white leading-none">Next<span className="text-amber-400">Capital</span></h1>
            <span className="text-[9px] font-bold text-amber-500/80 tracking-widest uppercase">MINING_CONTROL</span>
          </div>
        </div>

        <div className="p-5 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <Cpu size={18} className="text-amber-400" />
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-xs truncate text-white">{appUser?.name || 'Inversor'}</div>
              <div className="font-mono text-[9px] text-slate-500 mt-0.5 truncate">{appUser?.ncId || 'NC-NODE'}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <Link href="/minado/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs tracking-wide transition-all">
            <Activity size={16} />
            TELEMETRÍA ACTIVA
          </Link>
          <Link href="/minado/dashboard/wallet" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs tracking-wide transition-all">
            <Layers size={16} />
            PANEL FINANCIERO
          </Link>
          <Link href="/minado/dashboard/deposits" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/10 font-medium text-xs tracking-wide">
            <Coins size={16} />
            ADQUIRIR HASHRATE
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link href="/minado" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all border border-white/5">
            <ArrowLeft size={12} /> Volver a Landing
          </Link>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 transition-all border border-red-500/10">
            <LogOut size={12} /> CERRAR SESIÓN
          </button>
        </div>
      </aside>

      {/* Main Deposits Canvas */}
      <main className="flex-1 flex flex-col min-h-0 bg-[#060608] overflow-y-auto">
        <header className="px-8 py-5 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#09090e]/50 backdrop-blur-md sticky top-0 z-30">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-500 tracking-wider">CORE_MINING_OS // CONTRATOS</span>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">Adquirir Hashrate ASIC</h2>
          </div>
          <Link 
            href="/minado/dashboard" 
            className="py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
          >
            Volver a Telemetría
          </Link>
        </header>

        <div className="p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* Cloud Mining Plans Grid */}
          <section className="space-y-4">
            <h3 className="text-sm font-mono font-bold text-slate-400 uppercase tracking-widest">— 1. Elige tu plan de hashrate</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {CLOUD_MINING_PLANS.map((plan) => (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`cursor-pointer rounded-2xl border p-6 transition-all relative ${
                    selectedPlan.id === plan.id 
                    ? "border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]" 
                    : "border-white/10 bg-[#0d0d14] hover:border-white/20"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-base font-black text-white">{plan.name}</h4>
                    <span className="text-xs text-amber-400 font-mono font-bold">{plan.hashrate}</span>
                  </div>
                  <p className="text-3xl font-black text-white mt-4">{formatCurrency(plan.amount)}</p>
                  <div className="mt-4 inline-block rounded bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-slate-300 font-mono">
                    {plan.daily}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Compliance Terms Checkbox */}
          <div className="text-center bg-[#0d0d14] border border-white/5 rounded-2xl p-6 max-w-3xl mx-auto space-y-4">
            <h4 className="text-base font-black text-white">Completar Adquisición de {selectedPlan.name}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Estás provisionando hardware físico real por un valor de <strong className="text-white">{formatCurrency(selectedPlan.amount)}</strong>.
            </p>
            
            <div className="flex max-w-md items-start justify-center gap-3 text-left mx-auto">
              <input 
                type="checkbox" 
                id="terms" 
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-white/20 bg-zinc-900 accent-amber-500"
              />
              <label htmlFor="terms" className="cursor-pointer text-xs text-slate-400 select-none">
                He leído y acepto los <Link href="/terms" target="_blank" className="text-amber-500 hover:underline">Términos y Condiciones</Link> del contrato de hashrate físico y las políticas de retiros de NextCapital Mining.
              </label>
            </div>
          </div>

          {/* Payment Methods */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all ${!acceptedTerms ? 'opacity-40 pointer-events-none' : ''}`}>
            
            {/* Stripe card */}
            <article className="rounded-2xl border border-white/5 bg-[#0d0d14] p-6 lg:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <CreditCard size={18} className="text-amber-500" />
                  </div>
                  <h3 className="text-lg font-black text-white">Pago con Tarjeta Segura</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Paga tu contrato de forma inmediata y automática a través de Stripe Checkout. Tu hardware físico se provisionará en el clúster de minado de manera instantánea tras confirmarse la transacción.
                </p>
              </div>

              <div className="pt-6">
                <button 
                  onClick={createStripeDeposit}
                  disabled={loadingStripe || !acceptedTerms}
                  className="w-full py-4 rounded-xl font-bold text-xs bg-amber-500 text-black hover:opacity-95 disabled:opacity-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                >
                  {loadingStripe ? "Conectando con Stripe..." : `Pagar ${formatCurrency(selectedPlan.amount)} con Tarjeta`}
                </button>
              </div>
            </article>

            {/* Bank Transfer */}
            <article className="rounded-2xl border border-white/5 bg-[#0d0d14] p-6 lg:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Banknote size={18} className="text-amber-500" />
                </div>
                <h3 className="text-lg font-black text-white">Transferencia Bancaria</h3>
              </div>
              
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span className="text-slate-500">Banco</span><span className="text-white font-bold">Banco Pichincha</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Beneficiario</span><span className="text-white font-bold">Next Capital Holdings</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Cuenta Corriente</span><span className="text-white font-bold">220044113399</span></div>
              </div>

              <form onSubmit={createBankDeposit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-2">Fecha del depósito</label>
                    <input 
                      type="date"
                      required
                      value={depositDate}
                      onChange={(e) => setDepositDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-2">Comprobante de Pago</label>
                    <input 
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      required
                      onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs text-slate-400 outline-none file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white hover:file:bg-white/20"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                </div>

                <button 
                  disabled={loadingSubmit || !acceptedTerms}
                  className="w-full py-4 rounded-xl font-bold text-xs bg-white text-black hover:bg-zinc-100 disabled:opacity-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  {loadingSubmit ? "Enviando..." : "Reportar Transferencia"}
                </button>
              </form>
            </article>

          </div>

          {/* Deposit Logs */}
          <section className="rounded-2xl border border-white/5 bg-[#0d0d14] p-6 lg:p-8">
            <h3 className="text-lg font-black text-white mb-6 border-b border-white/5 pb-4">Tus Contratos en Proceso de Activación</h3>
            
            {loadingDeposits ? (
              <p className="text-xs text-slate-500 font-mono">Cargando tus contratos...</p>
            ) : !deposits.length ? (
              <div className="flex flex-col items-center justify-center text-center py-8 text-slate-500 font-mono">
                <Clock size={24} className="mb-2" />
                <p className="text-xs">No has solicitado ningún contrato de hashrate todavía.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deposits.map((dep) => (
                  <div key={dep.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(normalizeDate(dep.createdAt)).toLocaleDateString()}
                      </span>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        ASIC Contract: <span className="text-amber-500">{dep.planId}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-xs font-mono font-bold text-white">{formatCurrency(dep.amount)}</div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        dep.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        dep.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {dep.status === 'pending' ? 'En revisión' : dep.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

    </div>
  );
}
