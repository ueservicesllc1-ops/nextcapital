"use client";

import { useState } from "react";
import { useTrading } from "./trading-context";

export function TradingPanel() {
  const { assets, activeAssetId, realPrices, visualPrices, dataSource, balance, openPosition } = useTrading();
  const [amount, setAmount] = useState<string>("100");
  const [multiplier, setMultiplier] = useState<number>(1);
  
  const activeAsset = assets.find(a => a.id === activeAssetId);
  
  // Para la visualización mostramos el precio visual (el que se mueve),
  // pero las operaciones se calculan internamente con el precio real.
  const displayPrice = visualPrices[activeAssetId];

  if (!activeAsset) return null;

  const handleOpen = (type: "buy" | "sell") => {
    const val = Number(amount);
    if (!isNaN(val) && val > 0) {
      openPosition(activeAssetId, type, val, multiplier);
    }
  };

  return (
    <div className="w-80 border-l border-white/[0.06] bg-[#020203] p-6 flex flex-col relative">
      <div className="absolute top-2 right-2 text-[9px] uppercase tracking-widest font-medium">
        {dataSource === "real" && <span className="text-emerald-400">● Real Time (API)</span>}
        {dataSource === "cached" && <span className="text-amber-400">● Cached API</span>}
        {dataSource === "visual_simulation" && <span className="text-cyan-400">● Visual Simulation</span>}
      </div>

      <div className="mt-4 mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Balance Virtual</p>
        <p className="text-2xl font-bold text-white">{balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('$', '')} <span className="text-sm text-zinc-500">coins</span></p>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-white mb-4">Nueva Operación</h3>
        
        <div className="mb-4">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Importe (coins)</label>
          <div className="relative">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-900 border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Ej: 100"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">Multiplicador</label>
          <div className="flex gap-2">
            {[1, 2, 5].map(m => (
              <button
                key={m}
                onClick={() => setMultiplier(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  multiplier === m 
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" 
                    : "bg-white/[0.04] text-zinc-400 border border-transparent hover:bg-white/[0.08]"
                }`}
              >
                x{m}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-zinc-500">Volumen total:</span>
            <span className="text-white font-medium">{(Number(amount) || 0) * multiplier} coins</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Precio actual:</span>
            <span className={`font-medium transition-colors ${dataSource === 'real' ? 'text-white' : 'text-cyan-300'}`}>
              {displayPrice?.toFixed(activeAsset.type === 'forex' ? 4 : 2)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => handleOpen('buy')}
            className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Comprar
          </button>
          
          <button 
            onClick={() => handleOpen('sell')}
            className="w-full py-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Vender
          </button>
        </div>
      </div>
    </div>
  );
}
