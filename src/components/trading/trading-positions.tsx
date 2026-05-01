"use client";

import { useState, useRef, useEffect } from "react";
import { useTrading } from "./trading-context";

export function TradingPositions() {
  const { 
    positions, assets, visualPrices, closePosition, 
    calculatePnL, setActiveAssetId, updatePosition,
    selectedPositionId, setSelectedPositionId
  } = useTrading();
  const [popoverPosId, setPopoverPosId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverPosId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-64 border-t border-white/[0.06] bg-zinc-950/80 p-4 overflow-y-auto relative">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-4 px-2">Operaciones Abiertas ({positions.length})</h3>
      
      {positions.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-zinc-600">
          No hay operaciones abiertas en este momento.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-separate border-spacing-y-1">
            <thead className="text-xs text-zinc-500 uppercase bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3 font-medium rounded-l-lg">Activo</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium text-right">Importe</th>
                <th className="px-4 py-3 font-medium text-right">Apertura</th>
                <th className="px-4 py-3 font-medium text-right">Actual</th>
                <th className="px-4 py-3 font-medium text-right">PnL</th>
                <th className="px-4 py-3 font-medium text-right rounded-r-lg">Acción</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const asset = assets.find(a => a.id === pos.assetId);
                if (!asset) return null;
                
                const currentPrice = visualPrices[pos.assetId];
                const pnl = calculatePnL(pos);
                const pnlPercent = (pnl / pos.amount) * 100;
                const isProfit = pnl >= 0;
                const isSelected = selectedPositionId === pos.id;

                return (
                  <tr 
                    key={pos.id} 
                    onClick={() => {
                      setActiveAssetId(pos.assetId);
                      setSelectedPositionId(isSelected ? null : pos.id);
                    }}
                    className={`group transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-cyan-500/10 border-y border-cyan-500/20' 
                        : 'border-b border-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <td className="px-4 py-4 font-medium text-white group-hover:text-cyan-400 transition-colors">{asset.symbol}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {pos.type === 'buy' ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/20 text-emerald-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7 7 7M12 3v18" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-widest">Compra</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/20 text-rose-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7-7-7M12 21V3" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-widest">Venta</span>
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded italic">x{pos.multiplier}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-zinc-300">{pos.amount}</td>
                    <td className="px-4 py-4 text-right text-zinc-400">
                      {pos.entryPrice ? pos.entryPrice.toFixed(asset.type === 'forex' ? 4 : 2) : '---'}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-white">
                      {currentPrice ? currentPrice.toFixed(asset.type === 'forex' ? 4 : 2) : '---'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+$' : '-$'}{pnl ? Math.abs(pnl).toFixed(2) : '0.00'}
                        <span className="text-xs ml-1 opacity-70">({isProfit ? '+' : ''}{pnlPercent ? pnlPercent.toFixed(2) : '0.00'}%)</span>
                      </div>
                      {(pos.takeProfit || pos.stopLoss) && (
                        <div className="text-[9px] text-zinc-500 mt-1 flex justify-end gap-2 uppercase font-bold">
                          {pos.takeProfit && <span className="text-emerald-500/80">TP: {pos.takeProfit}%</span>}
                          {pos.stopLoss && <span className="text-rose-500/80">SL: {pos.stopLoss}%</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right relative">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPopoverPosId(popoverPosId === pos.id ? null : pos.id);
                          }}
                          className={`p-2 rounded-lg border transition-all ${
                            pos.takeProfit || pos.stopLoss 
                              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]' 
                              : 'bg-zinc-800 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => closePosition(pos.id)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-colors border border-white/[0.1]"
                        >
                          Cerrar
                        </button>
                      </div>

                      {/* Popover de Auto-Cierre (Flotante al lado del botón) */}
                      {popoverPosId === pos.id && (
                        <div 
                          ref={popoverRef}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-full right-0 mb-2 z-[100] w-64 bg-zinc-900 border border-white/10 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
                        >
                          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Auto-Cierre
                          </h4>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-emerald-400 uppercase">Take Profit (%)</label>
                                <button 
                                  onClick={() => updatePosition(pos.id, { takeProfit: pos.takeProfit ? undefined : 20 })}
                                  className={`w-7 h-4 rounded-full transition-colors relative ${pos.takeProfit ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                >
                                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${pos.takeProfit ? 'left-3.5' : 'left-0.5'}`} />
                                </button>
                              </div>
                              {pos.takeProfit !== undefined && (
                                <input 
                                  type="number" 
                                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
                                  value={pos.takeProfit}
                                  onChange={(e) => updatePosition(pos.id, { takeProfit: Number(e.target.value) })}
                                />
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-rose-400 uppercase">Stop Loss (%)</label>
                                <button 
                                  onClick={() => updatePosition(pos.id, { stopLoss: pos.stopLoss ? undefined : -10 })}
                                  className={`w-7 h-4 rounded-full transition-colors relative ${pos.stopLoss ? 'bg-rose-500' : 'bg-zinc-700'}`}
                                >
                                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${pos.stopLoss ? 'left-3.5' : 'left-0.5'}`} />
                                </button>
                              </div>
                              {pos.stopLoss !== undefined && (
                                <input 
                                  type="number" 
                                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-rose-500/50"
                                  value={pos.stopLoss}
                                  onChange={(e) => updatePosition(pos.id, { stopLoss: Number(e.target.value) })}
                                />
                              )}
                            </div>

                            <button 
                              onClick={() => setPopoverPosId(null)}
                              className="w-full py-2 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white uppercase rounded-lg border border-white/10 transition-colors mt-2"
                            >
                              Cerrar Panel
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
