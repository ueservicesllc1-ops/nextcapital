"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { useAuth } from "@/components/providers/auth-provider";
import { getInvestorData } from "@/lib/data";
import { Balance, Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function WalletPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Modals State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  // Deposit State
  const [depositAmount, setDepositAmount] = useState<number>(10);
  const [loadingStripe, setLoadingStripe] = useState(false);

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawFields, setWithdrawFields] = useState({
    fullName: "",
    bankName: "",
    accountType: "Ahorros",
    accountNumber: ""
  });
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);

  async function load() {
    if (!firebaseUser) return;
    try {
      const data = await getInvestorData(firebaseUser.uid);
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch (err: any) {
      console.error("Wallet error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [firebaseUser]);

  // Verificación de Pago Stripe al volver a la página
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
            showToast("¡Recarga exitosa! Tu saldo se ha actualizado.", "success");
            await load();
          }
        } catch (e) {
          console.error("Error verificando pago:", e);
        }
      };
      void verifyPayment();
    } else if (urlParams.get("canceled") === "true") {
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast("El proceso de pago fue cancelado.", "error");
    }
  }, [firebaseUser]);

  async function handleStripeDeposit() {
    if (depositAmount < 10) {
      showToast("El monto mínimo de depósito es $10.", "error");
      return;
    }
    setLoadingStripe(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch("/api/stripe/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: depositAmount, planId: "wallet_topup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message ?? "Error al conectar con la pasarela.", "error");
        setLoadingStripe(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast("No se pudo generar el enlace de pago.", "error");
        setLoadingStripe(false);
      }
    } catch (e) {
      showToast("Error de red. Intenta de nuevo.", "error");
      setLoadingStripe(false);
    }
  }

  async function handleWithdrawal() {
    if (!balance || withdrawAmount <= 0) return;
    if (withdrawAmount > balance.currentBalance) {
      showToast("Saldo insuficiente para este retiro.", "error");
      return;
    }
    
    const { fullName, bankName, accountNumber } = withdrawFields;
    if (!fullName || !bankName || !accountNumber) {
      showToast("Por favor, completa todos los campos del formulario.", "error");
      return;
    }

    setLoadingWithdraw(true);
    try {
      const bankInfoString = `${fullName} | ${bankName} | ${withdrawFields.accountType} | #${accountNumber}`;
      
      await addDoc(collection(db, "withdrawals"), {
        userId: firebaseUser?.uid,
        amount: withdrawAmount,
        bankAccount: bankInfoString,
        details: withdrawFields,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "transactions"), {
        userId: firebaseUser?.uid,
        type: "withdrawal",
        amount: withdrawAmount,
        status: "pending",
        description: `Retiro solicitado a ${bankName}`,
        createdAt: serverTimestamp(),
      });

      showToast("Solicitud enviada. Tardará de 24 a 48 horas (frecuentemente el mismo día).", "success");
      setShowWithdrawModal(false);
      setWithdrawAmount(0);
      setWithdrawFields({ fullName: "", bankName: "", accountType: "Ahorros", accountNumber: "" });
      await load();
    } catch (e) {
      showToast("Error al procesar la solicitud. Intenta de nuevo.", "error");
    } finally {
      setLoadingWithdraw(false);
    }
  }

  if (loading || !balance) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#020203]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <p className="text-zinc-500 animate-pulse uppercase tracking-[0.2em] text-[10px] font-bold">Sincronizando Billetera...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#020203] text-zinc-300">
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-[40rem] w-[40rem] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Topbar balance={balance.currentBalance} />

        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-2xl">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h1 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Balance Total Disponible</h1>
              <p className="mt-2 text-5xl font-black tracking-tight text-white md:text-6xl">
                {formatCurrency(balance.currentBalance)}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.03] bg-white/[0.02] p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Depositado</p>
                <p className="mt-1 text-xl font-bold text-zinc-300">{formatCurrency(balance.totalDeposited)}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.03] bg-white/[0.02] p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ganancias Netas</p>
                <p className="mt-1 text-xl font-bold text-emerald-400">{formatCurrency(balance.totalProfit)}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button 
                onClick={() => setShowDepositModal(true)}
                className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-black transition-all hover:bg-zinc-200 active:scale-[0.98]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Depositar / Recargar
              </button>
              <button 
                onClick={() => setShowWithdrawModal(true)}
                className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Retirar Fondos
              </button>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="mb-6 px-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Historial de Movimientos</h2>
            <div className="space-y-3">
              {!transactions.length && (
                <div className="rounded-3xl border border-white/[0.03] bg-zinc-900/20 p-12 text-center">
                  <p className="text-sm text-zinc-600 italic">No hay movimientos recientes.</p>
                </div>
              )}
              {transactions.slice(0, 10).map((trx) => (
                <div 
                  key={trx.id}
                  className="group flex items-center justify-between rounded-[24px] border border-white/[0.03] bg-zinc-900/40 px-6 py-4 transition-all hover:border-white/10 hover:bg-zinc-900/60"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      trx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 
                      trx.type === 'withdrawal' ? 'bg-rose-500/10 text-rose-500' : 'bg-cyan-500/10 text-cyan-500'
                    }`}>
                      {trx.type === 'deposit' ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
                      ) : trx.type === 'withdrawal' ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white capitalize">{trx.type === 'profit' ? 'Rendimiento' : trx.type}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{new Date(trx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      trx.type === 'deposit' || trx.type === 'profit' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {trx.type === 'deposit' || trx.type === 'profit' ? '+' : '-'}{formatCurrency(trx.amount)}
                    </p>
                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">{trx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !loadingStripe && setShowDepositModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-zinc-900 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Recargar Billetera</h2>
              <button onClick={() => setShowDepositModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Monto a depositar (USD)</label>
                <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-black px-5 py-5 focus-within:border-cyan-500/50 transition-all">
                  <span className="text-3xl font-black text-zinc-500 mr-3">$</span>
                  <input type="number" min="10" autoFocus value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} className="flex-1 bg-transparent text-3xl font-black text-white outline-none" />
                </div>
                <p className="mt-3 text-xs text-zinc-500 italic">Mínimo: $10.00 USD.</p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 text-xs text-zinc-400 leading-relaxed border border-white/[0.05]">
                Serás redirigido a Stripe para completar tu transacción. Tu saldo se actualizará automáticamente.
              </div>

              <button onClick={handleStripeDeposit} disabled={loadingStripe || depositAmount < 10} className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 py-5 text-sm font-black text-white shadow-lg shadow-cyan-900/40 transition-all hover:from-cyan-500 hover:to-blue-600 active:scale-[0.98] disabled:opacity-50 disabled:grayscale">
                {loadingStripe ? "Procesando..." : `Pagar ${formatCurrency(depositAmount)} ahora`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !loadingWithdraw && setShowWithdrawModal(false)} />
          <div className="relative w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-[32px] border border-white/10 bg-zinc-900 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Retirar Fondos</h2>
              <button onClick={() => setShowWithdrawModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Monto a retirar (USD)</label>
                <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-black px-5 py-4 focus-within:border-rose-500/50 transition-all">
                  <span className="text-2xl font-black text-zinc-500 mr-3">$</span>
                  <input type="number" autoFocus value={withdrawAmount} onChange={(e) => setWithdrawAmount(Number(e.target.value))} className="flex-1 bg-transparent text-2xl font-black text-white outline-none" />
                </div>
                <p className="mt-2 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Disponible: {formatCurrency(balance?.currentBalance || 0)}</p>
              </div>

              <div className="grid gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nombre Completo del Titular</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Juan Pérez"
                    value={withdrawFields.fullName}
                    onChange={(e) => setWithdrawFields({...withdrawFields, fullName: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-rose-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Banco</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Pichincha"
                      value={withdrawFields.bankName}
                      onChange={(e) => setWithdrawFields({...withdrawFields, bankName: e.target.value})}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-rose-500/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tipo de Cuenta</label>
                    <select 
                      value={withdrawFields.accountType}
                      onChange={(e) => setWithdrawFields({...withdrawFields, accountType: e.target.value})}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-rose-500/50 appearance-none"
                    >
                      <option value="Ahorros">Ahorros</option>
                      <option value="Corriente">Corriente</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Número de Cuenta</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 2200XXXXXX"
                    value={withdrawFields.accountNumber}
                    onChange={(e) => setWithdrawFields({...withdrawFields, accountNumber: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-rose-500/50"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 text-xs text-zinc-400 leading-relaxed border border-white/[0.05]">
                Periodo estimado: **24 a 48 horas** (frecuentemente el mismo día).
              </div>

              <button 
                onClick={handleWithdrawal}
                disabled={loadingWithdraw || withdrawAmount <= 0 || withdrawAmount > (balance?.currentBalance || 0)}
                className="w-full rounded-2xl bg-white py-5 text-sm font-black text-black shadow-lg transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                {loadingWithdraw ? "Procesando..." : `Solicitar Retiro de ${formatCurrency(withdrawAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
