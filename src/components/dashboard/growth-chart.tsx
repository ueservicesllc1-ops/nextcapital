"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

export function GrowthChart({ data }: { data: Array<{ name: string; balance: number }> }) {
  return (
    <div className="h-72 w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="mb-4 text-sm font-medium text-slate-300">Crecimiento de capital</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "12px" }}
            formatter={(value) => formatCurrency(Number(value ?? 0))}
          />
          <Area type="monotone" dataKey="balance" stroke="#22d3ee" fill="url(#balanceGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
