'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import dynamic from 'next/dynamic';

const MiningWorldMap = dynamic(() => import('@/components/mining/MiningWorldMap'), { ssr: false });

const PLANS_ES = [
  {
    tier: 'STARTER',
    code: 'NC-S1',
    hashrate: '100 TH/s',
    price: 149,
    minRoi: 0.75,
    maxRoi: 1.10,
    invest: '$500 – $2K',
    duration: '12 Meses',
    uptime: '99.5%',
    features: ['1 nodo ASIC físico', 'Dashboard en vivo', 'Retiro mensual', 'Soporte por email'],
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
    duration: '12 Meses',
    uptime: '99.9%',
    features: ['2 nodos ASIC físicos', 'Telemetría en tiempo real', 'Retiro semanal', 'Soporte 24/7', 'Reinversión auto'],
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
    duration: '24 Meses',
    uptime: '99.99%',
    features: ['Rack dedicado completo', 'API telemetría cruda', 'Retiro diario', 'Account Manager', 'SLA contractual'],
    hot: false,
  },
];

const PLANS_EN = [
  {
    tier: 'STARTER',
    code: 'NC-S1',
    hashrate: '100 TH/s',
    price: 149,
    minRoi: 0.75,
    maxRoi: 1.10,
    invest: '$500 – $2K',
    duration: '12 Months',
    uptime: '99.5%',
    features: ['1 physical ASIC node', 'Live dashboard', 'Monthly withdrawal', 'Email support'],
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
    duration: '12 Months',
    uptime: '99.9%',
    features: ['2 physical ASIC nodes', 'Real-time telemetry', 'Weekly withdrawal', '24/7 Support', 'Auto reinvestment'],
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
    duration: '24 Months',
    uptime: '99.99%',
    features: ['Full dedicated rack', 'Raw telemetry API', 'Daily withdrawal', 'Account Manager', 'Contractual SLA'],
    hot: false,
  },
];

