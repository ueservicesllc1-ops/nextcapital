'use client';

import { useEffect, useState } from 'react';
import { X, Zap, TrendingUp, Award, Shield } from 'lucide-react';

export interface MiningNotification {
  id: string;
  type: 'block' | 'earnings' | 'achievement' | 'system';
  title: string;
  body: string;
}

const ICONS = {
  block:       <Zap size={14} className="text-amber-400" />,
  earnings:    <TrendingUp size={14} className="text-emerald-400" />,
  achievement: <Award size={14} className="text-purple-400" />,
  system:      <Shield size={14} className="text-blue-400" />,
};

const COLORS = {
  block:       'border-amber-500/30 bg-amber-500/10',
  earnings:    'border-emerald-500/30 bg-emerald-500/10',
  achievement: 'border-purple-500/30 bg-purple-500/10',
  system:      'border-blue-500/30 bg-blue-500/10',
};

interface Props {
  active: boolean;
  hasActivePlan: boolean;
  btcEarnings: number;
  coinSymbol?: string;
  coinPrice?: number;
}

export default function MiningNotifications({ active, hasActivePlan, btcEarnings, coinSymbol = 'BTC', coinPrice = 87452 }: Props) {
  const [notifications, setNotifications] = useState<MiningNotification[]>([]);

  function addNotif(n: Omit<MiningNotification, 'id'>) {
    const id = Math.random().toString(36).slice(2);
    setNotifications(prev => [...prev.slice(-4), { ...n, id }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(x => x.id !== id));
    }, 5000);
  }

  function dismiss(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  useEffect(() => {
    if (!hasActivePlan) return;

    // Block validation notifications every 25-45s
    const blockId = setInterval(() => {
      const rewardVal = coinSymbol === 'BTC' ? (0.000005 + Math.random() * 0.00002) :
                        coinSymbol === 'LTC' ? (0.005 + Math.random() * 0.02) :
                        coinSymbol === 'DOGE' ? (1.2 + Math.random() * 3.8) :
                        coinSymbol === 'ETC' ? (0.015 + Math.random() * 0.075) :
                        (15.0 + Math.random() * 55.0);
      
      const decimals = coinSymbol === 'BTC' ? 8 : (coinSymbol === 'DOGE' || coinSymbol === 'RVN' ? 2 : 4);
      const reward = rewardVal.toFixed(decimals);
      const blockNum = (843000 + Math.floor(Math.random() * 3000)).toLocaleString('en-US');
      
      addNotif({
        type: 'block',
        title: '⛏ Bloque validado',
        body: `Block #${blockNum} — Recompensa: ${reward} ${coinSymbol}`,
      });
    }, 25000 + Math.random() * 20000);

    // Earnings milestone every 60s
    const earningsId = setInterval(() => {
      const usdEarned = (btcEarnings * coinPrice).toFixed(2);
      addNotif({
        type: 'earnings',
        title: '💰 Acumulando ganancias',
        body: `Balance actualizado: $${usdEarned} USD minados`,
      });
    }, 60000);

    // Initial welcome notification
    setTimeout(() => {
      addNotif({
        type: 'system',
        title: '✅ Hardware ASIC online',
        body: 'Tus nodos están operando al 99.98% de eficiencia.',
      });
    }, 1500);

    return () => {
      clearInterval(blockId);
      clearInterval(earningsId);
    };
  }, [hasActivePlan]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-xs w-full">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 animate-slide-in ${COLORS[n.type]}`}
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-black/40">
            {ICONS[n.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-white">{n.title}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{n.body}</div>
          </div>
          <button
            onClick={() => dismiss(n.id)}
            className="flex-shrink-0 text-slate-500 hover:text-white transition-colors mt-0.5"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
