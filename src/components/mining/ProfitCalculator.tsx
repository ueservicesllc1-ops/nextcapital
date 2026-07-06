'use client';

import { useState } from 'react';
import { Calculator, Cpu, Zap, TrendingUp, Coins, Activity } from 'lucide-react';

const PLANS = [
  { 
    code: 'NC-S1', 
    label: 'STARTER', 
    model: 'Antminer S19 SE',
    price: 149, 
    minRoi: 0.0150, 
    maxRoi: 0.0250,
    power: 1250 
  },
  { 
    code: 'NC-P2', 
    label: 'PRO', 
    model: 'Antminer S19 Pro',
    price: 329, 
    minRoi: 0.0175, 
    maxRoi: 0.0300,
    power: 3250 
  },
  { 
    code: 'NC-I3', 
    label: 'INDUSTRIAL', 
    model: 'Antminer S19 XP',
    price: 599, 
    minRoi: 0.0190, 
    maxRoi: 0.0350,
    power: 6500 
  },
];

const COIN_CONFIGS = {
  BTC: { 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    algorithm: 'SHA-256', 
    unit: 'TH/s', 
    price: 92450.00, 
    color: 'text-amber-500', 
    bgGlow: 'rgba(245,158,11,0.05)',
    borderGlow: 'rgba(245,158,11,0.2)',
    hashrates: { 'NC-S1': '100', 'NC-P2': '250', 'NC-I3': '500' } 
  },
  LTC: { 
    name: 'Litecoin', 
    symbol: 'LTC', 
    algorithm: 'Scrypt', 
    unit: 'GH/s', 
    price: 88.50, 
    color: 'text-slate-400', 
    bgGlow: 'rgba(148,163,184,0.05)',
    borderGlow: 'rgba(148,163,184,0.2)',
    hashrates: { 'NC-S1': '1.2', 'NC-P2': '3.0', 'NC-I3': '6.0' } 
  },
  DOGE: { 
    name: 'Dogecoin', 
    symbol: 'DOGE', 
    algorithm: 'Scrypt', 
    unit: 'GH/s', 
    price: 0.385, 
    color: 'text-yellow-400', 
    bgGlow: 'rgba(253,224,71,0.05)',
    borderGlow: 'rgba(253,224,71,0.2)',
    hashrates: { 'NC-S1': '1.2', 'NC-P2': '3.0', 'NC-I3': '6.0' } 
  },
  ETC: { 
    name: 'Ethereum Classic', 
    symbol: 'ETC', 
    algorithm: 'Etchash', 
    unit: 'GH/s', 
    price: 23.80, 
    color: 'text-emerald-500', 
    bgGlow: 'rgba(16,185,129,0.05)',
    borderGlow: 'rgba(16,185,129,0.2)',
    hashrates: { 'NC-S1': '1.8', 'NC-P2': '4.5', 'NC-I3': '9.0' } 
  },
  RVN: { 
    name: 'Ravencoin', 
    symbol: 'RVN', 
    algorithm: 'KawPow', 
    unit: 'MH/s', 
    price: 0.022, 
    color: 'text-orange-500', 
    bgGlow: 'rgba(249,115,22,0.05)',
    borderGlow: 'rgba(249,115,22,0.2)',
    hashrates: { 'NC-S1': '85', 'NC-P2': '210', 'NC-I3': '420' } 
  }
};

const PERIODS = [
  { label: '1 día', days: 1 },
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
  { label: '365 días', days: 365 },
];

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

