'use client';

import Link from 'next/link';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { getInvestorData } from '@/lib/data';
import { Balance, Deposit, Transaction } from '@/lib/types';
import { useToast } from '@/components/providers/toast-provider';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { db } from '@/lib/firebase/client';
import dynamic from 'next/dynamic';
import { normalizeDate } from '@/lib/firestore-client';
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
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Globe,
  Terminal,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

// Dynamic imports (client-only heavy components)
const MiningParticles    = dynamic(() => import('@/components/mining/MiningParticles'),    { ssr: false });
const MiningWorldMap     = dynamic(() => import('@/components/mining/MiningWorldMap'),     { ssr: false });
const MiningAchievements = dynamic(() => import('@/components/mining/MiningAchievements'), { ssr: false });
const ProfitCalculator   = dynamic(() => import('@/components/mining/ProfitCalculator'),   { ssr: false });
const ReferralPanel      = dynamic(() => import('@/components/mining/ReferralPanel'),      { ssr: false });
const MiningNotifications= dynamic(() => import('@/components/mining/MiningNotifications'),{ ssr: false });
const BtcPriceTicker     = dynamic(() => import('@/components/mining/BtcPriceTicker'),     { ssr: false });

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CLOUD_MINING_PLANS = [
  {
    tier: 'STARTER',
    code: 'NC-S1',
    hashrate: '100 TH/s',
    price: 149,
    minRoi: 1.50,
    maxRoi: 2.50,
    invest: '$500 – $2K',
    features: ['1 nodo ASIC físico', 'Dashboard en vivo', 'Retiro mensual'],
    hot: false,
  },
  {
    tier: 'PRO',
    code: 'NC-P2',
    hashrate: '250 TH/s',
    price: 329,
    minRoi: 1.75,
    maxRoi: 3.00,
    invest: '$2K – $10K',
    features: ['2 nodos ASIC físicos', 'Telemetría 24/7', 'Retiro semanal'],
    hot: true,
  },
  {
    tier: 'INDUSTRIAL',
    code: 'NC-I3',
    hashrate: '500 TH/s',
    price: 599,
    minRoi: 1.90,
    maxRoi: 3.50,
    invest: '$10K+',
    features: ['Rack dedicado completo', 'API telemetría cruda', 'Retiro diario'],
    hot: false,
  },
];

const COIN_CONFIGS = {
  BTC: { name: 'Bitcoin', symbol: 'BTC', algorithm: 'SHA-256', unit: 'TH/s', price: 92450.00, color: 'text-amber-500', glow: 'rgba(245,158,11,0.25)', hashrates: { 'NC-S1': '100', 'NC-P2': '250', 'NC-I3': '500' } },
  LTC: { name: 'Litecoin', symbol: 'LTC', algorithm: 'Scrypt', unit: 'GH/s', price: 88.50, color: 'text-slate-400', glow: 'rgba(148,163,184,0.25)', hashrates: { 'NC-S1': '1.2', 'NC-P2': '3.0', 'NC-I3': '6.0' } },
  DOGE: { name: 'Dogecoin', symbol: 'DOGE', algorithm: 'Scrypt', unit: 'GH/s', price: 0.385, color: 'text-yellow-400', glow: 'rgba(253,224,71,0.25)', hashrates: { 'NC-S1': '1.2', 'NC-P2': '3.0', 'NC-I3': '6.0' } },
  ETC: { name: 'Ethereum Classic', symbol: 'ETC', algorithm: 'Etchash', unit: 'GH/s', price: 23.80, color: 'text-emerald-500', glow: 'rgba(16,185,129,0.25)', hashrates: { 'NC-S1': '1.8', 'NC-P2': '4.5', 'NC-I3': '9.0' } },
  RVN: { name: 'Ravencoin', symbol: 'RVN', algorithm: 'KawPow', unit: 'MH/s', price: 0.022, color: 'text-orange-500', glow: 'rgba(249,115,22,0.25)', hashrates: { 'NC-S1': '85', 'NC-P2': '210', 'NC-I3': '420' } }
};

const BTC_PRICE_USD = 92450.00;

// Pool constants — realistic but static for visual
const POOL_TOTAL_HASHRATE_EH = 847.3; // EH/s
const POOL_BLOCKS_TODAY = 12;
const POOL_MINERS = 14_283;
const PAYOUT_INTERVAL_HOURS = 24; // next payout every 24h

// Block terminal message generators
const BLOCK_PREFIXES = [
  '✓ Block #', '⟳ Scanning nonce range', '⟳ Pool sync:', '✓ Block #', '⟳ Validating merkle root', '✓ Block #', '⟳ Adjusting difficulty target', '⟳ Broadcasting solution'
];

function randomHex(len: number) {
  return '0x' + Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
}

function randomBtcReward() {
  return (0.000005 + Math.random() * 0.00002).toFixed(8);
}

function randomBlockNumber() {
  return (843000 + Math.floor(Math.random() * 2000)).toLocaleString('en-US');
}

function generateTerminalLine(hashrate: number, coin: string = 'BTC', unit: string = 'TH/s'): string {
  const now = new Date();
  const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
  
  const roll = Math.random();
  if (roll < 0.15) {
    // Diagnósticos de la placa de hash (Hashboard diagnostics)
    const tempPCB = Math.floor(62 + Math.random() * 5);
    const tempChip = Math.floor(68 + Math.random() * 6);
    const fanSpeed = Math.floor(5800 + Math.random() * 450);
    return `[${ts}] [SYS] HASHBOARD: Temp PCB=${tempPCB}°C, Temp Chip=${tempChip}°C | Fan Speed: ${fanSpeed} RPM | Voltage: 13.8V`;
  } else if (roll < 0.50) {
    // Aceptación de shares en el pool (lo más real e importante en pool mining)
    const diff = Math.floor(64 + Math.random() * 192);
    const ping = Math.floor(35 + Math.random() * 40);
    const shareId = Math.floor(1000 + Math.random() * 9000);
    return `[${ts}] [POOL] Accepted share #${shareId} (diff ${diff}) on stratum+tcp://pool.nextcapital.com:3333 (ping ${ping}ms)`;
  } else if (roll < 0.70) {
    // Escaneo de rangos de nonce y hashing en los chips
    const nonceRange = '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
    return `[${ts}] [CORE] Hashing job active | nonces range: ${nonceRange}... searching solution...`;
  } else if (roll < 0.85) {
    // Reporte de hashrate local estable
    const localHash = (hashrate * (0.98 + Math.random() * 0.04)).toFixed(coin === 'BTC' ? 1 : 2);
    return `[${ts}] [SYS] Local rate: ${localHash} ${unit} | HW Errors: 0 (0.00%) | Status: OPTIMAL`;
  } else if (roll < 0.95) {
    // Sincronización del target del pool de minería
    return `[${ts}] [POOL] Stratum connection active | difficulty target adjusted to ${(Math.random() * 1.5 + 4.2).toFixed(2)}T`;
  } else {
    // Bloque encontrado a nivel de red general (notificado por Stratum)
    const blockNum = 843000 + Math.floor(Math.random() * 2000);
    return `[${ts}] [NET] Stratum notified: New block #${blockNum} solved in network by pool node`;
  }
}

