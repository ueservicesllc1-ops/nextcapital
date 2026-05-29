'use client';

import { useEffect, useState, useRef } from 'react';
import { Globe, Cpu, Zap, Activity, ShieldCheck, HelpCircle } from 'lucide-react';

// Enhanced Data centers with granular real-world diagnostic telemetries
const NODES = [
  { 
    id: 1, 
    name: 'Reykjavik, Islandia', 
    farmName: 'Arctic Hash Hub (NC-GEO-1)', 
    lat: 64.1, 
    lng: -21.9, 
    active: true, 
    uptime: '99.98%', 
    energy: 'Geotérmica Geysir 100% Limpia', 
    cooling: 'Aire glacial geotérmico (PUE 1.04)', 
    nodes: 42,
    established: 'Ene 2024'
  },
  { 
    id: 2, 
    name: 'Houston, Texas (EE. UU.)', 
    farmName: 'Lone Star MegaFarm (NC-TEX-2)', 
    lat: 29.7, 
    lng: -95.3, 
    active: true, 
    uptime: '99.85%', 
    energy: 'Gas de antorcha recuperado (Stranded Gas)', 
    cooling: 'Inmersión Líquida Sintética (PUE 1.18)', 
    nodes: 84,
    established: 'Jun 2024'
  },
  { 
    id: 3, 
    name: 'Almaty, Kazajistán', 
    farmName: 'Steppe Mining Complex (NC-KAZ-3)', 
    lat: 43.2, 
    lng: 76.8, 
    active: true, 
    uptime: '99.72%', 
    energy: 'Red Hidroeléctrica del Tian Shan', 
    cooling: 'Aire forzado industrial (PUE 1.22)', 
    nodes: 36,
    established: 'Oct 2024'
  },
  { 
    id: 4, 
    name: 'Sichuan, China', 
    farmName: 'Yangtze Hydro Cluster (NC-SICH-4)', 
    lat: 30.6, 
    lng: 104.0, 
    active: true, 
    uptime: '99.91%', 
    energy: 'Hidroeléctrica fluvial estacional', 
    cooling: 'Flujo de río de montaña indirecto (PUE 1.08)', 
    nodes: 55,
    established: 'May 2023'
  },
  { 
    id: 5, 
    name: 'Oslo, Noruega', 
    farmName: 'Fjord EcoGrid (NC-NOR-5)', 
    lat: 59.9, 
    lng: 10.7, 
    active: true, 
    uptime: '99.96%', 
    energy: 'Energía Eólica del Mar del Norte', 
    cooling: 'Aire helado del fiordo natural (PUE 1.06)', 
    nodes: 49,
    established: 'Feb 2024'
  },
  { 
    id: 6, 
    name: 'Miami, Florida (EE. UU.)', 
    farmName: 'Solaria Mining Center (NC-MIA-6)', 
    lat: 25.7, 
    lng: -80.2, 
    active: true, 
    uptime: '99.82%', 
    energy: 'Solar Dedicada + Red Eléctrica Local', 
    cooling: 'HVAC de ciclo cerrado avanzado (PUE 1.25)', 
    nodes: 28,
    established: 'Dic 2024'
  },
  { 
    id: 7, 
    name: 'Vancouver, Canadá', 
    farmName: 'Cascade Hydro Terminal (NC-CAN-7)', 
    lat: 49.2, 
    lng: -123.1, 
    active: true, 
    uptime: '99.95%', 
    energy: 'Hidroeléctrica BC Hydro Renovable', 
    cooling: 'Intercambiadores por agua fría (PUE 1.09)', 
    nodes: 44,
    established: 'Mar 2024'
  },
  { 
    id: 8, 
    name: 'Tbilisi, Georgia', 
    farmName: 'Caucasus Crypto Fort (NC-GEO-8)', 
    lat: 41.6, 
    lng: 44.8, 
    active: true, 
    uptime: '99.78%', 
    energy: 'Parque Eólico Dedicado de Gori', 
    cooling: 'Convección ambiental forzada (PUE 1.15)', 
    nodes: 31,
    established: 'Sep 2024'
  },
  { 
    id: 9, 
    name: 'Santiago, Chile', 
    farmName: 'Andes Solar Array (NC-CHL-9)', 
    lat: -33.4, 
    lng: -70.6, 
    active: true, 
    uptime: '99.88%', 
    energy: 'Parque Solar Fotovoltaico de Atacama', 
    cooling: 'Convección seca de montaña (PUE 1.12)', 
    nodes: 50,
    established: 'Jul 2024'
  },
  { 
    id: 10, 
    name: 'Dubái, EAU', 
    farmName: 'Desert Oasis Node (NC-UAE-10)', 
    lat: 25.2, 
    lng: 55.2, 
    active: true, 
    uptime: '99.80%', 
    energy: 'Solar Fotovoltaica Concentrada', 
    cooling: 'Enfriamiento Líquido Activo (PUE 1.28)', 
    nodes: 60,
    established: 'Nov 2024'
  },
  { 
    id: 11, 
    name: 'Singapur', 
    farmName: 'Merlion Edge Cluster (NC-SGP-11)', 
    lat: 1.3, 
    lng: 103.8, 
    active: true, 
    uptime: '99.93%', 
    energy: 'Gas natural reciclado local', 
    cooling: 'Enfriamiento por inmersión bifásica (PUE 1.14)', 
    nodes: 22,
    established: 'Abr 2024'
  },
  { 
    id: 12, 
    name: 'Fráncfort, Alemania', 
    farmName: 'Rhine Computing Core (NC-GER-12)', 
    lat: 50.1, 
    lng: 8.6, 
    active: true, 
    uptime: '99.97%', 
    energy: 'Energía Eólica + Red Renovable Regional', 
    cooling: 'Enfriamiento híbrido por evaporación (PUE 1.07)', 
    nodes: 38,
    established: 'Ago 2024'
  },
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
  
  const farmContainerRef = useRef<Record<number, HTMLDivElement | null>>({});

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

  const handleNodeClick = (node: typeof NODES[0]) => {
    const isDeactivating = activeNode?.id === node.id;
    const targetNode = isDeactivating ? null : node;
    setActiveNode(targetNode);
    
    if (targetNode) {
      // Scroll smoothly to the corresponding farm diagnostic card
      setTimeout(() => {
        farmContainerRef.current[node.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }, 50);
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5 lg:p-6 space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
          <Globe size={14} className="text-amber-500 animate-spin" style={{ animationDuration: '20s' }} />
          RED GLOBAL DE NODOS — NEXTCAPITAL CLUSTER
        </span>
        <span className="text-[10px] font-mono text-slate-500 uppercase">
          {NODES.length} centros de datos activos
        </span>
      </div>

      {/* Map Visual */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-[#060609] border border-white/5 shadow-inner" style={{ paddingBottom: '50%' }}>
        <svg
          viewBox="0 0 800 400"
          className="absolute inset-0 w-full h-full"
          style={{ background: 'transparent' }}
        >
          {/* Visible High-Quality World Outline themed in dark-grey */}
          <image
            href="https://cdn.jsdelivr.net/gh/zedfar/assets@main/public/svg/map/world.svg"
            width="800"
            height="400"
            style={{
              filter: 'brightness(0) invert(0.08) opacity(0.85)',
            }}
          />

          {/* Grid lines */}
          {Array.from({ length: 19 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 21.05} x2="800" y2={i * 21.05} stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          ))}
          {Array.from({ length: 37 }, (_, i) => (
            <line key={`v${i}`} x1={i * 22.2} y1="0" x2={i * 22.2} y2="400" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          ))}

          {/* Connection lines from active hubs to main node */}
          {userHashrate > 0 && NODES.map(node => {
            const { x, y } = latLngToXY(node.lat, node.lng);
            // Main pool proxy node in Iceland roughly (NC-GEO-1)
            const ux = latLngToXY(64.1, -21.9).x;
            const uy = latLngToXY(64.1, -21.9).y;
            
            if (node.id === 1) return null; // skip iceland-to-iceland
            
            return (
              <line
                key={`line-${node.id}`}
                x1={ux} y1={uy} x2={x} y2={y}
                stroke="rgba(245,158,11,0.06)"
                strokeWidth="0.75"
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
            const isHighlighted = activeNode?.id === node.id;

            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(node)}
                className="cursor-pointer group"
              >
                {/* Outer Glow ring */}
                <circle
                  cx={x} cy={y}
                  r={isHighlighted ? 12 : 7 * pulseScale}
                  fill="none"
                  stroke={isHighlighted ? '#f59e0b' : 'rgba(245,158,11,0.4)'}
                  strokeWidth={isHighlighted ? 1.5 : 1}
                  opacity={isHighlighted ? 0.8 : pulseAlpha}
                  className="transition-all duration-300"
                />
                
                {/* Hover bubble */}
                <circle
                  cx={x} cy={y}
                  r={8}
                  fill="rgba(245,158,11,0.05)"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />

                {/* Core dot */}
                <circle
                  cx={x} cy={y}
                  r={isHighlighted ? 4.5 : 3}
                  fill={isHighlighted ? '#ffffff' : '#f59e0b'}
                  stroke={isHighlighted ? '#f59e0b' : 'none'}
                  strokeWidth={isHighlighted ? 1.5 : 0}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.9))' }}
                  className="transition-all duration-300"
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
              className="absolute z-10 pointer-events-none select-none animate-fade-in"
              style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: 'translate(-50%, -130%)' }}
            >
              <div className="bg-[#09090e]/95 border border-amber-500/40 rounded-xl px-4 py-2.5 text-xs font-mono whitespace-nowrap shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <div className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Activity size={10} className="animate-pulse" />
                  {activeNode.name}
                </div>
                <div className="text-slate-400 mt-1 text-[10px]">{activeNode.farmName}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Uptime: <span className="text-emerald-400 font-bold">{activeNode.uptime}</span></div>
              </div>
              <div className="w-0 h-0 mx-auto" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(245,158,11,0.4)' }} />
            </div>
          );
        })()}
      </div>

      {/* ── GRANJAS DE MINERÍA DIAGNOSTIC PANEL (AS requested: 'pon otros datos como tiempo activo de cada granja') ── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Cpu size={12} className="text-amber-500" />
            Monitoreo de Infraestructura por Centro de Datos
          </span>
          <span className="text-[9px] font-mono text-slate-600">
            Haz clic en un nodo para aislar telemetría
          </span>
        </div>

        {/* Scrollable grid of farms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-none">
          {NODES.map((farm) => {
            const isSelected = activeNode?.id === farm.id;
            return (
              <div
                key={farm.id}
                ref={(el) => { farmContainerRef.current[farm.id] = el; }}
                onClick={() => setActiveNode(isSelected ? null : farm)}
                className={`p-4 rounded-xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] relative ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    : 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-white/[0.01]'
                }`}
              >
                {/* Top Hub state */}
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide block">FARM_NODE #{farm.id}</span>
                    <h4 className="text-xs font-black text-white truncate max-w-[130px]">{farm.name}</h4>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      {farm.uptime}
                    </span>
                  </div>
                </div>

                {/* Sub details */}
                <div className="space-y-1.5 my-2">
                  <p className="text-[10px] text-slate-300 font-bold truncate">{farm.farmName}</p>
                  
                  <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-500">
                    <div>
                      <span className="block text-[7.5px] uppercase text-slate-600">Refrigeración</span>
                      <span className="text-slate-400 font-bold truncate block">{farm.cooling.split(' (')[0]}</span>
                    </div>
                    <div>
                      <span className="block text-[7.5px] uppercase text-slate-600">Eficiencia</span>
                      <span className="text-amber-500 font-black block">{farm.cooling.includes('PUE') ? 'PUE ' + farm.cooling.split('PUE ')[1].replace(')', '') : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom stats */}
                <div className="border-t border-white/5 pt-2 mt-1 flex justify-between items-center text-[9px] font-mono">
                  <span className="text-slate-600">Est: {farm.established}</span>
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <Zap size={9} className="text-amber-500" />
                    {farm.energy.split(' ')[0]}
                  </span>
                </div>

                {/* NextCapital Node Allocation */}
                {userHashrate > 0 && farm.id === 1 && (
                  <div className="absolute -top-1 -right-1">
                    <span className="bg-amber-500 text-black font-black text-[7px] px-1.5 py-0.5 rounded-bl rounded-tr uppercase tracking-wider shadow">
                      Tu ASIC Aquí
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
