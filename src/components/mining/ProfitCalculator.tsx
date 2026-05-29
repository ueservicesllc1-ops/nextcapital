'use client';

import { useState } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';

const PLANS = [
  { code: 'NC-S1', label: 'STARTER',    minRoi: 0.0075, maxRoi: 0.011 },
  { code: 'NC-P2', label: 'PRO',        minRoi: 0.0080, maxRoi: 0.011 },
  { code: 'NC-I3', label: 'INDUSTRIAL', minRoi: 0.0085, maxRoi: 0.011 },
];

const PERIODS = [
  { label: '30 días',  days: 30  },
  { label: '60 días',  days: 60  },
  { label: '90 días',  days: 90  },
  { label: '180 días', days: 180 },
  { label: '1 año',    days: 365 },
];

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

export default function ProfitCalculator({ currentBalance = 0 }: { currentBalance?: number }) {
  const [investment, setInvestment] = useState(500);
  const [selectedPlan, setSelectedPlan] = useState('NC-P2');
  const [period, setPeriod] = useState(30);

  const plan = PLANS.find(p => p.code === selectedPlan)!;
  const avgRoi = (plan.minRoi + plan.maxRoi) / 2;

  // Compound daily
  const minTotal = investment * Math.pow(1 + plan.minRoi, period);
  const maxTotal = investment * Math.pow(1 + plan.maxRoi, period);
  const avgTotal = investment * Math.pow(1 + avgRoi, period);

  const minProfit = minTotal - investment;
  const maxProfit = maxTotal - investment;
  const avgProfit = avgTotal - investment;

  const pctReturn = ((avgTotal / investment) - 1) * 100;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5 lg:p-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-5">
        <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
          <Calculator size={14} className="text-amber-500" />
          CALCULADORA DE PROYECCIÓN
        </span>
        <span className="text-[9px] font-mono text-slate-600 uppercase">Basada en rendimiento histórico</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Investment input */}
        <div>
          <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Inversión (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
            <input
              type="number"
              min={100}
              max={1000000}
              value={investment}
              onChange={e => setInvestment(Math.max(0, Number(e.target.value)))}
              className="w-full pl-7 pr-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[500, 2000, 5000, 10000].map(v => (
              <button
                key={v}
                onClick={() => setInvestment(v)}
                className={`text-[9px] px-2 py-1 rounded font-mono font-bold border transition-all ${investment === v ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
              >
                ${v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Plan selector */}
        <div>
          <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Plan de Minería</label>
          <div className="space-y-2">
            {PLANS.map(p => (
              <button
                key={p.code}
                onClick={() => setSelectedPlan(p.code)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border font-mono text-xs transition-all ${selectedPlan === p.code ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
              >
                <span className="font-bold">{p.label}</span>
                <span className="text-[10px]">{(p.minRoi * 100).toFixed(2)}%–{(p.maxRoi * 100).toFixed(2)}% /día</span>
              </button>
            ))}
          </div>
        </div>

        {/* Period selector */}
        <div>
          <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Período</label>
          <div className="space-y-2">
            {PERIODS.map(p => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border font-mono text-xs transition-all ${period === p.days ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-5 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="text-amber-500" />
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">Proyección en {PERIODS.find(p=>p.days===period)?.label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[9px] font-mono text-slate-500 mb-1 uppercase">Capital inicial</div>
            <div className="text-lg font-black text-white font-mono">{formatUSD(investment)}</div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-slate-500 mb-1 uppercase">Ganancia mín.</div>
            <div className="text-lg font-black text-green-400 font-mono">+{formatUSD(minProfit)}</div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-slate-500 mb-1 uppercase">Ganancia máx.</div>
            <div className="text-lg font-black text-emerald-300 font-mono">+{formatUSD(maxProfit)}</div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-slate-500 mb-1 uppercase">Retorno total</div>
            <div className="text-2xl font-black text-amber-400 font-mono">+{pctReturn.toFixed(1)}%</div>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min((avgProfit / (investment * 2)) * 100, 100)}%`,
              background: 'linear-gradient(90deg, #f59e0b, #10b981)',
              boxShadow: '0 0 8px rgba(245,158,11,0.3)',
            }}
          />
        </div>
        <div className="text-[9px] font-mono text-slate-500 mt-2">
          * Basado en rendimiento promedio histórico. Los resultados pasados no garantizan ganancias futuras.
        </div>
      </div>
    </div>
  );
}