// ─────────────────────────────────────────────
// Hashrate Gauge SVG Component
// ─────────────────────────────────────────────
function HashrateGauge({ value, max, unit }: { value: number; max: number; unit: string }) {
  const pct = Math.min(value / max, 1);
  const angle = -140 + pct * 280; // from -140° to +140°
  const r = 54;
  const cx = 70;
  const cy = 70;

  // Arc path helper
  function polarToXY(angleDeg: number, radius: number) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function describeArc(startAngle: number, endAngle: number, radius: number) {
    const s = polarToXY(startAngle, radius);
    const e = polarToXY(endAngle, radius);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const needle = polarToXY(angle, r - 6);

  return (
    <svg viewBox="0 0 140 100" className="w-full max-w-[180px] mx-auto">
      {/* Background arc */}
      <path d={describeArc(-50, 230, r)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
      {/* Colored arc */}
      {pct > 0 && (
        <path
          d={describeArc(-50, -50 + pct * 280, r)}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.6))' }}
        />
      )}
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needle.x}
        y2={needle.y}
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 3px rgba(245,158,11,0.8))' }}
      />
      <circle cx={cx} cy={cy} r="3" fill="#f59e0b" />
      {/* Labels */}
      <text x={cx} y={cy + 22} textAnchor="middle" fill="white" fontSize="11" fontWeight="900" fontFamily="monospace">
        {value > 0 ? value.toFixed(1) : '0.0'}
      </text>
      <text x={cx} y={cy + 33} textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">
        {unit}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// Pool Stats Countdown
