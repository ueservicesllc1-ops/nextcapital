'use client';

import { useEffect, useState } from 'react';

// Data centers with real mining hub locations
const NODES = [
  { id: 1, name: 'Reykjavik, Iceland', lat: 64.1, lng: -21.9, active: true },
  { id: 2, name: 'Houston, Texas', lat: 29.7, lng: -95.3, active: true },
  { id: 3, name: 'Almaty, Kazakhstan', lat: 43.2, lng: 76.8, active: true },
  { id: 4, name: 'Sichuan, China', lat: 30.6, lng: 104.0, active: true },
  { id: 5, name: 'Oslo, Norway', lat: 59.9, lng: 10.7, active: true },
  { id: 6, name: 'Miami, Florida', lat: 25.7, lng: -80.2, active: true },
  { id: 7, name: 'Vancouver, Canada', lat: 49.2, lng: -123.1, active: true },
  { id: 8, name: 'Tbilisi, Georgia', lat: 41.6, lng: 44.8, active: true },
  { id: 9, name: 'Santiago, Chile', lat: -33.4, lng: -70.6, active: true },
  { id: 10, name: 'Dubai, UAE', lat: 25.2, lng: 55.2, active: true },
  { id: 11, name: 'Singapore', lat: 1.3, lng: 103.8, active: true },
  { id: 12, name: 'Frankfurt, Germany', lat: 50.1, lng: 8.6, active: true },
];

// Convert lat/lng to SVG x/y on a 800x400 equirectangular projection
function latLngToXY(lat: number, lng: number, w = 800, h = 400) {
  const x = ((lng + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return { x, y };
}

export default function MiningWorldMap({ userHashrate }: { userHashrate: number }) {
  const [pulseStates, setPulseStates] = useState<Record<number, number>>({});
  const [activeNode, setActiveNode] = useState<typeof NODES[0] | null>(null);

  useEffect(() => {
    // Randomize pulse phases per node
    const initial: Record<number, number> = {};
    NODES.forEach(n => { initial[n.id] = Math.random(); });
    setPulseStates(initial);

    const id = setInterval(() => {
      setPulseStates(prev => {
        const next = { ...prev };
        NODES.forEach(n => {
          next[n.id] = (prev[n.id] + 0.04) % 1;
        });
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5 relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
        <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          RED GLOBAL DE NODOS — NEXTCAPITAL CLUSTER
        </span>
        <span className="text-[9px] font-mono text-slate-600">{NODES.length} centros de datos activos</span>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl bg-black/40 border border-white/5" style={{ paddingBottom: '50%' }}>
        <svg
          viewBox="0 0 800 400"
          className="absolute inset-0 w-full h-full"
          style={{ background: 'transparent' }}
        >
          {/* Simple world outline — filled continents */}
          <image
            href="data:image/svg+xml;base64,..."
            width="800"
            height="400"
            opacity="0"
          />
          {/* Grid lines */}
          {Array.from({ length: 19 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 21.05} x2="800" y2={i * 21.05} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          ))}
          {Array.from({ length: 37 }, (_, i) => (
            <line key={`v${i}`} x1={i * 22.2} y1="0" x2={i * 22.2} y2="400" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          ))}

          {/* Connection lines from user to each node */}
          {userHashrate > 0 && NODES.map(node => {
            const { x, y } = latLngToXY(node.lat, node.lng);
            // User position — center of USA roughly
            const ux = latLngToXY(25.7, -80.2).x;
            const uy = latLngToXY(25.7, -80.2).y;
            return (
              <line
                key={`line-${node.id}`}
                x1={ux} y1={uy} x2={x} y2={y}
                stroke="rgba(245,158,11,0.08)"
                strokeWidth="0.5"
                strokeDasharray="4 6"
              />
            );
          })}

          {/* Node dots */}
          {NODES.map(node => {
            const { x, y } = latLngToXY(node.lat, node.lng);
            const pulse = pulseStates[node.id] ?? 0;
            const pulseScale = 1 + Math.sin(pulse * Math.PI * 2) * 0.5;
            const pulseAlpha = 1 - Math.sin(pulse * Math.PI * 2) * 0.7;

            return (
              <g
                key={node.id}
                onClick={() => setActiveNode(activeNode?.id === node.id ? null : node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse ring */}
                <circle
                  cx={x} cy={y}
                  r={6 * pulseScale}
                  fill="none"
                  stroke="rgba(245,158,11,0.4)"
                  strokeWidth="1"
                  opacity={pulseAlpha}
                />
                {/* Core dot */}
                <circle
                  cx={x} cy={y}
                  r={3}
                  fill="#f59e0b"
                  style={{ filter: 'drop-shadow(0 0 3px rgba(245,158,11,0.8))' }}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {activeNode && (() => {
          const { x, y } = latLngToXY(activeNode.lat, activeNode.lng);
          const leftPct = (x / 800) * 100;
          const topPct = (y / 400) * 100;
          return (
            <div
              className="absolute z-10 pointer-events-none"
              style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: 'translate(-50%, -140%)' }}
            >
              <div className="bg-[#0d0d14] border border-amber-500/40 rounded-lg px-3 py-2 text-[10px] font-mono whitespace-nowrap shadow-lg">
                <div className="text-amber-400 font-bold">{activeNode.name}</div>
                <div className="text-slate-400 mt-0.5">Status: <span className="text-emerald-400">ONLINE</span></div>
                <div className="text-slate-400">Uptime: {(99.5 + Math.random() * 0.5).toFixed(2)}%</div>
              </div>
              <div className="w-0 h-0 mx-auto" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(245,158,11,0.4)' }} />
            </div>
          );
        })()}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {NODES.slice(0, 6).map(n => (
          <span key={n.id} className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            {n.name}
          </span>
        ))}
        <span className="text-[9px] font-mono text-slate-600">+{NODES.length - 6} más</span>
      </div>
    </div>
  );
}
