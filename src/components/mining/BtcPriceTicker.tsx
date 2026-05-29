'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BtcPrice {
  usd: number;
  usd_24h_change: number;
}

export default function BtcPriceTicker() {
  const [price, setPrice] = useState<BtcPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  async function fetchPrice() {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
        { next: { revalidate: 60 } }
      );
      const data = await res.json();
      setPrice({
        usd: data.bitcoin.usd,
        usd_24h_change: data.bitcoin.usd_24h_change,
      });
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      // Fallback static price if API fails
      setPrice({ usd: 87452, usd_24h_change: 1.24 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPrice();
    const id = setInterval(fetchPrice, 60000); // refresh every 60s
    return () => clearInterval(id);
  }, []);

  const isUp = (price?.usd_24h_change ?? 0) >= 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/40 border border-white/5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
        <span className="text-amber-400 font-black text-sm leading-none">₿</span>
      </div>
      <div>
        {loading ? (
          <div className="text-xs font-mono text-slate-500 animate-pulse">Cargando precio...</div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white font-mono">
                ${price?.usd.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
              <span className={`flex items-center gap-0.5 text-[10px] font-bold font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {isUp ? '+' : ''}{price?.usd_24h_change.toFixed(2)}%
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-600">
              BTC/USD • Act. {lastUpdated}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