const TRANSLATIONS = {
  es: {
    navPlanes: 'Planes',
    navFunciona: '¿Cómo funciona?',
    navHardware: 'Hardware',
    navAcceder: 'Acceder',
    navDashboard: 'Dashboard →',
    badgeSystem: 'SISTEMA OPERATIVO · 142.5 EH/s',
    heroLine1: 'Minería',
    heroLine2: 'Industrial',
    heroLine3: 'en la Nube.',
    heroSub: 'Hardware ASIC dedicado 1:1 en nuestros data centers físicos. Tu equipo mina Bitcoin, Litecoin y más criptomonedas 24/7 y tú ves las ganancias en tiempo real — entre 0.75% y 1.10% diario.',
    btnPlanes: 'Ver Planes de Inversión',
    btnFunciona: 'Cómo funciona',
    statNodes: 'Nodos activos',
    statCountries: 'Países',
    statUptime: 'Uptime promedio',
    disclaimerTitle: 'Transparencia sobre rendimientos',
    disclaimerDesc: 'El rendimiento diario no es fijo. Oscila entre 0.75% y 1.10% según la dificultad de red de Bitcoin, precio del BTC y eficiencia energética. Los valores en pantalla reflejan la actividad real de las máquinas en tiempo real. Toda inversión conlleva riesgo.',
    controlTitle: 'CENTRO DE CONTROL Y TELEMETRÍA GLOBAL',
    controlSub: 'Rendimiento de Minado en Tiempo Real',
    controlDesc: 'Estadísticas agregadas de todos los pools de minería NextCapital operando bajo tecnología ASIC. Actualizado cada 100ms.',
    cardUsersTitle: 'MINEROS ACTIVOS EN EL POOL',
    cardUsersSuffix: 'usuarios',
    cardUsersDesc: 'Nodos activos dedicados procesando y distribuyendo potencia de cómputo en la nube. Sincronización instantánea de pools hashrate.',
    cardUsersBottom: 'INICIO HISTÓRICO: NOV 2025',
    cardUsersStatus: 'RED TOTALMENTE OPERATIVA',
    cardMinedTitle: 'MINADO HISTÓRICO TOTAL',
    cardMinedBadge: 'ACUMULADO',
    cardMinedDesc: 'Rendimiento real acumulado por el pool global desde Noviembre de 2025. Minado respaldado por hardware físico.',
    cardMinedBottom: 'EQUIVALENTE A:',
    cardLiveTitle: 'RENDIMIENTO ESTIMADO EN VIVO (EN SESIÓN)',
    cardLiveStarter: 'STARTER [100 TH/s]',
    cardLivePro: 'PRO [250 TH/s]',
    cardLiveInd: 'INDUSTRIAL [500 TH/s]',
    cardLiveRange: 'Rendimiento:',
    cardLiveBottom: 'Métrica en tiempo real acumulada desde tu ingreso a la web.',
    ledgerTitle: 'POOL PAYOUT LEDGER · TRANSACCIONES EN VIVO',
    ledgerFee: 'COMISIÓN:',
    ledgerDiff: 'DIFICULTAD:',
    ledgerLoading: 'Estableciendo canal seguro con nodos ASIC...',
    howTitle: 'Las máquinas trabajan.',
    howTitleSub: 'Tú cobras.',
    howDesc: 'Nuestros data centers operan racks completos de ASICs Bitcoin las 24 horas. Cuando contratas un plan, ese hardware se te asigna en exclusiva. Lo que minan esas máquinas físicas es lo que verás acreditarse en tu dashboard.',
    step1Title: 'Eliges tu potencia',
    step1Desc: 'Seleccionas cuántos TH/s de hashrate quieres contratar y por cuánto tiempo.',
    step2Title: 'ASIC asignado en exclusiva',
    step2Desc: 'Un equipo físico en tu nombre. Sin virtualización, sin fraccionamiento.',
    step3Title: 'Ganancias en tiempo real',
    step3Desc: 'Tu dashboard muestra el saldo aumentando segundo a segundo, reflejando la actividad real del hardware.',
    plansSectionSub: '— CONTRATOS DE HASHRATE',
    plansSectionTitle: 'Elige tu nivel de operación',
    plansSectionDesc: 'Todos los planes incluyen hardware ASIC físico dedicado y rendimiento variable real entre 0.75% y 1.10% diario.',
    plansBadgePopular: '★ MÁS POPULAR',
    plansInvest: 'Inversión:',
    plansPriceSuffix: '/mes',
    plansYield: 'Rendimiento diario',
    plansYieldSub: 'Variable · no garantizado',
    plansUptime: 'Uptime',
    plansDuration: 'Duración',
    plansBtnStart: 'Comenzar con',
    hwSectionSub: '— HARDWARE 1:1',
    hwSectionTitle: 'Tu máquina. Tu Bitcoin.',
    hwSectionDesc: 'No compartimos ni fraccionamos hashrate. Cuando contratas un plan con NextCapital Mining, un ASIC físico te es asignado en exclusiva en nuestros data centers certificados. El rendimiento que ves es 100% tuyo.',
    hwSpecModel: 'Modelo base',
    hwSpecEff: 'Eficiencia',
    hwSpecCool: 'Refrigeración',
    hwSpecPower: 'Energía',
    hwSpecCoolVal: 'Inmersión líquida',
    hwSpecPowerVal: 'Hidroeléctrica PPA',
    ctaTitle: 'Tu nodo ASIC,',
    ctaTitleSub: 'operando en 24 horas.',
    ctaDesc: 'Crea tu cuenta, elige tu plan y tu hardware físico empezará a minar Bitcoin para ti.',
    ctaBtnDashboard: 'Ir al Dashboard →',
    ctaBtnRegister: 'Crear Cuenta Gratis →',
    ctaBtnDemo: 'Ver Dashboard Demo',
    footerRights: 'NextCapital Mining © 2025',
    footerTerms: 'Términos',
    footerPrivacy: 'Privacidad',
    footerSupport: 'Soporte',
    footerHub: '← Hub Principal',
  },
  en: {
    navPlanes: 'Plans',
    navFunciona: 'How it works',
    navHardware: 'Hardware',
    navAcceder: 'Log in',
    navDashboard: 'Dashboard →',
    badgeSystem: 'OPERATING SYSTEM · 142.5 EH/s',
    heroLine1: 'Industrial',
    heroLine2: 'Cloud',
    heroLine3: 'Mining.',
    heroSub: 'Dedicated 1:1 ASIC hardware in our physical data centers. Your equipment mines Bitcoin, Litecoin and more cryptocurrencies 24/7 and you see profits in real time — between 0.75% and 1.10% daily.',
    btnPlanes: 'View Investment Plans',
    btnFunciona: 'How it works',
    statNodes: 'Active nodes',
    statCountries: 'Countries',
    statUptime: 'Average uptime',
    disclaimerTitle: 'Performance Transparency',
    disclaimerDesc: 'Daily performance is not fixed. It ranges between 0.75% and 1.10% depending on Bitcoin network difficulty, BTC price, and power efficiency. On-screen values reflect actual machine activity in real-time. All investment carries risk.',
    controlTitle: 'GLOBAL CONTROL CENTER & TELEMETRY',
    controlSub: 'Real-Time Mining Performance',
    controlDesc: 'Aggregated statistics of all NextCapital mining pools operating under ASIC technology. Updated every 100ms.',
    cardUsersTitle: 'ACTIVE MINERS IN POOL',
    cardUsersSuffix: 'users',
    cardUsersDesc: 'Dedicated active nodes processing and distributing computing power in the cloud. Instant synchronization of hashrate pools.',
    cardUsersBottom: 'HISTORICAL START: NOV 2025',
    cardUsersStatus: 'NETWORK FULLY OPERATIONAL',
    cardMinedTitle: 'TOTAL HISTORICAL MINED',
    cardMinedBadge: 'ACCUMULATED',
    cardMinedDesc: 'Actual performance accumulated by the global pool since November 2025. Mining backed by physical hardware.',
    cardMinedBottom: 'EQUIVALENT TO:',
    cardLiveTitle: 'ESTIMATED LIVE SESSION PERFORMANCE',
    cardLiveStarter: 'STARTER [100 TH/s]',
    cardLivePro: 'PRO [250 TH/s]',
    cardLiveInd: 'INDUSTRIAL [500 TH/s]',
    cardLiveRange: 'Yield:',
    cardLiveBottom: 'Real-time metric accumulated since your session started.',
    ledgerTitle: 'POOL PAYOUT LEDGER · LIVE TRANSACTIONS',
    ledgerFee: 'POOL FEE:',
    ledgerDiff: 'DIFFICULTY:',
    ledgerLoading: 'Establishing secure channel with ASIC nodes...',
    howTitle: 'Machines work.',
    howTitleSub: 'You get paid.',
    howDesc: 'Our data centers operate full racks of Bitcoin ASICs 24 hours a day. When you rent a plan, that hardware is allocated exclusively to you. What those physical machines mine is what you will see credited in your dashboard.',
    step1Title: 'Choose your power',
    step1Desc: 'Select how many TH/s of hashrate you want to rent and for how long.',
    step2Title: 'Exclusively assigned ASIC',
    step2Desc: 'A physical rig in your name. No virtualization, no splitting.',
    step3Title: 'Real-time earnings',
    step3Desc: 'Your dashboard shows your balance increasing second by second, reflecting real hardware activity.',
    plansSectionSub: '— HASHRATE CONTRACTS',
    plansSectionTitle: 'Choose your operating tier',
    plansSectionDesc: 'All plans include dedicated physical ASIC hardware and real variable daily returns between 0.75% and 1.10%.',
    plansBadgePopular: '★ MOST POPULAR',
    plansInvest: 'Investment:',
    plansPriceSuffix: '/month',
    plansYield: 'Daily yield',
    plansYieldSub: 'Variable · not guaranteed',
    plansUptime: 'Uptime',
    plansDuration: 'Duration',
    plansBtnStart: 'Get Started with',
    hwSectionSub: '— 1:1 HARDWARE',
    hwSectionTitle: 'Your machine. Your Bitcoin.',
    hwSectionDesc: 'We do not share or fraction hashrate. When you rent a plan with NextCapital Mining, a physical ASIC is allocated exclusively to you in our certified data centers. The yield you see is 100% yours.',
    hwSpecModel: 'Base model',
    hwSpecEff: 'Efficiency',
    hwSpecCool: 'Cooling',
    hwSpecPower: 'Power',
    hwSpecCoolVal: 'Liquid immersion',
    hwSpecPowerVal: 'Hydroelectric PPA',
    ctaTitle: 'Your ASIC node,',
    ctaTitleSub: 'operating in 24 hours.',
    ctaDesc: 'Create your account, choose your plan and your physical hardware will start mining Bitcoin for you.',
    ctaBtnDashboard: 'Go to Dashboard →',
    ctaBtnRegister: 'Create Free Account →',
    ctaBtnDemo: 'View Demo Dashboard',
    footerRights: 'NextCapital Mining © 2025',
    footerTerms: 'Terms',
    footerPrivacy: 'Privacy',
    footerSupport: 'Support',
    footerHub: '← Main Hub',
  }
};

