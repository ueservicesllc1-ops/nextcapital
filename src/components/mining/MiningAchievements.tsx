'use client';

import { useEffect, useState } from 'react';
import { Trophy, Zap, Cpu, TrendingUp, Shield, Star, Lock } from 'lucide-react';

export interface Achievement {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const RARITY_COLORS = {
  common:    { border: 'border-slate-600/40',   bg: 'bg-slate-800/30',    text: 'text-slate-400',  badge: 'text-slate-500',  label: 'COMMON'    },
  rare:      { border: 'border-blue-500/40',    bg: 'bg-blue-900/20',     text: 'text-blue-400',   badge: 'text-blue-500',   label: 'RARE'      },
  epic:      { border: 'border-purple-500/40',  bg: 'bg-purple-900/20',   text: 'text-purple-400', badge: 'text-purple-500', label: 'EPIC'      },
  legendary: { border: 'border-amber-500/60',   bg: 'bg-amber-900/20',    text: 'text-amber-400',  badge: 'text-amber-400',  label: 'LEGENDARY' },
};

function buildAchievements(
  hasActivePlan: boolean,
  totalProfit: number,
  activeContractCount: number,
  planCodes: string[]
): Achievement[] {
  return [
    {
      id: 'first_node',
      icon: <Cpu size={20} />,
      title: 'Primer Nodo',
      description: 'Activaste tu primer contrato de hashrate.',
      unlocked: hasActivePlan,
      rarity: 'common',
    },
    {
      id: 'first_profit',
      icon: <Zap size={20} />,
      title: 'Primera Ganancia',
      description: 'Generaste más de $1 USD en ganancias.',
      unlocked: totalProfit >= 1,
      rarity: 'common',
    },
    {
      id: 'ten_dollars',
      icon: <TrendingUp size={20} />,
      title: 'Acumulador',
      description: 'Alcanzaste $10 USD en ganancias totales.',
      unlocked: totalProfit >= 10,
      rarity: 'rare',
    },
    {
      id: 'hundred_dollars',
      icon: <Star size={20} />,
      title: 'Operador Serio',
      description: 'Superaste los $100 USD en ganancias.',
      unlocked: totalProfit >= 100,
      rarity: 'rare',
    },
    {
      id: 'pro_tier',
      icon: <Shield size={20} />,
      title: 'Nivel PRO',
      description: 'Adquiriste un plan PRO (NC-P2).',
      unlocked: planCodes.includes('NC-P2'),
      rarity: 'epic',
    },
    {
      id: 'industrial',
      icon: <Trophy size={20} />,
      title: 'Rango Industrial',
      description: 'Activaste el plan INDUSTRIAL (NC-I3).',
      unlocked: planCodes.includes('NC-I3'),
      rarity: 'legendary',
    },
    {
      id: 'multi_node',
      icon: <Cpu size={20} />,
      title: 'Flota de Nodos',
      description: 'Tienes 3 o más nodos activos simultáneamente.',
      unlocked: activeContractCount >= 3,
      rarity: 'epic',
    },
    {
      id: 'thousand_dollars',
      icon: <Star size={20} />,
      title: 'Minero de Élite',
      description: '$1,000 USD en ganancias acumuladas.',
      unlocked: totalProfit >= 1000,
      rarity: 'legendary',
    },
  ];
}

interface Props {
  hasActivePlan: boolean;
  totalProfit: number;
  activeContractCount: number;
  planCodes: string[];
}

export default function MiningAchievements({ hasActivePlan, totalProfit, activeContractCount, planCodes }: Props) {
  const achievements = buildAchievements(hasActivePlan, totalProfit, activeContractCount, planCodes);
  const unlocked = achievements.filter(a => a.unlocked).length;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5">
      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-5">
        <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
          <Trophy size={14} className="text-amber-500" />
          LOGROS DEL MINERO
        </span>
        <span className="text-[9px] font-mono text-slate-500">
          {unlocked}/{achievements.length} desbloqueados
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(unlocked / achievements.length) * 100}%`,
              background: 'linear-gradient(90deg, #f59e0b, #f97316)',
              boxShadow: '0 0 8px rgba(245,158,11,0.4)',
            }}
          />
        </div>
        <div className="text-[9px] font-mono text-slate-500 mt-1.5 text-right">
          {Math.round((unlocked / achievements.length) * 100)}% completado
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {achievements.map(a => {
          const c = RARITY_COLORS[a.rarity];
          return (
            <div
              key={a.id}
              className={`rounded-xl p-3.5 border flex flex-col items-center text-center gap-2 transition-all duration-300
                ${a.unlocked ? `${c.border} ${c.bg}` : 'border-white/5 bg-black/20 opacity-50 grayscale'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.unlocked ? c.bg : 'bg-slate-800/30'} border ${a.unlocked ? c.border : 'border-white/5'}`}>
                {a.unlocked ? (
                  <span className={c.text}>{a.icon}</span>
                ) : (
                  <Lock size={18} className="text-slate-600" />
                )}
              </div>
              <div>
                <div className={`text-[9px] font-bold uppercase tracking-wider ${c.badge}`}>{c.label}</div>
                <div className="text-[11px] font-bold text-white mt-0.5">{a.title}</div>
                <div className="text-[9px] text-slate-500 mt-0.5 leading-snug">{a.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
