'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { getInvestorData } from '@/lib/data';
import { useToast } from '@/components/providers/toast-provider';
import { db } from '@/lib/firebase/client';
import { normalizeDate } from '@/lib/firestore-client';
import { Balance, Deposit, Transaction, Withdrawal } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { 
  Zap, 
  Cpu, 
  Layers, 
  Coins, 
  LogOut, 
  ArrowLeft, 
  Activity, 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  ShieldAlert, 
  Clock 
} from 'lucide-react';

export default function MinadoWalletPage() {
  const { firebaseUser, appUser, logout } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  
  // Withdrawal Form
  const [withdrawalAmount, setWithdrawalAmount] = useState('150');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

  async function loadData() {
    if (!firebaseUser) return;
    try {
      const data = await getInvestorData(firebaseUser.uid);
      setBalance(data.balance);
      setDeposits(data.deposits);
      setTransactions(data.transactions);

      // Load withdrawals
      const wdSnap = await getDocs(
        query(collection(db, 'withdrawals'), where('userId', '==', firebaseUser.uid), orderBy('createdAt', 'desc'))
      );
      setWithdrawals(
        wdSnap.docs.map(item => ({
          id: item.id,
          ...item.data(),
          createdAt: normalizeDate(item.data().createdAt),
        })) as Withdrawal[]
      );
    } catch (err: any) {
      console.error('Error loading finance data:', err);
      showToast('Error de conexión al cargar balance.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (firebaseUser) {
      loadData();
    }
  }, [firebaseUser]);

  async function handleWithdrawal(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    
    setWithdrawalLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(withdrawalAmount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message ?? 'No se pudo procesar la solicitud.', 'error');
        return;
      }
      showToast('Retiro solicitado con éxito.', 'success');
      setWithdrawalAmount('150');
      await loadData();
    } catch (err) {
      showToast('Error de red al solicitar retiro.', 'error');
    } finally {
      setWithdrawalLoading(false);
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

  const isWithdrawalWindowOpen = () => {
    const today = new Date().getDate();
    return today >= 28 && today <= 30;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center p-6 text-white font-mono">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
          <span className="text-xs text-amber-500 font-bold tracking-widest">CARGANDO CORE_MINING_OS WALLET...</span>
        </div>
      </div>
    );
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
          <Link href="/minado/dashboard/wallet" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/10 font-medium text-xs tracking-wide">
            <Layers size={16} />
            PANEL FINANCIERO
          </Link>
          <Link href="/minado/dashboard/deposits" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs tracking-wide transition-all">
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

      {/* Main Finance Canvas */}
      <main className="flex-1 flex flex-col min-h-0 bg-[#060608] overflow-y-auto">
        <header className="px-8 py-5 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#09090e]/50 backdrop-blur-md sticky top-0 z-30">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-500 tracking-wider">CORE_MINING_OS // FINANZAS</span>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">Panel Financiero de Minería</h2>
          </div>
          <Link 
            href="/minado/dashboard/deposits" 
            className="py-2.5 px-4 rounded-xl bg-amber-500 text-black font-bold text-xs hover:opacity-95 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            Adquirir Hashrate
          </Link>
        </header>

        <div className="p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Status Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="rounded-2xl p-6 border border-white/5 bg-[#0d0d14] flex flex-col justify-between group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">CAPITAL CONTRATADO</span>
                <ArrowDownCircle size={16} className="text-amber-500" />
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight text-white">
                  {formatCurrency(balance?.totalDeposited ?? 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Total invertido en hardware ASIC</p>
              </div>
            </div>

            <div className="rounded-2xl p-6 border border-white/5 bg-[#0d0d14] flex flex-col justify-between group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">GANANCIAS ACUMULADAS</span>
                <Activity size={16} className="text-green-500 animate-pulse" />
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight text-green-400">
                  {formatCurrency(balance?.totalProfit ?? 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Interés generado por minado físico</p>
              </div>
            </div>

            <div className="rounded-2xl p-6 border border-white/5 bg-[#0d0d14] flex flex-col justify-between group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">SALDO DISPONIBLE</span>
                <Wallet size={16} className="text-amber-500" />
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight text-amber-500">
                  {formatCurrency(balance?.currentBalance ?? 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Saldo en cuenta para reinvertir/retirar</p>
              </div>
            </div>

          </div>

          {/* WITHDRAWAL REQUEST & LOGS BLOCK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Request Withdrawal form */}
            <article className="rounded-2xl border border-white/5 bg-[#0d0d14] p-6 lg:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">Solicitar Retiro de Ganancias</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Las solicitudes de retiro son enviadas al equipo de compliance de NextCapital. Asegúrate de cumplir con los términos.
                </p>
              </div>

              {!isWithdrawalWindowOpen() && (
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <ShieldAlert size={14} />
                    VENTANA DE RETIROS CERRADA
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Según las políticas de compliance, los retiros están limitados y permitidos únicamente los días **28, 29 y 30** de cada mes.
                  </p>
                </div>
              )}

              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-2">Monto a retirar (USD)</label>
                  <input 
                    type="number"
                    min={20}
                    required
                    disabled={!isWithdrawalWindowOpen() || withdrawalLoading}
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-600 text-sm outline-none transition-all focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isWithdrawalWindowOpen() || withdrawalLoading}
                  className="w-full py-4 rounded-xl font-bold text-xs bg-amber-500 text-black hover:opacity-95 disabled:opacity-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                >
                  {withdrawalLoading ? 'Enviando Solicitud...' : 'Solicitar Retiro de Fondos'}
                </button>
              </form>
            </article>

            {/* Withdrawal logs */}
            <article className="rounded-2xl border border-white/5 bg-[#0d0d14] p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-white mb-6 border-b border-white/5 pb-4">Historial de Retiros</h3>
                
                <div className="space-y-3 h-52 overflow-y-auto pr-1">
                  {!withdrawals.length ? (
                    <div className="flex flex-col items-center justify-center text-center h-full py-10 text-slate-500">
                      <Clock size={24} className="mb-2" />
                      <p className="text-xs font-mono">No hay retiros registrados</p>
                    </div>
                  ) : (
                    withdrawals.map((wd) => (
                      <div key={wd.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(normalizeDate(wd.createdAt)).toLocaleDateString()}
                          </span>
                          <div className="text-xs font-bold text-white">Retiro de Ganancias</div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-xs font-mono font-bold text-white">{formatCurrency(wd.amount)}</div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            wd.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            wd.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {wd.status === 'pending' ? 'En revisión' : wd.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </article>

          </div>

          {/* DEPOSIT LOGS / TRANSACTION HISTORY */}
          <section className="rounded-2xl border border-white/5 bg-[#0d0d14] p-6 lg:p-8">
            <h3 className="text-lg font-black text-white mb-6 border-b border-white/5 pb-4">Historial de Depósitos y Nodos</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 uppercase tracking-widest">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Referencia</th>
                    <th className="py-3 px-4">Contrato</th>
                    <th className="py-3 px-4">Monto</th>
                    <th className="py-3 px-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {!deposits.length ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-600 font-mono">
                        No se detectó ningún historial de depósitos.
                      </td>
                    </tr>
                  ) : (
                    deposits.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 px-4 text-slate-400">{new Date(normalizeDate(item.createdAt)).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-white uppercase font-bold">{item.method}</td>
                        <td className="py-4 px-4 text-amber-500 font-bold">{item.planId || 'Recarga libre'}</td>
                        <td className="py-4 px-4 text-white">{formatCurrency(item.amount)}</td>
                        <td className="py-4 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                            item.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                            'bg-amber-500/10 text-amber-400 animate-pulse'
                          }`}>
                            {item.status === 'pending' ? 'En revisión' : item.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>

    </div>
  );
}