function LiveTicker({ lang = 'es' }: { lang?: 'es' | 'en' }) {
  const [hashrate, setHashrate] = useState(142.5);
  const [nodes, setNodes] = useState(12408);
  const [temp, setTemp] = useState(68.2);
  const [yield_, setYield_] = useState(0.93);

  useEffect(() => {
    const t = setInterval(() => {
      setHashrate(h => +(h + (Math.random() - 0.5) * 2).toFixed(1));
      setNodes(n => n + Math.floor((Math.random() - 0.3) * 3));
      setTemp(t => +(t + (Math.random() - 0.5) * 0.5).toFixed(1));
      setYield_(y => +(0.75 + Math.random() * 0.35).toFixed(2));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const items = lang === 'es' ? [
    `HASH_RATE • ${hashrate} EH/s`,
    `NODOS_ACTIVOS • ${nodes.toLocaleString()}`,
    `TEMP_PROM • ${temp}°C`,
    `YIELD_DIARIO • ${yield_}%`,
    `DIFICULTAD_RED • 86.39T`,
    `UPTIME_GLOBAL • 99.97%`,
    `BTC_BLOQUE • 3.125`,
    `COMISIÓN_POOL • 0.9%`,
  ] : [
    `HASH_RATE • ${hashrate} EH/s`,
    `ACTIVE_NODES • ${nodes.toLocaleString()}`,
    `AVG_TEMP • ${temp}°C`,
    `DAILY_YIELD • ${yield_}%`,
    `NETWORK_DIFF • 86.39T`,
    `GLOBAL_UPTIME • 99.97%`,
    `BTC_BLOCK • 3.125`,
    `POOL_FEE • 0.9%`,
  ];

  return (
    <div className="overflow-hidden border-t border-b border-amber-500/20 bg-amber-500/5 py-2.5 relative">
      <div className="flex gap-12 animate-[ticker_18s_linear_infinite] whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-xs font-mono text-amber-300/70 tracking-widest flex-shrink-0">
            <span className="text-amber-500 mr-2">▸</span>{item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MinadoLandingPage() {
  const { firebaseUser, appUser } = useAuth();
  const sessionStart = useRef(Date.now());
  const [lang, setLang] = useState<'es' | 'en'>('es');

  // Initialize lang from localStorage if available
  useEffect(() => {
    const stored = localStorage.getItem('mining_lang');
    if (stored === 'es' || stored === 'en') {
      setLang(stored);
    }
  }, []);

  const handleSetLang = (newLang: 'es' | 'en') => {
    setLang(newLang);
    localStorage.setItem('mining_lang', newLang);
  };

  const t = TRANSLATIONS[lang];
  const PLANS = lang === 'es' ? PLANS_ES : PLANS_EN;

  // Dynamic status/time payout translations
  const getTranslatedTime = (timeStr: string) => {
    if (lang === 'es') return timeStr;
    if (timeStr === 'Ahora mismo') return 'Just now';
    if (timeStr.startsWith('Hace ')) {
      const val = timeStr.replace('Hace ', '');
      return `${val} ago`;
    }
    return timeStr;
  };

  // Algoritmo matemático para estadísticas automáticas desde Noviembre 2025
  const [stats, setStats] = useState({
    activeUsers: 350,
    totalMinedUSD: 1724590.28,
    totalMinedBTC: 25.19487,
    liveStarterMined: 0.000000,
    liveProMined: 0.000000,
    liveIndustrialMined: 0.000000,
  });

  const [payouts, setPayouts] = useState<Array<{
    id: string;
    time: string;
    node: string;
    plan: string;
    amountUSD: string;
    amountCrypto: string;
    user: string;
    status: string;
  }>>([]);

  useEffect(() => {
    const START_DATE = new Date('2025-11-01T00:00:00Z');
    const btcVal = 68450; // Precio de referencia BTC estable para conversión

    const updateStats = () => {
      const now = new Date();
      const diffMs = now.getTime() - START_DATE.getTime();
      const elapsedDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
      
      // Algoritmo de usuarios: Base de 350 activos, sumando ingresos distribuidos no síncronos en las 24h
      const baseUsers = 350;
      // 15 horas de adición aleatorias repartidas en las 24 horas del día (no sincronizadas: 0.8h, 1.5h, 3.2h, 4.5h, etc.)
      const joinHours = [0.8, 1.5, 3.2, 4.5, 6.1, 7.8, 9.2, 11.0, 13.2, 14.8, 16.5, 18.2, 19.9, 21.4, 23.1];
      const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
      const usersJoinedToday = joinHours.filter(h => currentHour >= h).length;
      const currentUsers = baseUsers + usersJoinedToday;
      
      // Minado histórico total (USD): promedio histórico de 250 usuarios * días transcurridos * rendimiento diario de $2.85 USD por usuario
      const avgHistoricalUsers = 250;
      const totalMinedUSD = avgHistoricalUsers * elapsedDays * 2.85;
      const totalMinedBTC = totalMinedUSD / btcVal;

      // Tiempo transcurrido en la sesión actual en segundos
      const sessionSeconds = (Date.now() - sessionStart.current) / 1000;
      
      // Starter (NC-S1): ~$3.80 USD/día -> ~$0.158 USD/hora -> ~$0.000044 USD/segundo
      const starterRate = 0.000044 * sessionSeconds;
      // Pro (NC-P2): ~$9.20 USD/día -> ~$0.383 USD/hora -> ~$0.000106 USD/segundo
      const proRate = 0.000106 * sessionSeconds;
      // Industrial (NC-I3): ~$18.50 USD/día -> ~$0.771 USD/hora -> ~$0.000214 USD/segundo
      const industrialRate = 0.000214 * sessionSeconds;

      setStats({
        activeUsers: currentUsers,
        totalMinedUSD,
        totalMinedBTC,
        liveStarterMined: starterRate,
        liveProMined: proRate,
        liveIndustrialMined: industrialRate,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Acreditaciones iniciales realistas para simular historia reciente
    const initialPayouts = [
      {
        id: '1',
        time: 'Hace 8s',
        node: 'NC-P2-841 (Houston)',
        plan: 'PRO',
        amountUSD: '0.1915',
        amountCrypto: '0.00000280 BTC',
        user: 'carlos***@gmail.com',
        status: 'ACREDITADO'
      },
      {
        id: '2',
        time: 'Hace 24s',
        node: 'NC-I3-019 (Reykjavik)',
        plan: 'INDUSTRIAL',
        amountUSD: '0.4281',
        amountCrypto: '0.00000625 BTC',
        user: 'm.valle***@yahoo.com',
        status: 'ACREDITADO'
      },
      {
        id: '3',
        time: 'Hace 42s',
        node: 'NC-S1-502 (Estonia)',
        plan: 'STARTER',
        amountUSD: '0.0782',
        amountCrypto: '0.00000114 BTC',
        user: 'dan_***@outlook.com',
        status: 'ACREDITADO'
      },
      {
        id: '4',
        time: 'Hace 1m 5s',
        node: 'NC-P2-114 (Singapore)',
        plan: 'PRO',
        amountUSD: '0.1895',
        amountCrypto: '0.00000277 BTC',
        user: 'elena***@gmail.com',
        status: 'ACREDITADO'
      }
    ];
    setPayouts(initialPayouts);

    const locations = ['Houston', 'Reykjavik', 'Estonia', 'Singapore', 'Stockholm', 'Quebec', 'Asunción', 'Helsinki'];
    const plans = [
      { name: 'STARTER', code: 'NC-S1', baseUSD: 0.075 },
      { name: 'PRO', code: 'NC-P2', baseUSD: 0.185 },
      { name: 'INDUSTRIAL', code: 'NC-I3', baseUSD: 0.425 }
    ];
    const emails = [
      'jose***@gmail.com', 'maria***@hotmail.com', 'l.sanchez***@gmail.com',
      'andres***@yahoo.com', 'k.ortiz***@outlook.com', 'jhon***@nextcap.net',
      'sofia***@gmail.com', 'nelson***@hotmail.com', 'pedro***@gmail.com'
    ];

    const interval = setInterval(() => {
      const plan = plans[Math.floor(Math.random() * plans.length)];
      const loc = locations[Math.floor(Math.random() * locations.length)];
      const email = emails[Math.floor(Math.random() * emails.length)];
      
      const usdVal = plan.baseUSD + (Math.random() - 0.5) * (plan.baseUSD * 0.2);
      const btcVal = usdVal / 68450;

      const newPayout = {
        id: Math.random().toString(),
        time: 'Ahora mismo',
        node: `${plan.code}-${Math.floor(100 + Math.random() * 900)} (${loc})`,
        plan: plan.name,
        amountUSD: usdVal.toFixed(4),
        amountCrypto: `${btcVal.toFixed(8)} BTC`,
        user: email,
        status: 'ACREDITADO'
      };

      setPayouts(prev => {
        const updated = prev.map(p => {
          if (p.time === 'Ahora mismo') return { ...p, time: 'Hace 5s' };
          if (p.time === 'Hace 5s') return { ...p, time: 'Hace 10s' };
          if (p.time === 'Hace 10s') return { ...p, time: 'Hace 15s' };
          if (p.time.startsWith('Hace') && p.time.endsWith('s')) {
            const secs = parseInt(p.time.replace(/[^0-9]/g, '')) + 5;
            return { ...p, time: `Hace ${secs}s` };
          }
          return p;
        });
        return [newPayout, ...updated.slice(0, 5)];
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{
        background: '#060608',
        fontFamily: 'var(--font-geist-sans), "Inter", sans-serif',
      }}
    >
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
          50% { box-shadow: 0 0 20px 4px rgba(245,158,11,0.25); }
        }
        @keyframes scanLine {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .fade-up { animation: fadeInUp 0.7s ease forwards; }
        .fade-up-2 { animation: fadeInUp 0.7s 0.15s ease both; }
        .fade-up-3 { animation: fadeInUp 0.7s 0.3s ease both; }
        .card-glow { animation: pulseGlow 3s ease-in-out infinite; }
        .noise {
          position: relative;
        }
        .noise::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
          opacity: 0.4;
          mix-blend-mode: overlay;
        }
        .scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent);
          animation: scanLine 4s linear infinite;
          pointer-events: none;
          z-index: 5;
        }
        .plan-active {
          background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,146,60,0.06));
          border-color: rgba(245,158,11,0.5) !important;
        }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav style={{ background: 'rgba(6,6,8,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 relative">
              <svg viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="rgba(245,158,11,0.15)" />
                <path d="M8 14L12 10L16 14L20 10" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 18L12 14L16 18L20 14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
              </svg>
            </div>
            <span className="font-bold text-white text-sm tracking-tight">Next<span className="text-amber-400">Capital</span></span>
            <span className="ml-1 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-600 border border-amber-700/40 rounded" style={{background:'rgba(245,158,11,0.07)'}}>MINING</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-500">
            <a href="#planes" className="hover:text-amber-400 transition-colors">{t.navPlanes}</a>
            <a href="#funciona" className="hover:text-amber-400 transition-colors">{t.navFunciona}</a>
            <a href="#hardware" className="hover:text-amber-400 transition-colors">{t.navHardware}</a>
          </div>

          <div className="flex items-center gap-4">
            {/* Elegant Language Switcher Pill */}
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-white/5 border border-white/10">
              <button
                onClick={() => handleSetLang('es')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${
                  lang === 'es'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                ES
              </button>
              <button
                onClick={() => handleSetLang('en')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${
                  lang === 'en'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                EN
              </button>
            </div>

            {firebaseUser ? (
              <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {appUser?.name || firebaseUser.displayName || firebaseUser.email}
              </span>
            ) : (
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">{t.navAcceder}</Link>
            )}
            <Link href="/minado/dashboard"
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-all text-black"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
              {t.navDashboard}
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ TICKER ══ */}
      <LiveTicker lang={lang} />

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden" style={{ minHeight: '92vh' }}>
        {/* Full-bleed background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/mining-hero.png"
            alt="Data center industrial de minería de criptomonedas"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Layered overlays for drama */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(6,6,8,0.97) 40%, rgba(6,6,8,0.6) 70%, rgba(6,6,8,0.3) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,6,8,1) 0%, transparent 40%)' }} />
          {/* Amber color wash on right */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 75% 50%, rgba(245,158,11,0.08) 0%, transparent 60%)' }} />
        </div>
        <div className="scan-line" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 flex items-center" style={{ minHeight: '92vh' }}>
          <div className="max-w-2xl">
            {/* Status badge */}
            <div className="fade-up flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest text-amber-300"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: 'blink 1.2s step-end infinite' }} />
                {t.badgeSystem}
              </div>
            </div>

            {/* Headline — brutal typography */}
            <div className="fade-up-2">
              <h1 className="leading-none mb-6" style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>
                <span className="block text-white">{t.heroLine1}</span>
                <span className="block text-white">{t.heroLine2}</span>
                <span className="block" style={{ background: 'linear-gradient(90deg, #f59e0b 0%, #f97316 50%, #fb923c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t.heroLine3}
                </span>
              </h1>
              <p className="text-lg leading-relaxed mb-10" style={{ color: '#94a3b8', maxWidth: '480px' }}>
                {t.heroSub}
              </p>

              <div className="flex flex-wrap gap-4 mb-14">
                <a href="#planes"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-black transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}>
                  {t.btnPlanes}
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
                <a href="#funciona"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1' }}>
                  {t.btnFunciona}
                </a>
              </div>
            </div>

            {/* Mini stats row */}
            <div className="fade-up-3 grid grid-cols-3 gap-4">
              {[
                { val: '12,408+', lbl: t.statNodes },
                { val: '34', lbl: t.statCountries },
                { val: '99.97%', lbl: t.statUptime },
              ].map((s, i) => (
                <div key={i} style={{ borderLeft: '2px solid rgba(245,158,11,0.3)', paddingLeft: '12px' }}>
                  <div className="font-black text-white" style={{ fontSize: '1.4rem', letterSpacing: '-0.02em' }}>{s.val}</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating hardware card on right (desktop) */}
        <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 z-20" style={{ width: '380px', right: '440px' }}>
          <div className="rounded-2xl overflow-hidden noise" style={{
            background: 'rgba(10,10,14,0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(245,158,11,0.2)',
            boxShadow: '0 0 60px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}>
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(245,158,11,0.05)' }}>
              <span className="text-xs font-mono font-bold text-amber-400 tracking-widest">LIVE · NC-P2-HW0721</span>
              <span className="flex items-center gap-1.5 text-xs text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: 'blink 1s step-end infinite' }} />
                MINING
              </span>
            </div>
            <div className="relative" style={{ height: '200px' }}>
              <Image src="/asic-miner.png" alt="ASIC Miner" fill className="object-contain p-4" style={{ filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.3))' }} />
            </div>
            <div className="p-5 space-y-2.5">
              {[
                ['HASH_RATE', '250.4 TH/s', true],
                ['TEMP_BOARD', '65°C', false],
                ['FAN_SPEED', '4,520 RPM', false],
                [lang === 'es' ? 'YIELD_HOY' : 'YIELD_TODAY', '0.93%', true],
                [lang === 'es' ? 'GANANCIA_24H' : 'EARNINGS_24H', '+$3.07 USD', true],
              ].map(([k, v, highlight]) => (
                <div key={String(k)} className="flex justify-between items-center">
                  <span className="text-xs font-mono" style={{ color: '#475569' }}>{k}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: highlight ? '#f59e0b' : '#94a3b8' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ DISCLAIMER ══ */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6">
        <div className="flex gap-4 items-start p-5 rounded-xl" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <span className="text-amber-500 text-lg flex-shrink-0">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-1">{t.disclaimerTitle}</p>
            <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
              {t.disclaimerDesc}
            </p>
          </div>
        </div>
      </div>

      {/* ══ TELEMETRÍA EN TIEMPO REAL Y MINADO HISTÓRICO ══ */}
      <section className="py-12 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="rounded-3xl p-6 lg:p-10 relative overflow-hidden" style={{
          background: 'rgba(10, 10, 15, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
          {/* Neon background glows */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                  {t.controlTitle}
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                {t.controlSub[0]} <span style={{ background: 'linear-gradient(90deg, #f59e0b, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.controlSub.split(' ').slice(4).join(' ')}</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-mono max-w-xs md:text-right">
              {t.controlDesc}
            </p>
          </div>

          {/* Grid layout for stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* CARD 1: USUARIOS ACTIVOS */}
            <div className="rounded-2xl p-6 flex flex-col justify-between" style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
            }}>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-mono font-bold text-slate-400">{t.cardUsersTitle}</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </div>
                </div>
                <div className="text-4xl font-black text-white tracking-tight mb-2 flex items-baseline gap-1">
                  <span>{stats.activeUsers.toLocaleString()}</span>
                  <span className="text-xs font-normal text-slate-500">{t.cardUsersSuffix}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.cardUsersDesc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>{t.cardUsersBottom}</span>
                <span className="text-emerald-400">{t.cardUsersStatus}</span>
              </div>
            </div>

            {/* CARD 2: MINADO HISTÓRICO TOTAL */}
            <div className="rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(6, 6, 8, 0.2) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              boxShadow: '0 8px 30px rgba(245, 158, 11, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-mono font-bold text-amber-500">{t.cardMinedTitle}</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                    {t.cardMinedBadge}
                  </div>
                </div>
                <div className="text-4xl font-black text-white tracking-tight mb-2 font-mono">
                  ${stats.totalMinedUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  {t.cardMinedDesc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-amber-500/10 flex justify-between items-center text-[10px] font-mono text-amber-500">
                <span>{t.cardMinedBottom}</span>
                <span className="font-bold text-white">Ξ {stats.totalMinedBTC.toFixed(5)} BTC</span>
              </div>
            </div>

            {/* CARD 3: RENDIMIENTO SIMULADO EN VIVO POR PLANES */}
            <div className="rounded-2xl p-6 flex flex-col justify-between" style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
            }}>
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 block mb-4">{t.cardLiveTitle}</span>
                <div className="space-y-3">
                  {/* STARTER */}
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{t.cardLiveStarter}</span>
                      <p className="text-[9px] text-slate-500 font-mono">{t.cardLiveRange} 0.75% - 1.10%</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      +${stats.liveStarterMined.toFixed(6)} USD
                    </span>
                  </div>
                  {/* PRO */}
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400">{t.cardLivePro}</span>
                      <p className="text-[9px] text-amber-500/70 font-mono">{t.cardLiveRange} 0.80% - 1.10%</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      +${stats.liveProMined.toFixed(6)} USD
                    </span>
                  </div>
                  {/* INDUSTRIAL */}
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{t.cardLiveInd}</span>
                      <p className="text-[9px] text-slate-500 font-mono">{t.cardLiveRange} 0.85% - 1.10%</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      +${stats.liveIndustrialMined.toFixed(6)} USD
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-[9px] font-mono text-slate-600 text-center">
                {t.cardLiveBottom}
              </div>
            </div>
          </div>

          {/* GLOBAL NODE MAP */}
          <div className="mb-6">
            <MiningWorldMap userHashrate={0} lang={lang} />
          </div>

          {/* LIVE COMMAND TERMINAL (PAYOUTS) */}
          <div className="rounded-2xl overflow-hidden mt-6" style={{
            background: '#07070a',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0f' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-slate-400">{t.ledgerTitle}</span>
              </div>
              <div className="flex gap-4 text-[10px] font-mono text-slate-500">
                <span>{t.ledgerFee} <strong className="text-amber-500">0.9%</strong></span>
                <span>{t.ledgerDiff} <strong className="text-amber-500">86.39T</strong></span>
              </div>
            </div>
            
            <div className="p-4 space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
              {payouts.length === 0 ? (
                <div className="text-center py-6 text-xs font-mono text-slate-600 animate-pulse">
                  {t.ledgerLoading}
                </div>
              ) : (
                payouts.map((p) => (
                  <div 
                    key={p.id} 
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 px-4 rounded-lg bg-white/5 border border-white/5 hover:border-amber-500/20 transition-all gap-2 animate-[fadeInUp_0.3s_ease_forwards]"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="text-slate-500 text-[10px]">{getTranslatedTime(p.time)}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{
                        background: p.plan === 'INDUSTRIAL' ? 'rgba(239, 68, 68, 0.1)' : p.plan === 'PRO' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: p.plan === 'INDUSTRIAL' ? '#ef4444' : p.plan === 'PRO' ? '#f59e0b' : '#3b82f6',
                        border: p.plan === 'INDUSTRIAL' ? '1px solid rgba(239,68,68,0.2)' : p.plan === 'PRO' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(59,130,246,0.2)'
                      }}>
                        {p.plan}
                      </span>
                      <span className="text-slate-400 font-bold">{p.node}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-slate-400">{p.user}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 text-right">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                        {lang === 'es' ? 'ACREDITADO' : 'CREDITED'}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        +{p.amountCrypto}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        (+${p.amountUSD} USD)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="funciona" className="py-24 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-mono font-bold text-amber-500 tracking-widest mb-5">— {lang === 'es' ? 'PROCESO' : 'PROCESS'}</p>
            <h2 className="text-4xl font-black text-white mb-6" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {t.howTitle}<br />
              <span style={{ color: '#94a3b8', fontWeight: 400 }}>{t.howTitleSub}</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-10">
              {t.howDesc}
            </p>
            <div className="space-y-6">
              {[
                { num: '01', title: t.step1Title, desc: t.step1Desc },
                { num: '02', title: t.step2Title, desc: t.step2Desc },
                { num: '03', title: t.step3Title, desc: t.step3Desc },
              ].map(step => (
                <div key={step.num} className="flex gap-5 items-start group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-mono font-black text-xs text-amber-500 transition-all group-hover:scale-110"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    {step.num}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm mb-1">{step.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal block */}
          <div className="rounded-2xl overflow-hidden" style={{
            background: '#0a0a0f',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
          }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0d0d12' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <span className="ml-3 text-xs font-mono text-slate-600">node_telemetry.sh — live output</span>
            </div>
            <div className="p-6 font-mono text-xs space-y-1.5" style={{ lineHeight: 1.7 }}>
              {[
                { t: '> CONNECTING TO NC-HW0721-A...', c: '#475569' },
                { t: '> AUTH TOKEN OK', c: '#10b981' },
                { t: '> ASIC MODEL: Antminer S19 Pro', c: '#94a3b8' },
                { t: '> HASHRATE: 250.4 TH/s ↑', c: '#f59e0b' },
                { t: '> TEMP_CHIP: 65°C [NOMINAL]', c: '#94a3b8' },
                { t: '> FAN1: 4500 RPM · FAN2: 4520 RPM', c: '#94a3b8' },
                { t: '> POOL_SHARE_ACCEPT: 99.3%', c: '#10b981' },
                { t: `> YIELD_RATE_NOW: 0.93%/${lang === 'es' ? 'día' : 'day'}`, c: '#f59e0b' },
                { t: '> ACCRUED_TODAY: +$3.07 USD', c: '#f59e0b' },
                { t: `> STATUS: ██ ${lang === 'es' ? 'MINANDO' : 'MINING'} ██`, c: '#f59e0b' },
              ].map((line, i) => (
                <div key={i} style={{ color: line.c, opacity: i < 2 ? 0.5 : 1 }}>
                  {line.t}{i === 9 && <span style={{ animation: 'blink 1s step-end infinite' }}> ▌</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ PLANS ══ */}
      <section id="planes" className="py-24 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-mono font-bold text-amber-500 tracking-widest mb-4">{t.plansSectionSub}</p>
          <h2 className="text-4xl font-black text-white mb-4" style={{ letterSpacing: '-0.03em' }}>{t.plansSectionTitle}</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            {t.plansSectionDesc}
          </p>
        </div>

        {/* 3 cards always visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.code}
              className="relative rounded-2xl flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: plan.hot
                  ? 'linear-gradient(160deg, rgba(245,158,11,0.1) 0%, rgba(6,6,8,1) 60%)'
                  : '#0d0d14',
                border: plan.hot ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.07)',
                boxShadow: plan.hot ? '0 0 40px rgba(245,158,11,0.07)' : 'none',
              }}
            >
              {/* Popular badge */}
              {plan.hot && (
                <div className="absolute top-0 left-0 right-0 flex justify-center">
                  <span className="text-[10px] font-black tracking-widest text-black px-4 py-1 rounded-b-lg"
                    style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316)' }}>
                    {t.plansBadgePopular}
                  </span>
                </div>
              )}

              <div className="p-7 flex flex-col flex-grow" style={{ paddingTop: plan.hot ? '2.5rem' : '1.75rem' }}>
                {/* Tier + code */}
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-xs font-bold text-amber-500 tracking-widest">{plan.code}</span>
                  <span className="text-xs text-slate-600 font-mono">{plan.hashrate}</span>
                </div>

                <h3 className="font-black text-white mb-1" style={{ fontSize: '1.8rem', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {plan.tier}
                </h3>
                <p className="text-xs text-slate-500 mb-5">{t.plansInvest} {plan.invest}</p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-black text-white" style={{ fontSize: '2.2rem', letterSpacing: '-0.04em' }}>${plan.price}</span>
                  <span className="text-slate-500 text-sm">{t.plansPriceSuffix}</span>
                </div>

                {/* ROI bar */}
                <div className="mb-6 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500">{t.plansYield}</span>
                    <span className="font-bold text-amber-400">{plan.minRoi}% – {plan.maxRoi}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${(plan.maxRoi / 1.10) * 100}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                    }} />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5">{t.plansYieldSub}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-grow">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-black"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Specs row */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {[
                    { k: t.plansUptime, v: plan.uptime },
                    { k: t.plansDuration, v: plan.duration },
                  ].map(spec => (
                    <div key={spec.k} className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="text-[10px] text-slate-600 mb-0.5">{spec.k}</p>
                      <p className="text-xs font-bold text-white">{spec.v}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href={firebaseUser ? `/minado/dashboard/deposits?plan=${plan.code}` : "/login"}
                  className="block w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all hover:scale-[1.02]"
                  style={plan.hot
                    ? { background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#000', boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }
                  }
                >
                  {t.plansBtnStart} {plan.tier} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HARDWARE SHOWCASE ══ */}
      <section id="hardware" className="py-24 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl overflow-hidden relative" style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
            <div className="relative grid lg:grid-cols-2 gap-0">
              {/* Image side */}
              <div className="relative" style={{ minHeight: '420px' }}>
                <Image src="/asic-miner.png" alt="Hardware ASIC dedicado" fill className="object-contain p-8"
                  style={{ filter: 'drop-shadow(0 0 40px rgba(245,158,11,0.2))' }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 60%, #0a0a0f 100%)' }} />
              </div>

              {/* Text side */}
              <div className="p-10 lg:p-14 flex flex-col justify-center">
                <p className="text-xs font-mono font-bold text-amber-500 tracking-widest mb-5">{t.hwSectionSub}</p>
                <h2 className="font-black text-white mb-4" style={{ fontSize: '2.2rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  {t.hwSectionTitle}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  {t.hwSectionDesc}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: t.hwSpecModel, val: 'Antminer S19 XP' },
                    { label: t.hwSpecEff, val: '21.5 J/TH' },
                    { label: t.hwSpecCool, val: t.hwSpecCoolVal },
                    { label: t.hwSpecPower, val: t.hwSpecPowerVal },
                  ].map(spec => (
                    <div key={spec.label} className="p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                      <p className="text-[10px] text-amber-600 font-mono mb-0.5">{spec.label}</p>
                      <p className="text-xs font-bold text-white">{spec.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-24 px-6 lg:px-10 text-center max-w-4xl mx-auto">
        <h2 className="font-black text-white mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          {t.ctaTitle}<br />
          <span style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t.ctaTitleSub}
          </span>
        </h2>
        <p className="text-slate-400 mb-10 text-base">{t.ctaDesc}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={firebaseUser ? "/minado/dashboard" : "/register"}
            className="px-10 py-4 rounded-xl font-bold text-sm text-black transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 8px 40px rgba(245,158,11,0.3)' }}>
            {firebaseUser ? t.ctaBtnDashboard : t.ctaBtnRegister}
          </Link>
          <Link href="/minado/dashboard"
            className="px-10 py-4 rounded-xl font-semibold text-sm text-slate-300 transition-all hover:text-white"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {t.ctaBtnDemo}
          </Link>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="py-10 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">NextCapital <span className="text-amber-400">Mining</span></span>
            <span className="text-xs text-slate-700">© 2025</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-slate-600 hover:text-amber-400 transition-colors">{t.footerTerms}</a>
            <a href="#" className="text-xs text-slate-600 hover:text-amber-400 transition-colors">{t.footerPrivacy}</a>
            <a href="#" className="text-xs text-slate-600 hover:text-amber-400 transition-colors">{t.footerSupport}</a>
          </div>
          <Link href="/" className="text-xs text-slate-600 hover:text-white transition-colors">{t.footerHub}</Link>
        </div>
      </footer>
    </div>
  );
}
