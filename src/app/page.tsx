'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return pos;
}

export default function GlobalHubPage() {
  const mouse = useMousePosition();
  const [hovered, setHovered] = useState<'next' | 'mining' | null>(null);

  return (
    <div className="h-screen w-screen overflow-hidden relative select-none" style={{ background: '#05050a', fontFamily: 'var(--font-geist-sans), "Inter", sans-serif' }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.8);opacity:0} }
        @keyframes grain {
          0%,100% { transform: translate(0,0) }
          10% { transform: translate(-2%,-3%) }
          30% { transform: translate(3%,-1%) }
          50% { transform: translate(-1%,4%) }
          70% { transform: translate(4%,1%) }
          90% { transform: translate(-3%,2%) }
        }
        .grain::after {
          content:'';
          position:fixed;
          inset:-50%;
          width:200%;height:200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
          opacity:0.15;
          animation: grain 8s steps(10) infinite;
          pointer-events:none;
          z-index:100;
        }
        .card-next { transition: all 0.5s cubic-bezier(.23,1,.32,1); }
        .card-next:hover { flex: 1.7 !important; }
        .card-mining { transition: all 0.5s cubic-bezier(.23,1,.32,1); }
        .card-mining:hover { flex: 1.7 !important; }
        .split-line { transition: all 0.5s cubic-bezier(.23,1,.32,1); }
      `}</style>

      <div className="grain" />

      {/* Mouse-following spotlight */}
      <div
        className="fixed pointer-events-none z-50 rounded-full"
        style={{
          width: '600px', height: '600px',
          left: mouse.x - 300, top: mouse.y - 300,
          background: hovered === 'next'
            ? 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)'
            : hovered === 'mining'
            ? 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)',
          transition: 'background 0.5s ease',
        }}
      />

      {/* ══ SPLIT LAYOUT ══ */}
      <div className="h-full w-full flex">

        {/* ── LEFT: NEXT CAPITAL ── */}
        <Link
          href="/next"
          className="card-next relative overflow-hidden flex flex-col justify-between group"
          style={{ flex: 1 }}
          onMouseEnter={() => setHovered('next')}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Background gradient */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, #050811 0%, #071220 60%, #0a1a30 100%)',
          }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(100,160,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(100,160,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          {/* Glow orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />

          {/* Content */}
          <div className="relative z-10 p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 13L6 9L10 11L16 5" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="6" cy="9" r="1.5" fill="#3b82f6" />
                  <circle cx="10" cy="11" r="1.5" fill="#3b82f6" />
                </svg>
              </div>
              <span className="text-xs font-mono font-bold tracking-widest text-blue-400 opacity-70">INVERSIÓN</span>
            </div>
          </div>

          <div className="relative z-10 px-8 lg:px-12 pb-8 lg:pb-12">
            <h2 className="font-black text-white mb-4 group-hover:text-blue-50 transition-colors" style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Next<br /><span style={{ color: '#3b82f6' }}>Capital</span>
            </h2>
            <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: '#475569' }}>
              Plataforma privada de inversión. Depósitos, rendimientos estructurados y dashboard institucional con trazabilidad completa.
            </p>

            {/* Mini stats */}
            <div className="flex gap-6 mb-8">
              {[
                { v: '$2.4M+', l: 'Gestionados' },
                { v: '1,200+', l: 'Inversionistas' },
                { v: 'Privado', l: 'Acceso' },
              ].map(s => (
                <div key={s.l}>
                  <div className="font-black text-white text-xl" style={{ letterSpacing: '-0.03em' }}>{s.v}</div>
                  <div className="text-xs" style={{ color: '#334155' }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300"
              style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
              Entrar al Hub de Inversión
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Floating chart decoration */}
          <div className="absolute bottom-16 right-8 lg:right-16 opacity-10 group-hover:opacity-20 transition-opacity" style={{ animation: 'float 4s ease-in-out infinite' }}>
            <svg width="160" height="80" viewBox="0 0 160 80" fill="none">
              <path d="M0 60 Q20 50 40 30 Q60 10 80 25 Q100 40 120 15 Q140 -5 160 10" stroke="#3b82f6" strokeWidth="2" fill="none"/>
              <path d="M0 60 Q20 50 40 30 Q60 10 80 25 Q100 40 120 15 Q140 -5 160 10 L160 80 L0 80 Z" fill="rgba(59,130,246,0.1)"/>
            </svg>
          </div>
        </Link>

        {/* ── DIVIDER ── */}
        <div className="split-line relative flex-shrink-0 flex flex-col items-center justify-center" style={{ width: '1px', background: 'rgba(255,255,255,0.06)', zIndex: 20 }}>
          {/* Center badge */}
          <div className="absolute flex flex-col items-center gap-3 z-30">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-slate-400"
              style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 0 4px #05050a' }}>
              ✦
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="w-0.5 h-12 block" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[10px] font-mono text-slate-700 tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>ELIGE TU ECOSISTEMA</span>
              <span className="w-0.5 h-12 block" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          </div>
        </div>

        {/* ── RIGHT: MINING ── */}
        <Link
          href="/minado"
          className="card-mining relative overflow-hidden flex flex-col justify-between group"
          style={{ flex: 1 }}
          onMouseEnter={() => setHovered('mining')}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Real image background */}
          <div className="absolute inset-0">
            <Image src="/mining-hero.png" alt="Mining facility" fill className="object-cover object-center opacity-20 group-hover:opacity-30 transition-opacity duration-700 scale-105 group-hover:scale-100" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f0800 0%, #1a0f00 40%, rgba(26,12,0,0.7) 100%)' }} />
          </div>
          {/* Amber glow orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />

          {/* Content */}
          <div className="relative z-10 p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="8" width="4" height="7" rx="1" fill="#f59e0b" opacity="0.7"/>
                  <rect x="7" y="5" width="4" height="10" rx="1" fill="#f59e0b" opacity="0.85"/>
                  <rect x="12" y="2" width="4" height="13" rx="1" fill="#f59e0b"/>
                </svg>
              </div>
              <span className="text-xs font-mono font-bold tracking-widest text-amber-500 opacity-70">MINERÍA INDUSTRIAL</span>
            </div>
          </div>

          <div className="relative z-10 px-8 lg:px-12 pb-8 lg:pb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: 'pulseRing 1.5s ease-out infinite', boxShadow: '0 0 0 0 rgba(245,158,11,0.5)' }} />
              <span className="text-xs font-mono text-amber-400 tracking-widest">SISTEMA OPERATIVO · 142.5 EH/s</span>
            </div>

            <h2 className="font-black text-white mb-4 group-hover:text-amber-50 transition-colors" style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Core<br /><span style={{ color: '#f59e0b' }}>Mining</span>
            </h2>
            <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: '#4a3500' }}>
              Hardware ASIC físico dedicado. Mina Bitcoin en nuestros data centers y recibe entre <strong style={{ color: '#92400e' }}>1.50% – 3.50%</strong> diario sobre tu inversión.
            </p>

            {/* Live stats */}
            <div className="flex gap-6 mb-8">
              {[
                { v: '12,408', l: 'Nodos activos' },
                { v: '2.45%', l: 'Yield hoy' },
                { v: '99.97%', l: 'Uptime' },
              ].map(s => (
                <div key={s.l}>
                  <div className="font-black text-amber-400 text-xl" style={{ letterSpacing: '-0.03em' }}>{s.v}</div>
                  <div className="text-xs" style={{ color: '#44301a' }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
              Iniciar Sistema
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Floating ASIC decoration */}
          <div className="hidden lg:block absolute bottom-12 right-8 lg:right-16 w-32 opacity-15 group-hover:opacity-30 transition-opacity"
            style={{ animation: 'float 5s ease-in-out infinite 0.5s' }}>
            <Image src="/asic-miner.png" alt="" width={128} height={80} className="object-contain"
              style={{ filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.5))' }} />
          </div>
        </Link>
      </div>

      {/* ══ BOTTOM BAR ══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-3 backdrop-blur-xl"
        style={{ background: 'rgba(5,5,10,0.8)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-xs text-slate-700 font-mono">NextCapital © 2025</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-xs text-slate-600 hover:text-white transition-colors">Iniciar Sesión</Link>
          <Link href="/register" className="text-xs text-slate-600 hover:text-white transition-colors">Crear Cuenta</Link>
          <span className="text-slate-800">·</span>
          <span className="text-xs text-slate-700">v2.0.0</span>
        </div>
      </div>
    </div>
  );
}