// ─────────────────────────────────────────────
function usePayoutCountdown() {
  const [remaining, setRemaining] = useState('--:--:--');
  useEffect(() => {
    const now = new Date();
    // Next payout at the next midnight UTC
    const nextPayout = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    
    function tick() {
      const diff = nextPayout.getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('00:00:00');
        return;
      }
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setRemaining(`${h}:${m}:${s}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return remaining;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function MinadoDashboardPage() {
  const { firebaseUser, appUser, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sysLogs, setSysLogs] = useState<string[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [selectedCoin, setSelectedCoin] = useState<'BTC' | 'LTC' | 'DOGE' | 'ETC' | 'RVN'>('BTC');
  const [selectedRigIndex, setSelectedRigIndex] = useState(0);
  const [showCoinHelp, setShowCoinHelp] = useState(false);

  // Simulation states
  const [liveHashrate, setLiveHashrate] = useState(0);
  const [liveTemp, setLiveTemp] = useState(24);
  const [livePower, setLivePower] = useState(0);
  const [liveBtcEarnings, setLiveBtcEarnings] = useState(0);
  const [chartData, setChartData] = useState<number[]>(Array.from({ length: 30 }, () => 100));
  // ASIC Rig Coin Locking states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [modalSelectedCoin, setModalSelectedCoin] = useState<'BTC' | 'LTC' | 'DOGE' | 'ETC' | 'RVN'>('BTC');
  const [configLoading, setConfigLoading] = useState(false);


  async function saveRigCoin() {
    if (!firebaseUser || !currentRig) return;
    setConfigLoading(true);
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'balances', firebaseUser.uid), {
        [`rigCoins.${currentRig.id}`]: modalSelectedCoin
      });
      
      // Update local state directly so HMR/state reflects immediately
      setBalance(prev => {
        if (!prev) return null;
        return {
          ...prev,
          rigCoins: {
            ...(prev as any).rigCoins,
            [currentRig.id]: modalSelectedCoin
          }
        };
      });
      
      showToast(`¡Configuración del ASIC exitosa! Rig NODE_${currentRig.planId} optimizado para minar ${COIN_CONFIGS[modalSelectedCoin].name}.`, 'success');
      setShowConfigModal(false);
      setSelectedCoin(modalSelectedCoin);
    } catch (e) {
      console.error('Error saving rig coin:', e);
      showToast('Error de conexión al configurar tu ASIC.', 'error');
    } finally {
      setConfigLoading(false);
    }
  }
  async function changeMiningCoin(newCoin: 'BTC' | 'LTC' | 'DOGE' | 'ETC' | 'RVN') {
    if (!firebaseUser) return;
    setSelectedCoin(newCoin);
    showToast(`ASIC conmutando a algoritmo de minado ${COIN_CONFIGS[newCoin].name} (${COIN_CONFIGS[newCoin].algorithm})...`, 'info');
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'balances', firebaseUser.uid), {
        miningCoin: newCoin
      });
    } catch (e) {
      console.error('Error saving mining coin:', e);
    }
  }

  // Terminal block log
  const [blockTerminal, setBlockTerminal] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const simulatedIncrementRef = useRef<number>(0);
  const dataFetchIntervalRef = useRef<any>(null);

  const payoutCountdown = usePayoutCountdown();

  // ── Boot logs ──
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

  // ── Fetch Firebase Data ──
  useEffect(() => {
    async function loadData() {
      if (!firebaseUser) return;
      try {
        await fetch('/api/investor/credit-interests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: firebaseUser.uid }),
        });
        const data = await getInvestorData(firebaseUser.uid);
        setBalance(data.balance);

        // Fetch all deposits directly so we can display pending ones too
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const depositsSnap = await getDocs(
          query(collection(db, "deposits"), where("userId", "==", firebaseUser.uid))
        );
        const allDeposits = depositsSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
          createdAt: normalizeDate(item.data().createdAt),
        })) as Deposit[];

        setDeposits(allDeposits);
        setTransactions(data.transactions);
        if ((data.balance as any).miningCoin) {
          setSelectedCoin((data.balance as any).miningCoin);
        }
      } catch (err: any) {
        console.error('Error loading mining dashboard data:', err);
        showToast('Error de conexión al cargar telemetría.', 'error');
      } finally {
        setTimeout(() => setLoading(false), 1200);
      }
    }

    if (firebaseUser) {
      loadData();
      dataFetchIntervalRef.current = setInterval(loadData, 30000);
    } else {
      const t = setTimeout(() => setLoading(false), 1500);
      return () => clearTimeout(t);
    }
    return () => {
      if (dataFetchIntervalRef.current) clearInterval(dataFetchIntervalRef.current);
    };
  }, [firebaseUser]);

  // ── Derived values ──
  const activeContracts = deposits.filter(
    d => d.status === 'approved' && ['NC-S1', 'NC-P2', 'NC-I3'].includes(d.planId ?? '')
  );
  
  const pendingContracts = deposits.filter(
    d => (d.status === 'pending' || d.status === 'processing') && ['NC-S1', 'NC-P2', 'NC-I3'].includes(d.planId ?? '')
  );

  const rejectedContracts = deposits.filter(
    d => d.status === 'rejected' && ['NC-S1', 'NC-P2', 'NC-I3'].includes(d.planId ?? '')
  );

  const allMiningContracts = [...activeContracts, ...pendingContracts];
  const hasActivePlan = activeContracts.length > 0;

  // Selected Rig derived stats
  const currentRig = activeContracts[selectedRigIndex] || activeContracts[0];
  const currentPlan = CLOUD_MINING_PLANS.find(p => p.code === currentRig?.planId);
  const hardwareName = currentPlan?.tier === 'INDUSTRIAL' ? 'Antminer S19 XP' 
                     : currentPlan?.tier === 'PRO' ? 'Antminer S19 Pro' 
                     : 'Antminer S19 SE';

  const totalStarter = activeContracts.filter(c => c.planId === 'NC-S1').length;
  const totalPro = activeContracts.filter(c => c.planId === 'NC-P2').length;
  const totalIndustrial = activeContracts.filter(c => c.planId === 'NC-I3').length;

  const currentCoin = COIN_CONFIGS[selectedCoin];
  const coinDecimals = selectedCoin === 'BTC' ? 8 : (selectedCoin === 'DOGE' || selectedCoin === 'RVN' ? 2 : 4);
  
  // Specific Rig hashrate and power
  const rigNominalHashrate = currentRig 
    ? Number(currentCoin.hashrates[currentRig.planId as 'NC-S1' | 'NC-P2' | 'NC-I3']) 
    : 0;
  const rigNominalPower = currentRig
    ? (currentRig.planId === 'NC-I3' ? 6500 : currentRig.planId === 'NC-P2' ? 3250 : 1250)
    : 0;

  // Calculate SVG curve paths dynamically based on stable chartData points
  const chartPoints = useMemo(() => {
    if (!hasActivePlan || chartData.length === 0) return [];
    
    // SVG viewBox: width=360, height=140
    return chartData.map((val, i) => {
      const x = (i / (chartData.length - 1)) * 300 + 40; // X from 40 to 340
      // Map val (ranging roughly from 95 to 105) to Y coordinates from 120 (bottom) to 20 (top)
      const y = 70 - (val - 100) * 8; // nominal 100% is at Y=70
      return { x, y };
    });
  }, [chartData, hasActivePlan]);

  const chartPathD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [chartPoints]);

  const chartAreaD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    return `${chartPathD} L ${last.x} 125 L ${first.x} 125 Z`;
  }, [chartPoints, chartPathD]);

  // Global pool indicators
  const coinHashrate = (totalStarter * Number(currentCoin.hashrates['NC-S1'])) + (totalPro * Number(currentCoin.hashrates['NC-P2'])) + (totalIndustrial * Number(currentCoin.hashrates['NC-I3']));
  const nominalHashrate = (totalStarter * 100) + (totalPro * 250) + (totalIndustrial * 500);
  const nominalPower = (totalStarter * 1250) + (totalPro * 3250) + (totalIndustrial * 6500);
  const nominalInvestment = activeContracts.reduce((sum, c) => {
    const plan = CLOUD_MINING_PLANS.find(p => p.code === c.planId);
    return sum + (plan?.price ?? 0);
  }, 0);

  // Hourly simulated yield logs
  const hourlyLogs = useMemo(() => {
    if (!hasActivePlan || !currentRig) return [];
    
    const logs = [];
    const now = new Date();
    
    // Average daily ROI is around 0.95% of plan cost. Convert from percentage e.g. 0.95 to fraction 0.0095
    const avgRoi = currentPlan ? ((currentPlan.minRoi + currentPlan.maxRoi) / 2) / 100 : 0.0095;
    const planPrice = CLOUD_MINING_PLANS.find(p => p.code === currentRig.planId)?.price ?? 329;
    const baseHourlyUsd = (planPrice * avgRoi) / 24;
    
    // Calculate elapsed hours since the contract was activated
    const createdAtTime = currentRig.createdAt ? new Date(currentRig.createdAt).getTime() : Date.now();
    const elapsedMs = Date.now() - createdAtTime;
    const elapsedHours = Math.max(0, Math.floor(elapsedMs / 3600000));
    
    // Show only the hours that have actually elapsed (up to 8 hours)
    const cyclesToShow = Math.min(8, elapsedHours);
    
    for (let i = 1; i <= cyclesToShow; i++) {
      const logTime = new Date(now.getTime() - i * 3600000);
      const ts = `${logTime.getHours().toString().padStart(2, '0')}:00`;
      
      // Deterministic seed based on i and planPrice so it doesn't flicker, but differs slightly
      const seed = Math.sin(i + planPrice) * 1000;
      const fluctuation = 1 + ((seed - Math.floor(seed)) - 0.5) * 0.12; // +/- 6% fluctuation
      
      const usdVal = baseHourlyUsd * fluctuation;
      const cryptoVal = usdVal / currentCoin.price;
      
      logs.push({
        time: ts,
        usd: usdVal,
        crypto: cryptoVal,
        coin: selectedCoin,
        node: `NODE_${currentRig.planId}_${selectedRigIndex + 1}`
      });
    }
    return logs;
  }, [hasActivePlan, currentRig, currentPlan, selectedCoin, selectedRigIndex, currentCoin.price]);

  // Pool share (user hashrate vs global pool EH)
  const userPoolSharePct = hasActivePlan
    ? ((coinHashrate / (selectedCoin === 'BTC' ? 1e6 : 1e3)) / POOL_TOTAL_HASHRATE_EH * 100).toFixed(6)
    : '0.000000';

  // Monitor and trigger config modal if rig is not locked to a coin
  useEffect(() => {
    if (hasActivePlan && currentRig) {
      const rigCoin = (balance as any)?.rigCoins?.[currentRig.id];
      if (!rigCoin) {
        setShowConfigModal(true);
      } else {
        setShowConfigModal(false);
        setSelectedCoin(rigCoin);
      }
    } else {
      setShowConfigModal(false);
    }
  }, [hasActivePlan, currentRig, balance]);

  // ── Live simulation ticker ──
  useEffect(() => {
    if (!hasActivePlan || !currentRig || !firebaseUser) {
      setLiveHashrate(0);
      setLiveTemp(24);
      setLivePower(0);
      setLiveBtcEarnings(0);
      return;
    }

    let startUSD = balance?.totalProfit ?? 0;

    // Persist visual progress in localStorage to prevent reset on reload/conmutation
    const localStorageKey = `nc_mining_accum_usd_${firebaseUser.uid}`;
    try {
      const cached = localStorage.getItem(localStorageKey);
      if (cached) {
        const cachedUSD = parseFloat(cached);
        const maxDailyYield = nominalInvestment * 0.02; // max reasonable daily margin
        if (cachedUSD >= startUSD && cachedUSD < startUSD + maxDailyYield) {
          startUSD = cachedUSD;
        }
      }
    } catch (err) {
      console.warn("Storage error:", err);
    }

    const startCoin = startUSD / currentCoin.price;
    setLiveBtcEarnings(startCoin);
    simulatedIncrementRef.current = 0;

    const incrementPerSec = ((nominalInvestment * 0.0095) / 86400) / currentCoin.price;
    const tickInterval = 200;
    const incrementPerTick = incrementPerSec * (tickInterval / 1000);

    const ticker = setInterval(() => {
      const fluctuation = (Math.random() - 0.5) * 0.03;
      setLiveHashrate(Number((rigNominalHashrate * (1 + fluctuation)).toFixed(selectedCoin === 'BTC' ? 1 : 2)));
      setLiveTemp(Math.floor(66 + Math.random() * 5));
      setLivePower(Math.floor(rigNominalPower * (1 + (Math.random() - 0.5) * 0.01)));
      
      simulatedIncrementRef.current += incrementPerTick;
      const currentTotalUSD = startUSD + (simulatedIncrementRef.current * currentCoin.price);
      
      try {
        localStorage.setItem(localStorageKey, currentTotalUSD.toString());
      } catch (e) {}

      setLiveBtcEarnings(currentTotalUSD / currentCoin.price);
    }, tickInterval);

    // Chart (Strictly stable hashrate oscillation, +/- 3% around the nominal 100%)
    setChartData(Array.from({ length: 30 }, () => 98.5 + Math.random() * 3));
    const chartTicker = setInterval(() => {
      setChartData(prev => {
        const next = [...prev.slice(1)];
        next.push(98.2 + Math.random() * 3.6);
        return next;
      });
    }, 2000);

    return () => {
      clearInterval(ticker);
      clearInterval(chartTicker);
    };
  }, [hasActivePlan, rigNominalHashrate, rigNominalPower, nominalInvestment, balance?.totalProfit, selectedCoin, currentRig]);

  // ── Block terminal ticker (only when active) ──
  useEffect(() => {
    if (!hasActivePlan || !currentRig) {
      setBlockTerminal([]);
      return;
    }

    const currentCoin = COIN_CONFIGS[selectedCoin];
    // Seed with initial lines
    const seed = Array.from({ length: 8 }, () => generateTerminalLine(rigNominalHashrate, selectedCoin, currentCoin.unit));
    setBlockTerminal(seed);

    const id = setInterval(() => {
      const line = generateTerminalLine(liveHashrate || rigNominalHashrate, selectedCoin, currentCoin.unit);
      setBlockTerminal(prev => {
        const next = [...prev, line];
        return next.slice(-40); // keep last 40 lines
      });
      // Auto-scroll
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 1200 + Math.random() * 800);

    return () => clearInterval(id);
  }, [hasActivePlan, rigNominalHashrate, selectedCoin, currentRig]);

  // Auto-scroll terminal on new lines
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [blockTerminal]);

  async function handleLogout() {
    try {
      await logout();
      showToast('Sesión cerrada correctamente.', 'info');
      router.push('/minado');
    } catch (err) {
      showToast('Error al cerrar sesión.', 'error');
    }
  }

  // ─────────────────────────────────────────────
  // 1. Loading Screen
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // 2. Lock Screen
  // ─────────────────────────────────────────────
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
            <Link href="/login" className="block w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:opacity-95 transition-all">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="block w-full py-4 rounded-xl font-semibold text-sm text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
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

  // ─────────────────────────────────────────────
  // 3. MAIN DASHBOARD
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white bg-[#060608] flex flex-col lg:flex-row relative" style={{ fontFamily: 'var(--font-geist-sans), Inter, sans-serif' }}>
      {/* Floating hash particles */}
      <MiningParticles active={hasActivePlan} />

      {/* Mining notifications toasts */}
      <MiningNotifications active={hasActivePlan} hasActivePlan={hasActivePlan} btcEarnings={liveBtcEarnings} coinSymbol={selectedCoin} coinPrice={currentCoin.price} />
      
      {/* ── Sidebar ── */}
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

      {/* ── Main Canvas ── */}
      <main className="flex-1 flex flex-col min-h-0 bg-[#060608] overflow-y-auto">
        
        {/* Header */}
        <header className="px-8 py-5 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#09090e]/50 backdrop-blur-md sticky top-0 z-30">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-500 tracking-wider">CORE_MINING_OS // CONTROLES</span>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">Terminal de Monitoreo ASIC</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Live BTC price */}
            <BtcPriceTicker />
            <Link 
              href="/minado/dashboard/deposits" 
              className="py-2.5 px-4 rounded-xl bg-amber-500 text-black font-bold text-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <ShoppingCart size={13} />
              Contratar Hashrate
            </Link>
          </div>
        </header>

        <div className="p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">

          {/* ── No active plan warning ── */}
          {!hasActivePlan && (
            <div className="rounded-2xl border border-amber-500/30 p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(6,6,8,0.9) 100%)' }}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/30 animate-pulse" />
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold">
                    <ShieldAlert size={12} />
                    ADVERTENCIA: HARDWARE INACTIVO
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-white">No tienes un contrato de Hashrate activo</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Tu nodo de minado NextCapital se encuentra actualmente <strong>desasignado y offline</strong>. Para activar tus procesadores físicos dedicados, monitorear la telemetría en tiempo real y empezar a generar ganancias diarias en piloto automático, debes adquirir un contrato de hashrate.
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

          {/* ── SECCIÓN DE CONTRATOS Y NODOS ASIC ── */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                <Cpu size={12} className="text-amber-500" />
                MIS NODOS ASIC Y CONTRATOS CONTRATADOS
              </span>
              {allMiningContracts.length > 0 && (
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {activeContracts.length} Activo(s) // {pendingContracts.length} Pendiente(s)
                </span>
              )}
            </div>

            {allMiningContracts.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-8 text-center flex flex-col items-center justify-center relative overflow-hidden group hover:border-amber-500/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center mb-4">
                  <ShieldAlert size={20} className="text-amber-500/60" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Sin Hardware Contratado</h4>
                <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
                  No posees ningún contrato de hashrate activo o en proceso de validación. Explora nuestro catálogo a continuación para aprovisionar hardware ASIC físico.
                </p>
                <Link
                  href="#adquirir-nodos"
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  Ver Catálogo de Potencia <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMiningContracts.map((contract, idx) => {
                  const plan = CLOUD_MINING_PLANS.find(p => p.code === contract.planId);
                  const isApproved = contract.status === 'approved';
                  const isPending = contract.status === 'pending' || contract.status === 'processing';
                  const isRejected = contract.status === 'rejected';

                  // If approved, find its index in activeContracts to handle selection click
                  const activeIdx = isApproved ? activeContracts.findIndex(c => c.id === contract.id) : -1;
                  const isSelected = isApproved && selectedRigIndex === activeIdx;

                  // Hardware name mapping
                  const hardwareName = plan?.tier === 'INDUSTRIAL' ? 'Antminer S19 XP' 
                                     : plan?.tier === 'PRO' ? 'Antminer S19 Pro' 
                                     : 'Antminer S19 SE';
                  
                  // Payment method parsing
                  let paymentType = 'Tarjeta (Stripe)';
                  if (contract.receiptUrl) paymentType = 'Transferencia Bancaria';
                  else if ((contract as any).phoneNumber || (contract as any).payphonePhone) paymentType = 'PayPhone Ecuador';

                  return (
                    <button
                      key={contract.id || idx}
                      disabled={!isApproved}
                      onClick={() => {
                        if (isApproved && activeIdx !== -1) {
                          setSelectedRigIndex(activeIdx);
                          showToast(`Conmutando telemetría a ASIC Node #${idx + 1} (${hardwareName}).`, 'info');
                          // Smooth scroll to gauge metric card or chart
                          document.getElementById('live-telemetry-section')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between min-h-[160px] transition-all relative outline-none w-full ${
                        isApproved
                          ? isSelected
                            ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)] cursor-pointer'
                            : 'border-white/5 bg-[#0d0d14] hover:border-white/10 cursor-pointer hover:shadow-lg'
                          : isPending
                          ? 'border-amber-500/20 border-dashed bg-amber-500/[0.02] cursor-help'
                          : 'border-red-500/20 bg-red-500/[0.02] cursor-help'
                      }`}
                    >
                      {/* Top Row: LED and Status */}
                      <div className="w-full flex justify-between items-center mb-3">
                        <div className="flex items-center gap-1.5">
                          <HardDrive size={14} className={isApproved ? (isSelected ? 'text-amber-400' : 'text-slate-400') : isPending ? 'text-amber-500/40' : 'text-red-500/40'} />
                          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-tighter">
                            NODE_{contract.planId}_{idx + 1}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            isApproved ? 'bg-emerald-500 animate-pulse' :
                            isPending ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                          }`} />
                          <span className={`text-[9px] font-mono font-bold uppercase ${
                            isApproved ? 'text-emerald-400' :
                            isPending ? 'text-amber-500' : 'text-red-400'
                          }`}>
                            {isApproved ? 'Activo & Minando' : isPending ? 'Pendiente' : 'Rechazado'}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Hardware info */}
                      <div className="my-2 space-y-1 w-full text-left flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-white">{hardwareName}</h4>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>Potencia: {plan?.hashrate || '100 TH/s'}</span>
                            <span className="text-slate-600">•</span>
                            <span className="font-mono text-[9px] text-amber-500">
                              {isApproved ? `Minando ${selectedCoin}` : 'Sin asignación'}
                            </span>
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            ${plan?.price || contract.amount} USD
                          </span>
                        </div>
                      </div>

                      {/* Bottom row: Meta & Action description */}
                      <div className="w-full border-t border-white/5 pt-3 mt-2 flex justify-between items-center text-left">
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-slate-500 font-mono">
                            Vía: {paymentType}
                          </p>
                          <p className="text-[9px] text-slate-600 font-mono">
                            Adquirido: {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('es-ES') : 'Reciente'}
                          </p>
                        </div>

                        {/* Interactive state helper */}
                        <div className="text-[9px] font-bold font-mono">
                          {isApproved ? (
                            isSelected ? (
                              <span className="text-amber-400 flex items-center gap-1">
                                <CheckCircle2 size={10} /> EN PANTALLA
                              </span>
                            ) : (
                              <span className="text-slate-500 transition-colors">
                                TELEMETRÍA →
                              </span>
                            )
                          ) : isPending ? (
                            <span className="text-amber-500/70 flex items-center gap-1" title="El pago está siendo revisado por un administrador de NextCapital. En breve se encenderá tu procesador ASIC.">
                              <Clock size={10} /> VALIDANDO...
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1" title="El depósito no fue validado. Reporta de nuevo o contacta a soporte.">
                              <XCircle size={10} /> RECHAZADO
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── METRICS GRID (4 cards) ── */}
          <div id="live-telemetry-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1 — Node State */}
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

            {/* Card 2 — Hashrate Gauge */}
            <div className="rounded-2xl p-5 border border-white/5 bg-[#0d0d14] flex flex-col items-center relative overflow-hidden group hover:border-amber-500/10 transition-colors">
              <div className="w-full flex justify-between items-start mb-1">
                <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">HASH RATE</span>
                <Activity size={14} className={hasActivePlan ? 'text-amber-500 animate-pulse' : 'text-slate-600'} />
              </div>
              <HashrateGauge
                value={hasActivePlan ? liveHashrate : 0}
                max={hasActivePlan ? coinHashrate * 1.15 : 100}
                unit={currentCoin.unit}
              />
              <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">
                {hasActivePlan ? `Algoritmo: ${currentCoin.algorithm}` : 'Sin potencia asignada'}
              </p>
            </div>

            {/* Card 3 — Temp & Power */}
            <div className="rounded-2xl p-5 border border-white/5 bg-[#0d0d14] flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">TELEMETRY</span>
                <HardDrive size={14} className={hasActivePlan ? 'text-amber-500' : 'text-slate-600'} />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-slate-400 text-xs font-medium">Temperatura del Chip</h4>
                  <div className="text-3xl font-black tracking-tight mt-1 flex items-baseline gap-1" style={{ color: hasActivePlan ? '#ffffff' : '#64748b' }}>
                    {hasActivePlan ? `${liveTemp}°C` : '22°C'}
                    <span className="text-xs text-slate-500 font-mono">NOMINAL</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-slate-400 text-xs font-medium">Consumo Eléctrico</h4>
                  <div className="text-xl font-black tracking-tight mt-0.5 flex items-baseline gap-1" style={{ color: hasActivePlan ? '#f59e0b' : '#64748b' }}>
                    {hasActivePlan ? `${livePower.toLocaleString()}` : '0'}
                    <span className="text-xs text-slate-500 font-mono">W</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4 — ROI */}
            <div className="rounded-2xl p-5 border border-white/5 bg-[#0d0d14] flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">YIELD DIARIO</span>
                <TrendingUp size={14} className={hasActivePlan ? 'text-amber-500' : 'text-slate-600'} />
              </div>
              <div>
                <h4 className="text-slate-400 text-xs font-medium">Rendimiento Estimado</h4>
                <div className="text-3xl font-black tracking-tight text-amber-500 mt-1 flex items-baseline gap-1">
                  {hasActivePlan ? (currentPlan ? `${currentPlan.minRoi.toFixed(2)}% - ${currentPlan.maxRoi.toFixed(2)}%` : '1.50% - 3.50%') : '0.00%'}
                  <span className="text-xs text-slate-500 font-mono">/DÍA</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  {hasActivePlan ? 'Capital variable asegurado' : 'Requiere contrato activo'}
                </p>
              </div>
            </div>
          </div>

          {/* ── BTC EARNINGS HERO PANEL ── */}
          <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
            {/* Ambient glow */}
            {hasActivePlan && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 20% 50%, ${currentCoin.glow}, transparent 60%)` }} />
            )}
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${hasActivePlan ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                GANANCIAS ACUMULADAS EN TIEMPO REAL
              </span>
              <div className="flex flex-col md:flex-row md:items-center gap-4 lg:gap-8 mt-3">
                {/* Dollar Earnings */}
                <div>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Valor Consolidado (USD)</p>
                  <div className="text-3xl lg:text-5xl font-black font-mono text-white tracking-tight flex items-baseline gap-1 mt-1">
                    <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.15)] animate-pulse">
                      {hasActivePlan ? `$${(liveBtcEarnings * currentCoin.price).toFixed(5)}` : '$0.00000'}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">USD</span>
                  </div>
                </div>

                {/* Arrow indicator */}
                {hasActivePlan && (
                  <div className="hidden md:flex items-center justify-center text-slate-700">
                    <ArrowRight size={20} />
                  </div>
                )}

                {/* Crypto equivalent */}
                <div>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Equivalencia en {currentCoin.name}</p>
                  <div className="text-2xl lg:text-4xl font-black font-mono text-white tracking-tight flex items-baseline gap-2 mt-1">
                    <span className={`${currentCoin.color} drop-shadow-[0_0_15px_rgba(245,158,11,0.15)]`}>
                      {hasActivePlan ? liveBtcEarnings.toFixed(selectedCoin === 'BTC' ? 8 : selectedCoin === 'DOGE' || selectedCoin === 'RVN' ? 2 : 4) : '0.00000000'}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">{currentCoin.symbol}</span>
                  </div>
                </div>
              </div>
              <div className="text-slate-500 font-medium text-[10px] mt-2">
                <div className="flex items-center gap-1 font-mono">
                  Ticker actual de red: 1 {currentCoin.symbol} = ${currentCoin.price.toLocaleString()} USD
                </div>
                
                {/* Locked Rig Coin Readout */}
                {hasActivePlan && currentRig && (
                  <div className="mt-2.5 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Algoritmo del ASIC:</span>
                      <span className="px-3 py-1.5 rounded-full text-[9px] font-black tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        {currentCoin.algorithm} // MINANDO DEDICADO: {currentCoin.symbol}
                      </span>
                      
                      <button
                        onClick={() => setShowCoinHelp(!showCoinHelp)}
                        className={`px-2.5 py-1.5 rounded-full text-[9px] font-bold border flex items-center gap-1 transition-all outline-none cursor-pointer ${
                          showCoinHelp
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-white/5 text-slate-400 hover:text-amber-400 hover:bg-white/10 border-white/5'
                        }`}
                      >
                        <HelpCircle size={10} />
                        ¿Cómo entender el Hashrate?
                      </button>
                    </div>

                    {showCoinHelp && (
                      <div className="mt-2 p-4 rounded-xl bg-black/40 border border-amber-500/20 text-[11px] text-slate-400 leading-relaxed space-y-2.5 animate-fade-in max-w-xl text-left">
                        <p className="font-bold text-slate-300 flex items-center gap-1 font-mono">
                          <Cpu size={12} className="text-amber-500" />
                          Complejidad Algorítmica & Hashrate
                        </p>
                        <p>
                          Tu Antminer está optimizado físicamente para minar **{currentCoin.symbol}** de forma permanente. Cada algoritmo de minado tiene una complejidad matemática diferente:
                        </p>
                        <p>
                          1. <strong className="text-white">SHA-256 (Bitcoin)</strong>: Es una fórmula matemática de hash directa y simple. Tus procesadores pueden hacer Terahashes (billones de hashes por segundo, ej: **{currentCoin.hashrates[currentRig.planId as 'NC-S1' | 'NC-P2' | 'NC-I3']} TH/s**).
                        </p>
                        <p>
                          2. <strong className="text-white">Scrypt (Litecoin/Dogecoin)</strong>: Es un algoritmo muy denso que requiere memoria física RAM ultrarrápida dentro del chip. Por eso, el hashrate físico es menor y se mide en Gigahashes (millones por segundo, ej: **{COIN_CONFIGS['LTC'].hashrates[currentRig.planId as 'NC-S1' | 'NC-P2' | 'NC-I3']} GH/s**).
                        </p>
                        <p>
                          3. <strong className="text-white">Rendimiento en USD Equivalente</strong>: Aunque los números de hashrate sean diferentes, un nodo de Scrypt de 3.0 GH/s consume exactamente la misma energía física y genera **el mismo rendimiento limpio en dólares (~$3.29 USD diarios)** que 250 TH/s de SHA-256. La ganancia en USD es la misma, la diferencia es puramente matemática del algoritmo del chip.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto relative z-10">
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
          {/* ── POOL STATS PANEL ── */}
          <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5 lg:p-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-5">
              <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
                <Globe size={14} className="text-amber-500" />
                NEXTCAPITAL GLOBAL MINING POOL
              </span>
              <span className="text-[9px] font-mono text-slate-600 uppercase">Actualización en tiempo real</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center">
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-2">Pool Hashrate</div>
                <div className="text-xl font-black text-white font-mono">{POOL_TOTAL_HASHRATE_EH}</div>
                <div className="text-[9px] font-mono text-amber-500 mt-0.5">EH/s</div>
              </div>
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center">
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-2">Bloques Hoy</div>
                <div className="text-xl font-black text-white font-mono">{POOL_BLOCKS_TODAY}</div>
                <div className="text-[9px] font-mono text-amber-500 mt-0.5">BLOQUES MINADOS</div>
              </div>
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center">
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-2">Tu Participación</div>
                <div className="text-xl font-black font-mono" style={{ color: hasActivePlan ? '#f59e0b' : '#64748b' }}>
                  {userPoolSharePct}%
                </div>
                <div className="text-[9px] font-mono text-slate-500 mt-0.5">DEL POOL TOTAL</div>
              </div>
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center">
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-2">Próximo Pago</div>
                <div className="text-lg font-black text-green-400 font-mono tabular-nums">{payoutCountdown}</div>
                <div className="text-[9px] font-mono text-slate-500 mt-0.5">UTC MIDNIGHT</div>
              </div>
            </div>
          </div>

          {/* ── LIVE TELEMETRY CHART + BLOCK TERMINAL ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart */}
            <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5 flex flex-col h-[300px] justify-between">
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-2">
                <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
                  <Activity size={14} className="text-amber-500 animate-pulse" />
                  RENDIMIENTO DE HASHRATE EN VIVO
                </span>
                <span className="text-[10px] font-mono text-slate-600">Intervalo: 2s</span>
              </div>
              
              <div className="relative h-[190px] w-full bg-black/40 rounded-xl border border-white/5 p-3 overflow-hidden select-none flex items-center justify-center">
                {hasActivePlan && chartData.length > 0 ? (
                  <svg viewBox="0 0 360 140" className="w-full h-full">
                    {/* Grids and targets */}
                    <line x1="40" y1="20" x2="340" y2="20" stroke="rgba(255,255,255,0.02)" strokeWidth="0.75" />
                    <line x1="40" y1="70" x2="340" y2="70" stroke="rgba(245,158,11,0.12)" strokeWidth="0.75" strokeDasharray="3 4" />
                    <line x1="40" y1="120" x2="340" y2="120" stroke="rgba(255,255,255,0.02)" strokeWidth="0.75" />
                    
                    {/* Y-Axis Labels */}
                    <text x="35" y="23" textAnchor="end" fill="#475569" fontSize="7.5" fontFamily="monospace">
                      {(rigNominalHashrate * 1.05).toFixed(1)}
                    </text>
                    <text x="35" y="73" textAnchor="end" fill="#f59e0b" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                      {rigNominalHashrate.toFixed(1)}
                    </text>
                    <text x="35" y="123" textAnchor="end" fill="#475569" fontSize="7.5" fontFamily="monospace">
                      {(rigNominalHashrate * 0.95).toFixed(1)}
                    </text>
                    
                    {/* Target legend text */}
                    <text x="45" y="16" fill="#64748b" fontSize="6.5" fontFamily="monospace">OBJETIVO ({currentCoin.unit})</text>
                    
                    {/* Glow Filter */}
                    <defs>
                      <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path d={chartAreaD} fill="url(#chartAreaGrad)" />
                    
                    {/* Average flat line (cyan/green) */}
                    <line x1="40" y1="71" x2="340" y2="71" stroke="#10b981" strokeWidth="1" strokeDasharray="5 5" opacity="0.7" />
                    <text x="335" y="65" textAnchor="end" fill="#10b981" fontSize="6.5" fontFamily="monospace">AVG (99.8%)</text>

                    {/* Real-time curve */}
                    <path
                      d={chartPathD}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: 'drop-shadow(0 0 3px rgba(245,158,11,0.5))' }}
                    />
                  </svg>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <ShieldAlert size={28} className="text-slate-600 mb-2" />
                    <p className="text-xs text-slate-500 font-mono uppercase">SIN ACTIVIDAD TELEMÉTRICA</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-2 px-1">
                <span>-60s</span>
                <span>DESVIACIÓN MÁXIMA: +/- 3.0%</span>
                <span>AHORA</span>
              </div>
            </div>

            {/* Block Terminal */}
            <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5 flex flex-col h-[300px] justify-between">
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-2">
                <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
                  <Terminal size={14} className="text-amber-500" />
                  BLOCK VALIDATION TERMINAL
                </span>
                {hasActivePlan && (
                  <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <div
                ref={terminalRef}
                className="h-[190px] overflow-y-auto overflow-x-hidden font-mono text-[10px] leading-relaxed space-y-1 bg-black/60 rounded-xl p-3 border border-white/5 no-scrollbar"
                style={{
                  scrollBehavior: 'smooth',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {/* Safe CSS injection to hide Chrome/Safari scrollbars in terminal */}
                <style dangerouslySetInnerHTML={{__html: `
                  .no-scrollbar::-webkit-scrollbar {
                    display: none !important;
                  }
                `}} />

                {hasActivePlan ? (
                  blockTerminal.map((line, i) => {
                    const isPool = line.includes('[POOL]');
                    const isSys = line.includes('[SYS]');
                    const isNet = line.includes('[NET]');
                    const isCore = line.includes('[CORE]');
                    
                    return (
                      <div
                        key={i}
                        className="break-all whitespace-pre-wrap"
                        style={{
                          color: isPool ? '#86efac' : isSys ? '#f59e0b' : isNet ? '#60a5fa' : isCore ? '#e2e8f0' : '#64748b',
                          opacity: Math.max(0.35, (i / blockTerminal.length)),
                        }}
                      >
                        {line}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Terminal size={24} className="text-slate-600 mb-2" />
                    <p className="text-slate-500 text-[10px] uppercase">Terminal inactiva — Sin contrato activo</p>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-2 px-1">
                <span>ESTADO // STRATUM CONECTADO</span>
                <span>VERIFICANDO ACCESOS</span>
                <span>ACTIVO</span>
              </div>
            </div>
          </div>

          {/* ── NODOS ASIC + HISTORIAL HORARIO DE ACREDITACIONES ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Column 1: Nodos Asignados (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-white/5 bg-[#0d0d14] p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                  <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
                    <HardDrive size={14} className="text-amber-500" />
                    NODOS ASIC ASIGNADOS A TU CUENTA
                  </span>
                  {hasActivePlan && (
                    <span className="text-[9px] font-mono text-slate-500">{activeContracts.length} nodo(s) activo(s)</span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hasActivePlan ? (
                    activeContracts.map((contract, i) => {
                      const plan = CLOUD_MINING_PLANS.find(p => p.code === contract.planId);
                      return (
                        <div 
                          key={contract.id || i}
                          className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 flex items-center justify-between transition-all hover:border-amber-500/25 hover:bg-amber-500/8"
                        >
                          <div className="space-y-1">
                            <div className="text-xs font-mono font-bold text-amber-400">
                              NODE_{contract.planId}_{i + 1}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {plan?.tier === 'INDUSTRIAL' ? 'Antminer S19 XP Dedicated' : plan?.tier === 'PRO' ? 'Antminer S19 Pro' : 'Antminer S19 SE'}
                            </div>
                            <div className="text-[9px] font-mono text-slate-600">
                              Uptime: {(99.5 + Math.random() * 0.5).toFixed(2)}%
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-xs font-mono text-white font-bold">{`${currentCoin.hashrates[(contract.planId as 'NC-S1' | 'NC-P2' | 'NC-I3') ?? 'NC-S1']} ${currentCoin.unit}`}</div>
                            <div className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                              ONLINE
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 flex flex-col items-center justify-center text-center py-10">
                      <Cpu size={32} className="text-slate-700 mb-3" />
                      <p className="text-xs font-mono text-slate-500 uppercase">Sin nodos asignados</p>
                      <p className="text-[10px] text-slate-600 mt-1 max-w-xs">Ningún hardware ASIC está asignado actualmente a este usuario.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Historial Horario de Acreditaciones (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-[#0d0d14] p-5 flex flex-col">
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
                  <Activity size={14} className="text-amber-500" />
                  ACREDITACIONES HORARIAS ASIC (ÚLTIMAS 8H)
                </span>
                {hasActivePlan && (
                  <span className="flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE ACCRUAL
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-2 md:space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {hasActivePlan ? (
                  hourlyLogs.length > 0 ? (
                    hourlyLogs.map((log, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] hover:border-white/10 transition-colors">
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-bold">{log.time}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-[9px] text-slate-500">{log.node}</span>
                          </div>
                          <div className="text-emerald-400 font-bold">
                            +{formatCurrency(log.usd)} USD
                          </div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <div className={`${currentCoin.color} font-bold`}>
                            +{log.crypto.toFixed(coinDecimals)} {log.coin}
                          </div>
                          <span className="text-[7.5px] font-bold px-1.5 py-0.2 rounded bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-tighter">
                            Acreditado
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-8 h-full space-y-3 bg-amber-500/[0.02] border border-dashed border-amber-500/10 rounded-2xl p-5">
                      <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Nodo ASIC Sincronizado</p>
                        <p className="text-[11px] text-slate-400 mt-2 max-w-[280px] mx-auto leading-relaxed">
                          Tu procesador físico está aportando potencia al pool y validando transacciones en tiempo real. Tu primer bloque de ganancias horarias se acreditará al completar el ciclo. (Estado: Minando...)
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-10 h-full">
                    <Activity size={28} className="text-slate-700 mb-2" />
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Sin potencia activa</p>
                    <p className="text-[9px] text-slate-600 mt-1 max-w-xs leading-relaxed">Las acreditaciones horarias automáticas se activarán al encender tu nodo ASIC.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── PLAN MARKETPLACE ── */}
          <section id="adquirir-nodos" className="pt-4">
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
                      <span className="bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg flex items-center gap-1">
                        <Award size={9} /> MÁS ELEGIDO
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
                        ? { color: '#000', background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 5px 15px rgba(245,158,11,0.2)' }
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

          {/* ── WORLD MAP ── */}
          <MiningWorldMap userHashrate={hasActivePlan ? liveHashrate : 0} />

          {/* ── PROFIT CALCULATOR ── */}
          <ProfitCalculator currentBalance={balance?.totalDeposited ?? 0} />

          {/* ── ACHIEVEMENTS ── */}
          <MiningAchievements
            hasActivePlan={hasActivePlan}
            totalProfit={balance?.totalProfit ?? 0}
            activeContractCount={activeContracts.length}
            planCodes={activeContracts.map(c => c.planId ?? '')}
          />

          {/* ── REFERRAL PANEL ── */}
          {firebaseUser && (
            <ReferralPanel
              userId={firebaseUser.uid}
              userName={appUser?.name ?? 'Inversor'}
            />
          )}

          {/* ── ASIC COIN LOCKING MODAL ── */}
          {showConfigModal && currentRig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
              <div className="w-full max-w-3xl rounded-3xl border border-amber-500/30 bg-[#0d0d14] p-8 sm:p-10 shadow-[0_0_50px_rgba(245,158,11,0.2)] space-y-8 relative animate-fade-in text-left">
                
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-white/5 pb-5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <Cpu className="text-amber-500 animate-pulse" size={24} />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-500 tracking-wider">CORE_MINING_OS // CONFIGURACIÓN INICIAL DE HARDWARE</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mt-1">Configurar Algoritmo del ASIC</h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Felicidades, tu nodo físico dedicado <strong className="text-white text-base">NODE_{currentRig.planId}</strong> está listo y online. 
                  Antes de iniciar el minado, debes asignar qué algoritmo de circuito integrado ejecutará. 
                  Debido al diseño físico de los microchips de minería, <strong className="text-amber-400">esta selección es permanente y optimizará de forma fija este hardware.</strong>
                </p>

                {/* Coin Cards Selector Grid */}
                <div className="space-y-3">
                  <span className="text-xs sm:text-sm font-mono font-bold text-slate-400 uppercase tracking-widest block">Selecciona el Algoritmo a Grabar:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {(Object.keys(COIN_CONFIGS) as Array<keyof typeof COIN_CONFIGS>).map((symbol) => {
                      const c = COIN_CONFIGS[symbol];
                      const active = modalSelectedCoin === symbol;
                      const hashrate = c.hashrates[currentRig.planId as 'NC-S1' | 'NC-P2' | 'NC-I3'];
                      
                      return (
                        <button
                          key={symbol}
                          onClick={() => setModalSelectedCoin(symbol)}
                          className={`p-4 rounded-2xl border text-center flex flex-col justify-between min-h-[130px] transition-all outline-none cursor-pointer ${
                            active
                              ? 'border-amber-500 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.15)] text-white scale-[1.03]'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/8 hover:scale-[1.01]'
                          }`}
                        >
                          <div className="w-full text-center space-y-1">
                            <span className="text-lg font-black font-mono block tracking-tight">{symbol}</span>
                            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">{c.algorithm}</span>
                          </div>
                          
                          <div className="w-full text-center mt-3 pt-3 border-t border-white/5 space-y-0.5">
                            <span className={`text-sm sm:text-base font-black font-mono block ${active ? 'text-amber-400' : 'text-slate-300'}`}>{hashrate}</span>
                            <span className="text-[9px] text-slate-500 font-mono block uppercase tracking-wider">{c.unit}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Educational Info box */}
                <div className="p-6 sm:p-8 rounded-2xl bg-black/50 border border-white/10 text-sm sm:text-base text-slate-300 leading-relaxed space-y-4 shadow-inner">
                  <span className="text-sm sm:text-base font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Coins size={18} className="text-amber-500 animate-pulse" />
                    Guía Informativa: ¿Por qué varían los números de hashrate?
                  </span>
                  <p className="text-slate-400">
                    Cada algoritmo de hash tiene una dificultad matemática diferente. El hashrate mide cuántas operaciones puede procesar tu chip por segundo:
                  </p>
                  <ul className="space-y-3 text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold mt-1">•</span>
                      <span><strong className="text-white font-semibold">SHA-256 (BTC)</strong>: Es un cálculo rápido y directo, permitiendo TeraHashes (<strong className="text-white">billones de hashes/segundo</strong>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold mt-1">•</span>
                      <span><strong className="text-white font-semibold">Scrypt (LTC/DOGE)</strong>: Requiere memoria física de ultra-alta velocidad en el chip, operando en GigaHashes (<strong className="text-white">millones de hashes/segundo</strong>).</span>
                    </li>
                    <li className="flex items-start gap-2 border-t border-white/5 pt-3 mt-3">
                      <span className="text-emerald-400 font-bold mt-1">✓</span>
                      <span><strong className="text-emerald-400 font-semibold">Rendimiento en USD Equivalente</strong>: Independientemente de la moneda, <strong className="text-white">el consumo de energía es idéntico y la rentabilidad neta en dólares será exactamente la misma</strong> (ej. ~$3.29 USD/día en el plan PRO). La diferencia en los números es puramente matemática de la red.</span>
                    </li>
                  </ul>
                </div>

                {/* Action button */}
                <div className="pt-2 flex flex-col sm:flex-row gap-4">
                  <button
                    disabled={configLoading}
                    onClick={saveRigCoin}
                    className="flex-1 py-5 rounded-2xl font-black text-base sm:text-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:opacity-95 disabled:opacity-50 active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(245,158,11,0.25)] cursor-pointer"
                  >
                    {configLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
                        Configurando e Inicializando microchips del ASIC...
                      </span>
                    ) : (
                      `Confirmar y Encender ASIC minando ${modalSelectedCoin}`
                    )}
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
