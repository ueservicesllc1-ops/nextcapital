"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { db, storage } from "@/lib/firebase/client";
import { collection, addDoc, serverTimestamp, doc, onSnapshot, query, where, orderBy, deleteDoc, setDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { formatCurrency } from "@/lib/utils";

type WalletView = "overview" | "deposit" | "withdraw" | "history" | "accounts";
type DepositMethod = "stripe" | "bank";

export default function TradingWalletPage() {
  const { firebaseUser, appUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<WalletView>("overview");
  
  // Data State
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  
  // Form States
  const [depositMethod, setDepositMethod] = useState<DepositMethod>("stripe");
  const [depositAmount, setDepositAmount] = useState<number>(10);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingBank, setLoadingBank] = useState(false);
  
  // Manual Deposit States
  const [userNcId, setUserNcId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawFields, setWithdrawFields] = useState({
    fullName: "",
    bankName: "",
    accountType: "Ahorros",
    accountNumber: ""
  });
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;

    // Balance Sync & Self-Healing
    const unsubBalance = onSnapshot(doc(db, "trading_balances", firebaseUser.uid), async (snap) => {
      let currentStored = snap.exists() ? snap.data().currentBalance || 0 : 0;
      
      // Recalcular balance real para auto-sanación (Manual + Stripe)
      const depSnap = await getDocs(query(collection(db, "trading_deposits"), where("userId", "==", firebaseUser.uid), where("status", "==", "approved")));
      const totalManualDep = depSnap.docs.reduce((acc, d) => acc + (d.data().amount || 0), 0);
      
      const stripeDepSnap = await getDocs(query(collection(db, "deposits"), where("userId", "==", firebaseUser.uid), where("status", "==", "approved")));
      const totalStripeDep = stripeDepSnap.docs.reduce((acc, d) => {
        const data = d.data();
        const isTrading = data.planId === "trading_wallet_topup" || data.planId === "wallet_topup";
        return isTrading ? acc + (data.amount || 0) : acc;
      }, 0);
      
      const wdSnap = await getDocs(query(collection(db, "trading_withdrawals"), where("userId", "==", firebaseUser.uid), where("status", "==", "approved")));
      const totalWd = wdSnap.docs.reduce((acc, w) => acc + (w.data().amount || 0), 0);
      
      const calculatedBalance = totalManualDep + totalStripeDep - totalWd;

      if (calculatedBalance !== currentStored) {
        await setDoc(doc(db, "trading_balances", firebaseUser.uid), {
          userId: firebaseUser.uid,
          currentBalance: calculatedBalance,
          updatedAt: serverTimestamp()
        }, { merge: true });
        setBalance(calculatedBalance);
      } else {
        setBalance(currentStored);
      }
      setLoading(false);
    });

    // Transactions Sync
    const qTrx = query(
      collection(db, "trading_transactions"), 
      where("userId", "==", firebaseUser.uid),
      orderBy("createdAt", "desc")
    );
    const unsubTrx = onSnapshot(qTrx, (snap) => {
      const loaded: any[] = [];
      snap.forEach(d => loaded.push({ id: d.id, ...d.data() }));
      setTransactions(loaded);
    });

    // Bank Accounts Sync
    const qAcc = query(collection(db, "trading_bank_accounts"), where("userId", "==", firebaseUser.uid));
    const unsubAcc = onSnapshot(qAcc, (snap) => {
      const loaded: any[] = [];
      snap.forEach(d => loaded.push({ id: d.id, ...d.data() }));
      setBankAccounts(loaded);
    });

    return () => {
      unsubBalance();
      unsubTrx();
      unsubAcc();
    };
  }, [firebaseUser]);

  async function handleStripeDeposit() {
    if (depositAmount < 10) {
      showToast("Monto mínimo $10.", "error");
      return;
    }
    setLoadingStripe(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const res = await fetch("/api/stripe/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: depositAmount, planId: "trading_wallet_topup" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showToast("Error al generar pago.", "error");
    } catch (e) {
      showToast("Error de red.", "error");
    } finally {
      setLoadingStripe(false);
    }
  }

  async function handleBankDeposit() {
    if (depositAmount < 10) {
      showToast("Monto mínimo $10.", "error");
      return;
    }
    if (!userNcId || userNcId !== appUser?.ncId) {
      showToast("El ID de usuario es incorrecto.", "error");
      return;
    }
    if (!receiptFile) {
      showToast("Debes subir la papeleta de depósito.", "error");
      return;
    }

    setLoadingBank(true);
    try {
      // 1. Subir Papeleta a Storage
      const storageRef = ref(storage, `receipts/${firebaseUser?.uid}/${Date.now()}_${receiptFile.name}`);
      const uploadResult = await uploadBytes(storageRef, receiptFile);
      const fileUrl = await getDownloadURL(uploadResult.ref);

      // 2. Guardar solicitud en Firestore
      await addDoc(collection(db, "trading_deposits"), {
        userId: firebaseUser?.uid,
        ncId: userNcId,
        amount: depositAmount,
        method: "bank",
        status: "pending",
        receiptUrl: fileUrl,
        createdAt: serverTimestamp(),
      });

      // 3. Crear transacción pendiente
      await addDoc(collection(db, "trading_transactions"), {
        userId: firebaseUser?.uid,
        type: "deposit",
        amount: depositAmount,
        status: "pending",
        description: `Depósito bancario NC (${userNcId})`,
        createdAt: serverTimestamp(),
      });

      showToast("Comprobante enviado. Revisaremos tu depósito.", "success");
      setDepositAmount(10);
      setUserNcId("");
      setReceiptFile(null);
      setActiveView("history");
    } catch (e: any) {
      console.error("Error en depósito:", e);
      showToast(`Error: ${e.message}`, "error");
    } finally {
      setLoadingBank(false);
    }
  }

  async function saveAccount() {
    if (!firebaseUser) return;
    if (!withdrawFields.fullName || !withdrawFields.bankName || !withdrawFields.accountNumber) {
      showToast("Completa todos los campos.", "error");
      return;
    }
    setLoadingAccount(true);
    try {
      await addDoc(collection(db, "trading_bank_accounts"), {
        ...withdrawFields,
        userId: firebaseUser.uid,
        createdAt: serverTimestamp(),
      });
      showToast("Cuenta guardada correctamente.", "success");
      setWithdrawFields({ fullName: "", bankName: "", accountType: "Ahorros", accountNumber: "" });
    } catch (e: any) {
      showToast("Error de permisos al guardar.", "error");
    } finally {
      setLoadingAccount(false);
    }
  }

  async function deleteAccount(id: string) {
    try {
      await deleteDoc(doc(db, "trading_bank_accounts", id));
      showToast("Cuenta eliminada.", "success");
    } catch (e) {
      showToast("Error al eliminar.", "error");
    }
  }

  async function handleWithdrawal() {
    if (withdrawAmount <= 0 || withdrawAmount > balance) {
      showToast("Fondos insuficientes.", "error");
      return;
    }

    let finalFields = withdrawFields;
    if (selectedAccountId) {
      const acc = bankAccounts.find(a => a.id === selectedAccountId);
      if (acc) finalFields = { ...acc };
    }

    if (!finalFields.fullName || !finalFields.bankName || !finalFields.accountNumber) {
      showToast("Selecciona una cuenta.", "error");
      return;
    }

    setLoadingWithdraw(true);
    try {
      const bankInfoString = `${finalFields.fullName} | ${finalFields.bankName} | ${finalFields.accountType} | #${finalFields.accountNumber}`;
      await addDoc(collection(db, "trading_withdrawals"), {
        userId: firebaseUser?.uid,
        amount: withdrawAmount,
        bankAccount: bankInfoString,
        details: finalFields,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, "trading_transactions"), {
        userId: firebaseUser?.uid,
        type: "withdrawal",
        amount: withdrawAmount,
        status: "pending",
        description: `Retiro a ${finalFields.bankName}`,
        createdAt: serverTimestamp(),
      });
      showToast("Solicitud enviada exitosamente.", "success");
      setWithdrawAmount(0);
      setActiveView("history");
    } catch (e) {
      showToast("Error al procesar retiro.", "error");
    } finally {
      setLoadingWithdraw(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#020203]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#020203] text-zinc-300">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-[#050507] p-6 flex flex-col fixed h-screen z-50">
        <Link href="/trading" className="mb-10 flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <span className="font-bold text-white tracking-tight">Trading Wallet</span>
        </Link>

        <div className="mb-8 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Mi ID de Usuario</p>
          <p className="text-lg font-black text-cyan-400 font-mono mt-1">{appUser?.ncId || "Asignando..."}</p>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem active={activeView === "overview"} onClick={() => setActiveView("overview")} label="Saldos" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />
          <SidebarItem active={activeView === "deposit"} onClick={() => setActiveView("deposit")} label="Depósitos" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>} />
          <SidebarItem active={activeView === "withdraw"} onClick={() => setActiveView("withdraw")} label="Retiros" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>} />
          <SidebarItem active={activeView === "history"} onClick={() => setActiveView("history")} label="Movimientos" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <SidebarItem active={activeView === "accounts"} onClick={() => setActiveView("accounts")} label="Mis Cuentas" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
        </nav>

        <Link href="/trading" className="mt-auto group flex items-center gap-3 px-4 py-3 text-sm text-zinc-500 hover:text-white transition-colors">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          Regresar
        </Link>
      </aside>

      {/* CONTENT AREA */}
      <section className="flex-1 ml-64 p-10 overflow-y-auto relative">
        <div className="pointer-events-none absolute inset-0 flex justify-center">
          <div className="h-[40rem] w-[40rem] rounded-full bg-cyan-500/[0.03] blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl">
          {activeView === "overview" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">Resumen de Billetera</h2>
              <div className="rounded-[40px] border border-white/10 bg-zinc-900/40 p-10 backdrop-blur-3xl shadow-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 text-center">Balance Real de Trading</p>
                <h3 className="mt-4 text-6xl font-black text-white text-center tracking-tighter">{formatCurrency(balance)}</h3>
                <div className="mt-12 flex gap-3">
                  <button onClick={() => setActiveView("deposit")} className="flex-1 rounded-2xl bg-white py-4 text-sm font-bold text-black hover:bg-zinc-200 transition-colors">Depositar</button>
                  <button onClick={() => setActiveView("withdraw")} className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold text-white hover:bg-white/10 transition-colors">Retirar</button>
                </div>
              </div>
            </div>
          )}

          {activeView === "deposit" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">Recargar Saldo Real</h2>
              <div className="rounded-[40px] border border-white/10 bg-zinc-900/40 p-10 backdrop-blur-3xl">
                
                <div className="flex p-1 bg-black/40 rounded-2xl mb-8 border border-white/5">
                  <button onClick={() => setDepositMethod("stripe")} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${depositMethod === 'stripe' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Tarjeta / Stripe</button>
                  <button onClick={() => setDepositMethod("bank")} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${depositMethod === 'bank' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Transferencia</button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Monto USD</label>
                    <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-black/40 px-6 py-6 focus-within:border-cyan-500/50 transition-all">
                      <span className="text-4xl font-black text-zinc-600 mr-4">$</span>
                      <input type="number" min="10" autoFocus value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} className="flex-1 bg-transparent text-4xl font-black text-white outline-none" />
                    </div>
                  </div>

                  {depositMethod === "stripe" ? (
                    <button onClick={handleStripeDeposit} disabled={loadingStripe || depositAmount < 10} className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 py-6 text-sm font-black text-white shadow-xl shadow-cyan-900/40 transition-all hover:scale-[1.01] active:scale-[0.98]">
                      {loadingStripe ? "Conectando..." : `Pagar con Tarjeta (${formatCurrency(depositAmount)})`}
                    </button>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-sm space-y-4">
                        <p className="text-zinc-400 font-medium">Realiza tu transferencia a:</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-zinc-500 uppercase font-bold text-[9px]">Banco</p>
                            <p className="text-white">Next Capital Bank</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 uppercase font-bold text-[9px]">Tipo</p>
                            <p className="text-white">Corriente</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-zinc-500 uppercase font-bold text-[9px]">Nº Cuenta</p>
                            <p className="text-cyan-400 font-mono text-base">0987654321</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Confirma tu ID de Usuario</label>
                          <input type="text" placeholder="Ej: NC07515" value={userNcId} onChange={(e) => setUserNcId(e.target.value.toUpperCase())} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none focus:border-cyan-500/50" />
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Subir Papeleta / Comprobante</label>
                          <input type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="mt-2 w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
                        </div>
                      </div>

                      <button onClick={handleBankDeposit} disabled={loadingBank || depositAmount < 10} className="w-full rounded-2xl bg-white py-6 text-sm font-black text-black shadow-xl transition-all hover:scale-[1.01] active:scale-[0.98]">
                        {loadingBank ? "Subiendo Comprobante..." : "Enviar para Validación"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === "withdraw" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">Solicitar Retiro</h2>
              <div className="rounded-[40px] border border-white/10 bg-zinc-900/40 p-10 backdrop-blur-3xl">
                <div className="mb-8">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Monto a retirar</label>
                  <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-black/40 px-6 py-4 focus-within:border-rose-500/50 transition-all">
                    <span className="text-3xl font-black text-zinc-600 mr-4">$</span>
                    <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(Number(e.target.value))} className="flex-1 bg-transparent text-3xl font-black text-white outline-none" />
                  </div>
                  <p className="mt-2 text-[10px] font-bold flex justify-between">
                    <span className="text-zinc-500 uppercase">Disponible: {formatCurrency(balance)}</span>
                    {withdrawAmount > balance && <span className="text-rose-500 uppercase animate-pulse">¡Fondos insuficientes!</span>}
                  </p>
                </div>

                {bankAccounts.length > 0 && (
                  <div className="mb-8">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Selecciona una cuenta guardada</label>
                    <div className="grid gap-2">
                      <button onClick={() => setSelectedAccountId("")} className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${!selectedAccountId ? 'border-rose-500/50 bg-rose-500/5 text-white' : 'border-white/5 bg-white/5 text-zinc-500 hover:border-white/10'}`}>Nueva cuenta</button>
                      {bankAccounts.map(acc => (
                        <button key={acc.id} onClick={() => setSelectedAccountId(acc.id)} className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${selectedAccountId === acc.id ? 'border-rose-500/50 bg-rose-500/5 text-white' : 'border-white/5 bg-white/5 text-zinc-500 hover:border-white/10'}`}>
                          <p className="font-bold">{acc.bankName} - {acc.accountType}</p>
                          <p className="text-[10px] opacity-60">#{acc.accountNumber} - {acc.fullName}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedAccountId && (
                  <div className="grid gap-4 mb-8">
                    <input type="text" placeholder="Titular" value={withdrawFields.fullName} onChange={(e) => setWithdrawFields({...withdrawFields, fullName: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Banco" value={withdrawFields.bankName} onChange={(e) => setWithdrawFields({...withdrawFields, bankName: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white" />
                      <select value={withdrawFields.accountType} onChange={(e) => setWithdrawFields({...withdrawFields, accountType: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white bg-black">
                        <option value="Ahorros">Ahorros</option>
                        <option value="Corriente">Corriente</option>
                      </select>
                    </div>
                    <input type="text" placeholder="Nº Cuenta" value={withdrawFields.accountNumber} onChange={(e) => setWithdrawFields({...withdrawFields, accountNumber: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white" />
                  </div>
                )}

                <button onClick={handleWithdrawal} disabled={loadingWithdraw || withdrawAmount <= 0 || withdrawAmount > balance} className={`w-full rounded-2xl py-6 text-sm font-black shadow-xl transition-all ${withdrawAmount > balance ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-white text-black hover:scale-[1.01] active:scale-[0.98]'}`}>
                  {loadingWithdraw ? "Procesando..." : `Solicitar Retiro`}
                </button>
              </div>
            </div>
          )}

          {activeView === "accounts" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">Mis Cuentas Bancarias</h2>
              <div className="space-y-6">
                <div className="rounded-[40px] border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-3xl">
                  <h3 className="text-white font-bold mb-6">Añadir Nueva Cuenta</h3>
                  <div className="grid gap-4">
                    <input type="text" placeholder="Nombre Completo" value={withdrawFields.fullName} onChange={(e) => setWithdrawFields({...withdrawFields, fullName: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Banco" value={withdrawFields.bankName} onChange={(e) => setWithdrawFields({...withdrawFields, bankName: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white" />
                      <select value={withdrawFields.accountType} onChange={(e) => setWithdrawFields({...withdrawFields, accountType: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white bg-black">
                        <option value="Ahorros">Ahorros</option>
                        <option value="Corriente">Corriente</option>
                      </select>
                    </div>
                    <input type="text" placeholder="Número de Cuenta" value={withdrawFields.accountNumber} onChange={(e) => setWithdrawFields({...withdrawFields, accountNumber: e.target.value})} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white" />
                    <button onClick={saveAccount} disabled={loadingAccount} className="mt-2 w-full rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white hover:bg-cyan-500 transition-colors">Guardar Cuenta</button>
                  </div>
                </div>
                {bankAccounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-zinc-900/20">
                    <div>
                      <p className="font-bold text-white">{acc.bankName}</p>
                      <p className="text-xs text-zinc-500">{acc.fullName} - {acc.accountType}</p>
                      <p className="text-xs font-mono text-cyan-400 mt-1">#{acc.accountNumber}</p>
                    </div>
                    <button onClick={() => deleteAccount(acc.id)} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === "history" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">Historial de Trading</h2>
              <div className="space-y-3">
                {transactions.map((trx) => (
                  <div key={trx.id} className="flex items-center justify-between rounded-[28px] border border-white/5 bg-zinc-900/40 px-8 py-5">
                    <div className="flex items-center gap-5">
                      <div className={`h-12 w-12 flex items-center justify-center rounded-2xl ${trx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trx.type === 'deposit' ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} /></svg>
                      </div>
                      <div>
                        <p className="font-bold text-white">{trx.type === 'deposit' ? 'Depósito Real' : 'Retiro Solicitado'}</p>
                        <div className="flex gap-2 items-center">
                          <p className="text-[10px] text-zinc-500 font-bold">{trx.createdAt ? new Date(trx.createdAt.seconds * 1000).toLocaleString() : '...'}</p>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-zinc-600">{trx.status}</span>
                        </div>
                      </div>
                    </div>
                    <p className={`text-xl font-black ${trx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>{trx.type === 'deposit' ? '+' : '-'}{formatCurrency(trx.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${active ? "bg-white text-black shadow-lg shadow-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}>
      <span className={active ? "text-black" : "text-zinc-600"}>{icon}</span>
      {label}
    </button>
  );
}
