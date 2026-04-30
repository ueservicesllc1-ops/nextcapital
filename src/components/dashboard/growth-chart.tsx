"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

export function GrowthChart({ data }: { data: Array<{ name: string; balance: number }> }) {
  return (
    <div className="h-72 w-full overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12]">
      <h3 className="mb-6 text-[13px] font-medium uppercase tracking-wide text-zinc-500">Crecimiento de capital</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#ffffff" strokeOpacity={0.05} strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="name" stroke="#52525b" tick={{fill: '#71717a', fontSize: 12}} tickLine={false} axisLine={false} />
          <YAxis stroke="#52525b" tick={{fill: '#71717a', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ background: "rgba(9, 9, 11, 0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)", color: "#fff" }}
            itemStyle={{ color: "#22d3ee", fontWeight: "bold" }}
            formatter={(value) => formatCurrency(Number(value ?? 0))}
          />
          <Area type="monotone" dataKey="balance" stroke="#22d3ee" fill="url(#balanceGradient)" strokeWidth={3} activeDot={{ r: 6, fill: "#020617", stroke: "#22d3ee", strokeWidth: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
