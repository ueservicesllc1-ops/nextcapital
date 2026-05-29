'use client';

import { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, DollarSign } from 'lucide-react';

interface Props {
  userId: string;
  userName: string;
}

export default function ReferralPanel({ userId, userName }: Props) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nextcapital.one';
  const referralLink = `${baseUrl}/register?ref=${userId}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5 lg:p-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-5">
        <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
          <Gift size={14} className="text-amber-500" />
          PROGRAMA DE REFERIDOS
        </span>
        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          ACTIVO
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center">
          <Users size={18} className="text-amber-500 mx-auto mb-2" />
          <div className="text-2xl font-black text-white font-mono">0</div>
          <div className="text-[9px] font-mono text-slate-500 uppercase mt-1">Referidos activos</div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center">
          <DollarSign size={18} className="text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-emerald-400 font-mono">$0.00</div>
          <div className="text-[9px] font-mono text-slate-500 uppercase mt-1">Comisiones ganadas</div>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <span className="text-3xl font-black text-amber-400 block">5%</span>
          <div className="text-[9px] font-mono text-slate-400 uppercase mt-1">Comisión por referido</div>
          <div className="text-[9px] font-mono text-slate-500 mt-0.5">de su primera inversión</div>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Tu enlace de referido único</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-slate-400 truncate">
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
              copied
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500 text-black hover:opacity-90'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="text-[10px] font-mono text-slate-600 mt-3 leading-relaxed">
          Comparte tu enlace. Cuando alguien se registre y realice su primera inversión, recibirás automáticamente el 5% de esa inversión como comisión en tu balance.
        </p>
      </div>
    </div>
  );
}
