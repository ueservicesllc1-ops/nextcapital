'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/auth-provider';

const PLANS = [
  {
    tier: 'STARTER',
    code: 'NC-S1',
    hashrate: '100 TH/s',
    price: 149,
    minRoi: 0.75,
    maxRoi: 1.10,
    invest: '$500 ΓÇô $2K',
    duration: '12M',
    uptime: '99.5%',
    features: ['1 nodo ASIC f├¡sico', 'Dashboard en vivo', 'Retiro mensual', 'Email support'],
    hot: false,
  },
  {
    tier: 'PRO',
    code: 'NC-P2',
    hashrate: '250 TH/s',
    price: 329,
    minRoi: 0.80,
    maxRoi: 1.10,
    invest: '$2K ΓÇô $10K',
    duration: '12M',
    uptime: '99.9%',
    features: ['2 nodos ASIC f├¡sicos', 'Telemetr├¡a en tiempo real', 'Retiro semanal', 'Soporte 24/7', 'Reinversi├│n auto'],
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
    duration: '24M',
    uptime: '99.99%',
    features: ['Rack dedicado completo', 'API telemetr├¡a cruda', 'Retiro diario', 'Account Manager', 'SLA contractual'],
    hot: false,
  },
];

function useCounter(target: number, speed = 50) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = target / 60;
    const t = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(current));
    }, speed);
    return () => clearInterval(t);
  }, [target, speed]);
  return val;
}