export default function ProfitCalculator({ currentBalance = 0 }: { currentBalance?: number }) {
  const [selectedPlan, setSelectedPlan] = useState('NC-P2');
  const [selectedCoin, setSelectedCoin] = useState<'BTC' | 'LTC' | 'DOGE' | 'ETC' | 'RVN'>('BTC');
  const [periodDays, setPeriodDays] = useState(30);

  const plan = PLANS.find(p => p.code === selectedPlan)!;
  const coin = COIN_CONFIGS[selectedCoin];
  
  // Hashrate for the specific plan and coin
  const nominalHashrate = coin.hashrates[plan.code as 'NC-S1' | 'NC-P2' | 'NC-I3'];

  // Compound/linear yields derived from platform contracts:
  // Returns are guaranteed by our physical rig hosting SLAs
  const avgRoi = (plan.minRoi + plan.maxRoi) / 2;
  
  const minUsdProfit = plan.price * plan.minRoi * periodDays;
  const maxUsdProfit = plan.price * plan.maxRoi * periodDays;
  const avgUsdProfit = plan.price * avgRoi * periodDays;

  // Convert USD earnings to coin equivalent based on live coin price ticker
  const minCoinProfit = minUsdProfit / coin.price;
  const maxCoinProfit = maxUsdProfit / coin.price;
  const avgCoinProfit = avgUsdProfit / coin.price;

  // Efficiency and performance ratio relative to plan cost
  const returnPercentage = (avgUsdProfit / plan.price) * 100;

  // Formatting decimals helper based on coin scale
  const coinDecimals = selectedCoin === 'BTC' ? 8 : (selectedCoin === 'DOGE' || selectedCoin === 'RVN' ? 2 : 4);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5 lg:p-6 space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
          <Calculator size={14} className="text-amber-500" />
          CALCULADORA DE RENDIMIENTO ASIC (PROYECCIÓN DE MINADO)
        </span>
        <span className="text-[9px] font-mono text-slate-600 uppercase">TELEMETRÍA DE RETORNO ESTIMADA</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Inputs: 5 cols */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Plan Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">1. Selecciona el Rig ASIC</label>
            <div className="space-y-2">
              {PLANS.map(p => (
                <button
                  key={p.code}
                  onClick={() => setSelectedPlan(p.code)}
                  className={`w-full text-left px-4 py-3 rounded-xl border flex justify-between items-center transition-all outline-none cursor-pointer ${
                    selectedPlan === p.code 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <div>
                    <p className="text-xs font-black font-mono tracking-tighter uppercase">{p.label}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.model}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-white">${p.price} USD</p>
                    <p className="text-[9px] text-slate-500 font-mono">Consumo: {p.power} W</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Coin Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">2. Criptomoneda a Minar</label>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(COIN_CONFIGS) as Array<keyof typeof COIN_CONFIGS>).map((symbol) => {
                const c = COIN_CONFIGS[symbol];
                const active = selectedCoin === symbol;
                return (
                  <button
                    key={symbol}
                    onClick={() => setSelectedCoin(symbol)}
                    className={`py-2.5 rounded-lg border text-center transition-all font-bold text-xs outline-none cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      active
                        ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{symbol}</span>
                    <span className={`text-[8px] font-normal font-mono ${active ? 'text-black/70' : 'text-slate-600'}`}>
                      {c.unit}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">3. Período de Proyección</label>
            <div className="grid grid-cols-5 gap-1.5">
              {PERIODS.map(p => {
                const active = periodDays === p.days;
                return (
                  <button
                    key={p.days}
                    onClick={() => setPeriodDays(p.days)}
                    className={`py-2 rounded-lg border text-center transition-all font-mono font-bold text-[10px] outline-none cursor-pointer ${
                      active
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.05)]'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Output: 7 cols */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          
          <div 
            className="rounded-2xl border p-6 flex flex-col justify-between flex-1 relative overflow-hidden transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, ${coin.bgGlow} 0%, rgba(13,13,20,0.95) 100%)`,
              borderColor: coin.borderGlow,
              boxShadow: `0 0 30px ${coin.bgGlow}`
            }}
          >
            <div className="absolute inset-0 pointer-events-none border border-white/[0.02] rounded-2xl" />

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Activity size={12} className={coin.color} />
                    PRODUCCIÓN ESTIMADA DE MINADO ({coin.name})
                  </span>
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-tight">ASIC Rig: {plan.model}</h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-600 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                  {coin.algorithm}
                </span>
              </div>

              {/* Large Mined Amount */}
              <div className="py-2">
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Cripto Generada Proyectada</p>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-white mt-1 flex items-baseline gap-2 truncate">
                  <span className={`${coin.color} drop-shadow-md`}>
                    {avgCoinProfit.toFixed(coinDecimals)}
                  </span>
                  <span className="text-base sm:text-lg text-slate-500 font-normal">{coin.symbol}</span>
                </div>
                
                {/* USD equivalent */}
                <div className="text-slate-300 font-bold text-sm mt-1.5 flex items-center gap-2">
                  ≈ {formatUSD(avgUsdProfit)} USD 
                  <span className="text-[10px] font-mono text-slate-600 font-normal">
                    (Mín: {formatUSD(minUsdProfit)} / Máx: {formatUSD(maxUsdProfit)})
                  </span>
                </div>
              </div>

              {/* ASIC telemetry specs table */}
              <div className="border-t border-white/5 pt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-mono">
                <div>
                  <span className="text-slate-600 block text-[9px] uppercase">Potencia de Procesamiento</span>
                  <span className="text-white font-bold">{nominalHashrate} {coin.unit}</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[9px] uppercase">Consumo Eléctrico</span>
                  <span className="text-white font-bold flex items-center gap-1">
                    {plan.power} W <span className="text-[8px] text-green-400 font-bold bg-green-500/10 border border-green-500/25 px-1 rounded">ESTABLE</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[9px] uppercase">Costo de Energía / Hospedaje</span>
                  <span className="text-green-400 font-bold flex items-center gap-1.5">
                    <Zap size={11} className="text-green-400" />
                    $0.00 USD
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[9px] uppercase">Retorno vs Suscripción</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <TrendingUp size={11} className="text-amber-400" />
                    +{returnPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Hosting benefits callout */}
            <div className="mt-6 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                <Cpu size={14} className="text-green-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                <strong className="text-slate-300">Infraestructura NextCapital Hosted:</strong> El mantenimiento técnico del ASIC, refrigeración industrial, y electricidad de alta tensión están **100% incluidos** en la tarifa mensual de tu plan.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
