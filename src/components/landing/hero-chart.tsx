"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const chartData = [
  { day: "Mon", equity: 11200 },
  { day: "Tue", equity: 11460 },
  { day: "Wed", equity: 11780 },
  { day: "Thu", equity: 11910 },
  { day: "Fri", equity: 12150 },
  { day: "Sat", equity: 12390 },
  { day: "Sun", equity: 12450 },
];

export function HeroChart() {
  return (
    <div className="h-48 min-h-[180px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
        <LineChart data={chartData}>
          <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#64748b"
            tickLine={false}
            axisLine={false}
            width={46}
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(2, 6, 23, 0.95)",
              border: "1px solid rgba(51, 65, 85, 0.8)",
              borderRadius: "12px",
            }}
            formatter={(value) => [`$${Number(value).toLocaleString()}`, "Equity"]}
          />
          <Line
            type="monotone"
            dataKey="equity"
            stroke="#22d3ee"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 4, fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