function LiveTicker() {
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

  const items = [
    `HASH_RATE ΓÇó ${hashrate} EH/s`,
    `NODOS_ACTIVOS ΓÇó ${nodes.toLocaleString()}`,
    `TEMP_PROM ΓÇó ${temp}┬░C`,
    `YIELD_DIARIO ΓÇó ${yield_}%`,
    `NETWORK_DIFF ΓÇó 86.39T`,
    `UPTIME_GLOBAL ΓÇó 99.97%`,
    `BTC_BLOQUE ΓÇó 3.125`,
    `POOL_FEE ΓÇó 0.9%`,
  ];

  return (
    <div className="overflow-hidden border-t border-b border-amber-500/20 bg-amber-500/5 py-2.5 relative">
      <div className="flex gap-12 animate-[ticker_18s_linear_infinite] whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-xs font-mono text-amber-300/70 tracking-widest flex-shrink-0">
            <span className="text-amber-500 mr-2">Γû╕</span>{item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MinadoLandingPage() {
  const { firebaseUser, appUser } = useAuth();

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

      {/* ΓòÉΓòÉ NAVBAR ΓòÉΓòÉ */}
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
            <a href="#planes" className="hover:text-amber-400 transition-colors">Planes</a>
            <a href="#funciona" className="hover:text-amber-400 transition-colors">┬┐C├│mo funciona?</a>
            <a href="#hardware" className="hover:text-amber-400 transition-colors">Hardware</a>
          </div>

          <div className="flex items-center gap-4">
            {firebaseUser ? (
              <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {appUser?.name || firebaseUser.displayName || firebaseUser.email}
              </span>
            ) : (
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Acceder</Link>
            )}
            <Link href="/minado/dashboard"
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-all text-black"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
              Dashboard ΓåÆ
            </Link>
          </div>
        </div>
      </nav>

      {/* ΓòÉΓòÉ TICKER ΓòÉΓòÉ */}
      <LiveTicker />

      {/* ΓòÉΓòÉ HERO ΓòÉΓòÉ */}
      <section className="relative overflow-hidden" style={{ minHeight: '92vh' }}>
        {/* Full-bleed background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/mining-hero.png"
            alt="Data center industrial de miner├¡a de criptomonedas"
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
                SISTEMA OPERATIVO ┬╖ 142.5 EH/s
              </div>
            </div>

            {/* Headline ΓÇö brutal typography */}
            <div className="fade-up-2">
              <h1 className="leading-none mb-6" style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>
                <span className="block text-white">Miner├¡a</span>
                <span className="block text-white">Industrial</span>
                <span className="block" style={{ background: 'linear-gradient(90deg, #f59e0b 0%, #f97316 50%, #fb923c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  en la Nube.
                </span>
              </h1>
              <p className="text-lg leading-relaxed mb-10" style={{ color: '#94a3b8', maxWidth: '480px' }}>
                Hardware ASIC dedicado 1:1 en nuestros data centers f├¡sicos. 
                Tu equipo mina <strong style={{ color: '#e2e8f0' }}>Bitcoin 24/7</strong> y t├║ ves las ganancias en tiempo real ΓÇö 
                entre <strong style={{ color: '#f59e0b' }}>0.75% y 1.10% diario</strong>.
              </p>

              <div className="flex flex-wrap gap-4 mb-14">
                <a href="#planes"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-black transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}>
                  Ver Planes de Inversi├│n
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
                <a href="#funciona"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1' }}>
                  C├│mo funciona
                </a>
              </div>
            </div>

            {/* Mini stats row */}
            <div className="fade-up-3 grid grid-cols-3 gap-4">
              {[
                { val: '12,408+', lbl: 'Nodos activos' },
                { val: '34', lbl: 'Pa├¡ses' },
                { val: '99.97%', lbl: 'Uptime promedio' },
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
              <span className="text-xs font-mono font-bold text-amber-400 tracking-widest">LIVE ┬╖ NC-P2-HW0721</span>
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
                ['TEMP_BOARD', '65┬░C', false],
                ['FAN_SPEED', '4,520 RPM', false],
                ['YIELD_HOY', '0.93%', true],
                ['GANANCIA_24H', '+$3.07 USD', true],
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

      {/* ΓòÉΓòÉ DISCLAIMER ΓòÉΓòÉ */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6">
        <div className="flex gap-4 items-start p-5 rounded-xl" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <span className="text-amber-500 text-lg flex-shrink-0">ΓÜá</span>
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-1">Transparencia sobre rendimientos</p>
            <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
              El rendimiento diario <strong style={{ color: '#94a3b8' }}>no es fijo</strong>. Oscila entre <strong style={{ color: '#f59e0b' }}>0.75% y 1.10%</strong> seg├║n la dificultad de red de Bitcoin, precio del BTC y eficiencia energ├⌐tica. Los valores en pantalla reflejan la actividad real de las m├íquinas en tiempo real. Toda inversi├│n conlleva riesgo.
            </p>
          </div>
        </div>
      </div>

      {/* ΓòÉΓòÉ HOW IT WORKS ΓòÉΓòÉ */}
      <section id="funciona" className="py-24 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-mono font-bold text-amber-500 tracking-widest mb-5">ΓÇö PROCESO</p>
            <h2 className="text-4xl font-black text-white mb-6" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Las m├íquinas trabajan.<br />
              <span style={{ color: '#94a3b8', fontWeight: 400 }}>T├║ cobras.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-10">
              Nuestros data centers operan racks completos de ASICs Bitcoin las 24 horas. Cuando contratas un plan, ese hardware se te asigna en exclusiva. Lo que minan esas m├íquinas f├¡sicas es lo que ver├ís acreditarse en tu dashboard.
            </p>
            <div className="space-y-6">
              {[
                { num: '01', title: 'Eliges tu potencia', desc: 'Seleccionas cu├íntos TH/s de hashrate quieres contratar y por cu├ínto tiempo.' },
                { num: '02', title: 'ASIC asignado en exclusiva', desc: 'Un equipo f├¡sico en tu nombre. Sin virtualizaci├│n, sin fraccionamiento.' },
                { num: '03', title: 'Ganancias en tiempo real', desc: 'Tu dashboard muestra el saldo aumentando segundo a segundo, reflejando la actividad real del hardware.' },
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
              <span className="ml-3 text-xs font-mono text-slate-600">node_telemetry.sh ΓÇö live output</span>
            </div>
            <div className="p-6 font-mono text-xs space-y-1.5" style={{ lineHeight: 1.7 }}>
              {[
                { t: '> CONNECTING TO NC-HW0721-A...', c: '#475569' },
                { t: '> AUTH TOKEN OK', c: '#10b981' },
                { t: '> ASIC MODEL: Antminer S19 Pro', c: '#94a3b8' },
                { t: '> HASHRATE: 250.4 TH/s Γåæ', c: '#f59e0b' },
                { t: '> TEMP_CHIP: 65┬░C [NOMINAL]', c: '#94a3b8' },
                { t: '> FAN1: 4500 RPM ┬╖ FAN2: 4520 RPM', c: '#94a3b8' },
                { t: '> POOL_SHARE_ACCEPT: 99.3%', c: '#10b981' },
                { t: '> YIELD_RATE_NOW: 0.93%/d├¡a', c: '#f59e0b' },
                { t: '> ACCRUED_TODAY: +$3.07 USD', c: '#f59e0b' },
                { t: '> STATUS: ΓûêΓûê MINING ΓûêΓûê', c: '#f59e0b' },
              ].map((line, i) => (
                <div key={i} style={{ color: line.c, opacity: i < 2 ? 0.5 : 1 }}>
                  {line.t}{i === 9 && <span style={{ animation: 'blink 1s step-end infinite' }}> Γûî</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ΓòÉΓòÉ PLANS ΓòÉΓòÉ */}
      <section id="planes" className="py-24 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-mono font-bold text-amber-500 tracking-widest mb-4">ΓÇö CONTRATOS DE HASHRATE</p>
          <h2 className="text-4xl font-black text-white mb-4" style={{ letterSpacing: '-0.03em' }}>Elige tu nivel de operaci├│n</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Todos los planes incluyen hardware ASIC f├¡sico dedicado y rendimiento variable real entre 0.75% y 1.10% diario.
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
                    Γÿà M├üS POPULAR
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
                <p className="text-xs text-slate-500 mb-5">Inversi├│n: {plan.invest}</p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-black text-white" style={{ fontSize: '2.2rem', letterSpacing: '-0.04em' }}>${plan.price}</span>
                  <span className="text-slate-500 text-sm">/mes</span>
                </div>

                {/* ROI bar */}
                <div className="mb-6 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500">Rendimiento diario</span>
                    <span className="font-bold text-amber-400">{plan.minRoi}% ΓÇô {plan.maxRoi}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${(plan.maxRoi / 1.10) * 100}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                    }} />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5">Variable ┬╖ no garantizado</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-grow">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-black"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>Γ£ô</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Specs row */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {[
                    { k: 'Uptime', v: plan.uptime },
                    { k: 'Duraci├│n', v: plan.duration },
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
                  Comenzar con {plan.tier} ΓåÆ
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ΓòÉΓòÉ HARDWARE SHOWCASE ΓòÉΓòÉ */}
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
                <p className="text-xs font-mono font-bold text-amber-500 tracking-widest mb-5">ΓÇö HARDWARE 1:1</p>
                <h2 className="font-black text-white mb-4" style={{ fontSize: '2.2rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  Tu m├íquina.<br />Tu Bitcoin.
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  No compartimos ni fraccionamos hashrate. Cuando contratas un plan con NextCapital Mining, un ASIC f├¡sico te es asignado en exclusiva en nuestros data centers certificados. El rendimiento que ves es 100% tuyo.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Modelo base', val: 'Antminer S19 XP' },
                    { label: 'Eficiencia', val: '21.5 J/TH' },
                    { label: 'Refrigeraci├│n', val: 'Inmersi├│n l├¡quida' },
                    { label: 'Energ├¡a', val: 'Hidroel├⌐ctrica PPA' },
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

      {/* ΓòÉΓòÉ CTA ΓòÉΓòÉ */}
      <section className="py-24 px-6 lg:px-10 text-center max-w-4xl mx-auto">
        <h2 className="font-black text-white mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          Tu nodo ASIC,<br />
          <span style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            operando en 24 horas.
          </span>
        </h2>
        <p className="text-slate-400 mb-10 text-base">Crea tu cuenta, elige tu plan y tu hardware f├¡sico empezar├í a minar Bitcoin para ti.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={firebaseUser ? "/minado/dashboard" : "/register"}
            className="px-10 py-4 rounded-xl font-bold text-sm text-black transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 8px 40px rgba(245,158,11,0.3)' }}>
            {firebaseUser ? "Ir al Dashboard ΓåÆ" : "Crear Cuenta Gratis ΓåÆ"}
          </Link>
          <Link href="/minado/dashboard"
            className="px-10 py-4 rounded-xl font-semibold text-sm text-slate-300 transition-all hover:text-white"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Ver Dashboard Demo
          </Link>
        </div>
      </section>

      {/* ΓòÉΓòÉ FOOTER ΓòÉΓòÉ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="py-10 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">NextCapital <span className="text-amber-400">Mining</span></span>
            <span className="text-xs text-slate-700">┬⌐ 2025</span>
          </div>
          <div className="flex gap-6">
            {['T├⌐rminos', 'Privacidad', 'Soporte'].map(l => (
              <a key={l} href="#" className="text-xs text-slate-600 hover:text-amber-400 transition-colors">{l}</a>
            ))}
          </div>
          <Link href="/" className="text-xs text-slate-600 hover:text-white transition-colors">ΓåÉ Hub Principal</Link>
        </div>
      </footer>
    </div>
  );
}
