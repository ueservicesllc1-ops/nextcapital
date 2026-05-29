'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { getInvestorData } from '@/lib/data';
import { Balance, Deposit, Transaction } from '@/lib/types';
import { useToast } from '@/components/providers/toast-provider';
import { useRouter } from 'next/navigation';
import { 
  Cpu, 
  Zap, 
  Activity, 
  HardDrive, 
  ShieldAlert, 
  ArrowRight, 
  Layers, 
  Coins, 
  LogOut, 
  ArrowLeft, 
  RefreshCw, 
  ShoppingCart,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';

const CLOUD_MINING_PLANS = [
  {
    tier: 'STARTER',
    code: 'NC-S1',
    hashrate: '100 TH/s',
    price: 149,
    minRoi: 0.75,
    maxRoi: 1.10,
    invest: '$500 – $2K',
    features: ['1 nodo ASIC físico', 'Dashboard en vivo', 'Retiro mensual'],
    hot: false,
  },
  {
    tier: 'PRO',
    code: 'NC-P2',
    hashrate: '250 TH/s',
    price: 329,
    minRoi: 0.80,
    maxRoi: 1.10,
    invest: '$2K – $10K',
    features: ['2 nodos ASIC físicos', 'Telemetría 24/7', 'Retiro semanal'],
    hot: true,
  },
  {
    tier: 'INDUSTRIAL',
    code: 'NC-I3',
    hashrate: '500 TH/s',
    price: 599,
    minRoi: 0.85,
    maxRoi: 1.10,
    invest: '$10K+',
    features: ['Rack dedicado completo', 'API telemetría cruda', 'Retiro diario'],
    hot: false,
  },
];

const BTC_PRICE_USD = 87452.00;

export default function MinadoDashboardPage() {
  const { firebaseUser, appUser, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sysLogs, setSysLogs] = useState<string[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Simulation states
  const [liveHashrate, setLiveHashrate] = useState(0);
  const [liveTemp, setLiveTemp] = useState(24);
  const [livePower, setLivePower] = useState(0);
  const [liveBtcEarnings, setLiveBtcEarnings] = useState(0);
  const [chartData, setChartData] = useState<number[]>([]);

  const simulatedIncrementRef = useRef<number>(0);
  const dataFetchIntervalRef = useRef<any>(null);

  // System status log generation
  useEffect(() => {
    const logs = [
      '⚡ [SYS_INIT] Iniciando CORE_MINING_OS v3.8.5...',
      '🔍 [SYS_INIT] Conectando con los nodos de NextCapital Cluster...',
      '🛡️ [SYS_INIT] Verificando credenciales de usuario...',
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < logs.length) {
        setSysLogs(prev => [...prev, logs[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Fetch Firebase Data
  useEffect(() => {
    async function loadData() {
      if (!firebaseUser) return;
      try {
        // Credit pending interests
        await fetch('/api/investor/credit-interests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: firebaseUser.uid }),
        });

        // Get fresh investor data
        const data = await getInvestorData(firebaseUser.uid);
        setBalance(data.balance);
        setDeposits(data.deposits);
        setTransactions(data.transactions);
      } catch (err: any) {
        console.error('Error loading mining dashboard data:', err);
        showToast('Error de conexión al cargar telemetría.', 'error');
      } finally {
        // Slight delay to allow visual cyber logs to display beautifully
        setTimeout(() => {
          setLoading(false);
        }, 1200);
      }
    }

    if (firebaseUser) {
      loadData();
      dataFetchIntervalRef.current = setInterval(loadData, 30000); // refresh database every 30s
    } else {
      // Not logged in: allow visual load to complete, then display lock screen
      const t = setTimeout(() => {
        setLoading(false);
      }, 1500);
      return () => clearTimeout(t);
    }

    return () => {
      if (dataFetchIntervalRef.current) clearInterval(dataFetchIntervalRef.current);
    };
  }, [firebaseUser]);

  // Identify cloud mining active plans from approved deposits
  const activeContracts = deposits.filter(
    d => d.status === 'approved' && ['NC-S1', 'NC-P2', 'NC-I3'].includes(d.planId ?? '')
  );
  
  const hasActivePlan = activeContracts.length > 0;

  // Calculate hashrate stats
  const totalStarter = activeContracts.filter(c => c.planId === 'NC-S1').length;
  const totalPro = activeContracts.filter(c => c.planId === 'NC-P2').length;
  const totalIndustrial = activeContracts.filter(c => c.planId === 'NC-I3').length;

  const nominalHashrate = (totalStarter * 100) + (totalPro * 250) + (totalIndustrial * 500); // in TH/s
  const nominalPower = (totalStarter * 1250) + (totalPro * 3250) + (totalIndustrial * 6500); // in Watts
  const nominalInvestment = activeContracts.reduce((sum, c) => {
    const plan = CLOUD_MINING_PLANS.find(p => p.code === c.planId);
    return sum + (plan?.price ?? 0);
  }, 0);

  // Live simulation ticker for earnings and hashrates
  useEffect(() => {
    if (!hasActivePlan) {
      setLiveHashrate(0);
      setLiveTemp(24);
      setLivePower(0);
      setLiveBtcEarnings(0);
      return;
    }

    // Set starting earnings based on total profit accumulated from the database
    const startUSD = balance?.totalProfit ?? 0;
    const startBTC = startUSD / BTC_PRICE_USD;
    setLiveBtcEarnings(startBTC);

    // Accumulation increment speed:
    // Avg 0.95% daily ROI -> 0.0095 * Investment / 86400 (per second) / BTC_PRICE
    const incrementPerSec = ((nominalInvestment * 0.0095) / 86400) / BTC_PRICE_USD;
    // We run the tick every 200ms
    const tickInterval = 200;
    const incrementPerTick = incrementPerSec * (tickInterval / 1000);

    const ticker = setInterval(() => {
      // Fluctuate hashrate slightly (±1.5%)
      const fluctuation = (Math.random() - 0.5) * 0.03;
      setLiveHashrate(Number((nominalHashrate * (1 + fluctuation)).toFixed(1)));

      // Fluctuate temp around 68°C
      setLiveTemp(Math.floor(66 + Math.random() * 5));

      // Fluctuate power draw slightly
      setLivePower(Math.floor(nominalPower * (1 + (Math.random() - 0.5) * 0.01)));

      // Ticker increment
      simulatedIncrementRef.current += incrementPerTick;
      setLiveBtcEarnings(startBTC + simulatedIncrementRef.current);
    }, tickInterval);

    // Initial chart data
    setChartData(Array.from({ length: 30 }, () => Math.floor(45 + Math.random() * 45)));

    const chartTicker = setInterval(() => {
      setChartData(prev => {
        const next = [...prev.slice(1)];
        next.push(Math.floor(40 + Math.random() * 55));
        return next;
      });
    }, 2000);

    return () => {
      clearInterval(ticker);
      clearInterval(chartTicker);
    };
  }, [hasActivePlan, nominalHashrate, nominalPower, nominalInvestment, balance?.totalProfit]);

  async function handleLogout() {
    try {
      await logout();
      showToast('Sesión cerrada correctamente.', 'info');
      router.push('/minado');
    } catch (err) {
      showToast('Error al cerrar sesión.', 'error');
    }
  }

  // --- RENDERS ---

  // 1. Loading Screen (Utterly beautiful terminal loading style)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center p-6 text-white font-mono">
        <div className="w-full max-w-lg rounded-2xl border border-amber-500/20 bg-[#0d0d14] p-8 shadow-[0_0_50px_rgba(245,158,11,0.05)]">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            <span className="text-xs text-amber-500 font-bold tracking-widest">NEXTCAPITAL CORE MINING NETWORK</span>
          </div>
          <div className="space-y-2 h-48 overflow-y-auto text-xs text-slate-400">
            {sysLogs.map((log, i) => (
              <div key={i} className="animate-fade-in">{log}</div>
            ))}
            <div className="text-amber-500/60 animate-pulse mt-2">&gt; Inicializando terminal de telemetría... ▌</div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Lock Screen / Unauthenticated state (Premium warning, no crude default alert)
  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4 text-white">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md rounded-2xl p-8 text-center" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-amber-500/10 border border-amber-500/30">
            <ShieldAlert size={32} className="text-amber-500 animate-pulse" />
          </div>

          <h1 className="text-2xl font-black mb-2 tracking-tight">Acceso Denegado</h1>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Debes iniciar sesión con tu cuenta registrada en NextCapital para acceder a la terminal de control del hardware ASIC.
          </p>

          <div className="space-y-4">
            <Link 
              href="/login" 
              className="block w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:opacity-95 transition-all"
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/register" 
              className="block w-full py-4 rounded-xl font-semibold text-sm text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              Crear Cuenta
            </Link>
          </div>

          <Link href="/minado" className="inline-flex items-center gap-2 mt-8 text-xs text-slate-500 hover:text-amber-400 transition-colors">
            <ArrowLeft size={12} /> Volver al portal minero
          </Link>
        </div>
      </div>
    );
  }

  // 3. MAIN DASHBOARD CONTENT
  return (
    <div className="min-h-screen text-white bg-[#060608] flex flex-col lg:flex-row" style={{ fontFamily: 'var(--font-geist-sans), Inter, sans-serif' }}>
      
      {/* SideNavBar (Desktop Sidebar) */}
      <aside className="w-full lg:w-64 bg-[#09090e] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col flex-shrink-0">
        {/* Core Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Zap size={16} className="text-amber-400" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-widest text-white leading-none">Next<span className="text-amber-400">Capital</span></h1>
            <span className="text-[9px] font-bold text-amber-500/80 tracking-widest uppercase">MINING_CONTROL</span>
          </div>
        </div>

        {/* User Card */}
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

          <div className="mt-4 flex items-center justify-between p-2 rounded bg-black/40 border border-white/5">
            <span className="text-[9px] font-mono text-slate-500 uppercase">TELEMETRÍA</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${hasActivePlan ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`} />
              <span className="text-[9px] font-mono font-bold text-slate-300">
                {hasActivePlan ? 'OPTIMAL' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          <Link href="/minado/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/10 font-medium text-xs tracking-wide">
            <Activity size={16} />
            TELEMETRÍA ACTIVA
          </Link>
          <Link href="/minado/dashboard/wallet" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs tracking-wide transition-all">
            <Layers size={16} />
            PANEL FINANCIERO
          </Link>
          <Link href="/minado/dashboard/deposits" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-xs tracking-wide transition-all">
            <Coins size={16} />
            ADQUIRIR HASHRATE
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link href="/minado" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all border border-white/5">
            <ArrowLeft size={12} /> Volver a Landing
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 transition-all border border-red-500/10"
          >
            <LogOut size={12} /> CERRAR SESIÓN
          </button>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col min-h-0 bg-[#060608] overflow-y-auto">
        
        {/* Top Header Row */}
        <header className="px-8 py-5 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#09090e]/50 backdrop-blur-md sticky top-0 z-30">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-500 tracking-wider">CORE_MINING_OS // CONTROLES</span>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">Terminal de Monitoreo ASIC</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/minado/dashboard/deposits" 
              className="py-2.5 px-4 rounded-xl bg-amber-500 text-black font-bold text-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <ShoppingCart size={13} />
              Contratar Hashrate
            </Link>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">

          {/* WARNING STATE: IF NO ACTIVE MINING PLAN */}
          {!hasActivePlan && (
            <div className="rounded-2xl border border-amber-500/30 p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(6,6,8,0.9) 100%)' }}>
              {/* Subtle ambient flash lines */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/30 animate-pulse" />
              
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold">
                    <ShieldAlert size={12} />
                    ADVERTENCIA: HARDWARE INACTIVO
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-white">No tienes un contrato de Hashrate activo</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Tu nodo de minado NextCapital se encuentra actualmente **desasignado y offline**. Para activar tus procesadores físicos dedicados, monitorear la telemetría en tiempo real y empezar a generar ganancias diarias en piloto automático, debes adquirir un contrato de hashrate.
                  </p>
                </div>
                <div className="flex-shrink-0 w-full lg:w-auto">
                  <Link 
                    href="#adquirir-nodos" 
                    className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:opacity-95 shadow-[0_0_20px_rgba(245,158,11,0.2)] w-full lg:w-auto transition-all"
                  >
                    Ver Planes de Minado <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TELEMETRY METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: State */}
            <div className="rounded-2xl p-5 border border-white/5 bg-[#0d0d14] flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">HARDWARE NODE</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border ${hasActivePlan ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-900 text-slate-600 border-white/5'}`}>
                  {hasActivePlan ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div>
                <h4 className="text-slate-400 text-xs font-medium">Estado del Suministro</h4>
                <div className="text-xl font-black tracking-tight text-white mt-1">
                  {hasActivePlan ? 'MINANDO_ACTIVO' : 'UNPROVISIONED'}
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  {hasActivePlan ? 'Cluster Central: Conectado' : 'Esperando asignación física'}
                </p>
              </div>
            </div>

            {/* Metric 2: Live Hashrate */}
            <div className="rounded-2xl p-5 border border-white/5 bg-[#0d0d14] flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">HASH RATE TOTAL</span>
                <Activity size={14} className={hasActivePlan ? 'text-amber-500 animate-pulse' : 'text-slate-600'} />
              </div>
              <div>
                <h4 className="text-slate-400 text-xs font-medium">Potencia Operacional</h4>
                <div className="text-3xl font-black tracking-tight mt-1 flex items-baseline gap-1" style={{ color: hasActivePlan ? '#f59e0b' : '#64748b' }}>
                  {hasActivePlan ? liveHashrate : '0.00'}
                  <span className="text-xs text-slate-500 font-mono">TH/s</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  {hasActivePlan ? 'Rendimiento: 99.98% Promedio' : 'Sin potencia eléctrica asignada'}
                </p>
              </div>
            </div>

            {/* Metric 3: Temp & Efficiency */}
            <div className="rounded-2xl p-5 border border-white/5 bg-[#0d0d14] flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">HARDWARE TELEMETRY</span>
                <HardDrive size={14} className={hasActivePlan ? 'text-amber-500' : 'text-slate-600'} />
              </div>
              <div>
                <h4 className="text-slate-400 text-xs font-medium">Temperatura del Chip</h4>
                <div className="text-3xl font-black tracking-tight mt-1 flex items-baseline gap-1" style={{ color: hasActivePlan ? '#ffffff' : '#64748b' }}>
                  {hasActivePlan ? `${liveTemp}°C` : '22°C'}
                  <span className="text-xs text-slate-500 font-mono">NOMINAL</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  {hasActivePlan ? `Refrigeración: ${livePower} Watts` : 'Consumo: 0 Watts'}
                </p>
              </div>
            </div>

            {/* Metric 4: ROI / Profit */}
            <div className="rounded-2xl p-5 border border-white/5 bg-[#0d0d14] flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">YIELD DIARIO</span>
                <TrendingUp size={14} className={hasActivePlan ? 'text-amber-500' : 'text-slate-600'} />
              </div>
              <div>
                <h4 className="text-slate-400 text-xs font-medium">Rendimiento Estimado</h4>
                <div className="text-3xl font-black tracking-tight text-amber-500 mt-1 flex items-baseline gap-1">
                  {hasActivePlan ? '0.75% - 1.10%' : '0.00%'}
                  <span className="text-xs text-slate-500 font-mono">/DÍA</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  {hasActivePlan ? 'Capital variable asegurado' : 'Requiere contrato activo'}
                </p>
              </div>
            </div>

          </div>

          {/* ACCRUED TOTAL EARNINGS PANEL */}
          <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${hasActivePlan ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                GANANCIAS ACUMULADAS EN TIEMPO REAL
              </span>
              <div className="text-3xl lg:text-5xl font-black tracking-tight font-mono text-white mt-2 flex items-baseline gap-2">
                {hasActivePlan ? (
                  <span className="text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
                    {liveBtcEarnings.toFixed(8)}
                  </span>
                ) : '0.00000000'}
                <span className="text-lg lg:text-2xl text-slate-500 font-normal">BTC</span>
              </div>
              <div className="text-slate-400 font-medium text-sm flex items-center gap-1 mt-1">
                ≈ {hasActivePlan ? formatCurrency(liveBtcEarnings * BTC_PRICE_USD) : '$0.00'} USD
                <span className="text-[10px] font-mono text-slate-600 ml-2">(BTC/USD = $87,452.00)</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Link 
                href="/minado/dashboard/wallet" 
                className="py-4 px-6 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-white/10 hover:text-white transition-all text-center flex items-center justify-center gap-2"
              >
                <DollarSign size={14} />
                Ver Balance Financiero
              </Link>
              <Link 
                href="/minado/dashboard/wallet"
                className={`py-4 px-8 rounded-xl font-bold text-xs bg-amber-500 text-black hover:opacity-95 active:scale-[0.99] transition-all text-center shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center justify-center gap-2 ${!hasActivePlan ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Coins size={14} />
                RETIRAR GANANCIAS
              </Link>
            </div>
          </div>

          {/* TELEMETRY CHART AND HARDWARE LIST */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visualizer Chart */}
            <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5 lg:col-span-2 flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
                  <Activity size={14} className="text-amber-500" />
                  RENDIMIENTO DE HASHRATE Y SEÑAL EN VIVO
                </span>
                <span className="text-[10px] font-mono text-slate-600">Intervalo: 2s (Tiempo real)</span>
              </div>

              {/* Faux Graph Visualizer */}
              <div className="relative h-44 w-full flex items-end gap-1.5 p-3 rounded-xl bg-black/40 border border-white/5 overflow-hidden">
                {hasActivePlan ? (
                  chartData.map((val, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-amber-500/20 hover:bg-amber-500/50 border-t border-amber-500/40 hover:border-amber-500 transition-all rounded-sm cursor-pointer" 
                      style={{ height: `${val}%` }}
                      title={`Time Point ${i}: ${((nominalHashrate * (0.95 + val/200))).toFixed(1)} TH/s`}
                    />
                  ))
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <ShieldAlert size={28} className="text-slate-600 mb-2" />
                    <p className="text-xs text-slate-500 font-mono uppercase">SIN ACTIVIDAD TELEMÉTRICA</p>
                    <p className="text-[10px] text-slate-600 mt-1 max-w-xs leading-relaxed">Adquiere un plan para activar los transductores y graficar el rendimiento real del ASIC.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-3 px-1">
                <span>00:00:00 UTC</span>
                <span>Frecuencia: 60Hz</span>
                <span>TELEMETRÍA_ACTIVA</span>
              </div>
            </div>

            {/* Active Plan Detail & Nodes list */}
            <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                  <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
                    <HardDrive size={14} className="text-amber-500" />
                    NODOS ASIGNADOS A TU CUENTA
                  </span>
                </div>

                <div className="space-y-3 h-52 overflow-y-auto pr-1">
                  {hasActivePlan ? (
                    activeContracts.map((contract, i) => {
                      const plan = CLOUD_MINING_PLANS.find(p => p.code === contract.planId);
                      return (
                        <div 
                          key={contract.id || i}
                          className="p-3.5 rounded-xl border border-amber-500/10 bg-amber-500/5 flex items-center justify-between transition-all hover:border-amber-500/25"
                        >
                          <div className="space-y-1">
                            <div className="text-xs font-mono font-bold text-amber-400">
                              NODE_{contract.planId}_{i+1}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Físico: ASIC Antminer {plan?.tier === 'INDUSTRIAL' ? 'S19 XP Dedicated' : plan?.tier === 'PRO' ? 'S19 Pro' : 'S19 SE'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono text-white font-bold">{plan?.hashrate}</div>
                            <div className="inline-flex items-center gap-1 mt-1 text-[8px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ONLINE
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full py-6">
                      <Cpu size={24} className="text-slate-600 mb-2" />
                      <p className="text-xs font-mono text-slate-500 uppercase">Sin nodos asignados</p>
                      <p className="text-[10px] text-slate-600 mt-1">Ningún hardware ASIC está asignado actualmente a este usuario.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase">NEXTCAPITAL CLOUD COMPUTING INC</span>
              </div>
            </div>

          </div>

          {/* PLAN MARKETPLACE SECTION */}
          <section id="adquirir-nodos" className="pt-8">
            <div className="border-b border-white/5 pb-4 mb-6">
              <span className="text-[10px] font-mono font-bold text-amber-500 tracking-widest uppercase">— CATÁLOGO DE POTENCIA</span>
              <h3 className="text-xl font-black tracking-tight text-white mt-1">Adquirir Nuevo Contrato de Hashrate</h3>
              <p className="text-xs text-slate-500 mt-1">Elige un plan a continuación para aprovisionar hardware ASIC físico e iniciar la minería de Bitcoin en minutos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {CLOUD_MINING_PLANS.map((plan) => (
                <div 
                  key={plan.code}
                  className="rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden transition-transform duration-300 hover:-translate-y-1"
                  style={{
                    background: plan.hot
                      ? 'linear-gradient(160deg, rgba(245,158,11,0.06) 0%, rgba(13,13,20,1) 60%)'
                      : '#0d0d14',
                    border: plan.hot ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {plan.hot && (
                    <div className="absolute top-0 right-0">
                      <span className="bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                        MÁS ELEGIDO
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-amber-500">{plan.code}</span>
                      <span className="text-xs text-slate-400 font-mono">{plan.hashrate}</span>
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-white">{plan.tier}</h4>
                      <p className="text-xs text-slate-500 mt-1">Inversión: {plan.invest}</p>
                    </div>

                    <div className="text-2xl font-black text-white">
                      ${plan.price} <span className="text-xs text-slate-500 font-normal">/mes</span>
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Rendimiento diario:</span>
                        <span className="text-amber-400 font-bold">{plan.minRoi}% - {plan.maxRoi}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: plan.code === 'NC-S1' ? '70%' : plan.code === 'NC-P2' ? '85%' : '100%' }} />
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-400">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    <Link 
                      href={`/minado/dashboard/deposits?plan=${plan.code}`}
                      className="block w-full py-3 rounded-xl font-bold text-xs text-center transition-all hover:scale-[1.01]"
                      style={plan.hot
                        ? { bg: '#f59e0b', color: '#000', background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 5px 15px rgba(245,158,11,0.2)' }
                        : { background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      Contratar Hardware →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

    </div>
  );
}
