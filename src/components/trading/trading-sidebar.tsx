"use client";

import { useTrading } from "./trading-context";

export function TradingSidebar() {
  const { assets, activeAssetId, setActiveAssetId, visualPrices } = useTrading();

  return (
    <div className="flex h-full w-64 flex-col border-r border-white/[0.06] bg-[#020203]">
      <div className="p-4 border-b border-white/[0.06]">
        <h2 className="text-lg font-bold text-white tracking-wide">InvestPlay</h2>
        <p className="text-xs text-zinc-500">Mercados Simulados</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {assets.map(asset => {
          const isActive = asset.id === activeAssetId;
          const currentPrice = visualPrices[asset.id];
          
          return (
            <button
              key={asset.id}
              onClick={() => setActiveAssetId(asset.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                isActive 
                  ? "bg-white/[0.08] border border-white/[0.1]" 
                  : "hover:bg-white/[0.02] border border-transparent"
              }`}
            >
              <div className="text-left">
                <p className={`font-medium ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                  {asset.symbol}
                </p>
                <p className="text-[10px] text-zinc-500">{asset.name}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${isActive ? 'text-cyan-400' : 'text-zinc-400'}`}>
                  {currentPrice ? currentPrice.toFixed(asset.type === 'forex' ? 4 : 2) : '---'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
