"use client";

import { useEffect, useRef, useState } from "react";
import { useTrading } from "./trading-context";
import { createChart, IChartApi, ISeriesApi, AreaSeries, CandlestickSeries, LineSeries, IPriceLine } from "lightweight-charts";
import { Timeframe } from "./trading-context";

type ChartType = "area" | "candlestick" | "line";

export function TradingChart() {
  const { assets, activeAssetId, history, timeframe, setTimeframe, selectedPositionId, positions } = useTrading();
  const activeAsset = assets.find(a => a.id === activeAssetId);
  
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    // Lightweight charts crashes if width or height is 0 (which happens on first render before flex layout computes)
    const initialWidth = chartContainerRef.current.clientWidth || 800;
    const initialHeight = chartContainerRef.current.clientHeight || 400;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 0 as any, color: "transparent" }, // ColorType.Solid is 0
        textColor: "#a1a1aa", 
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      width: initialWidth,
      height: initialHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      crosshair: {
        vertLine: { color: "#3b82f6", labelBackgroundColor: "#3b82f6" },
        horzLine: { color: "#3b82f6", labelBackgroundColor: "#3b82f6" }
      }
    });

    chartRef.current = chart;

    window.addEventListener("resize", handleResize);
    
    // Set up ResizeObserver to handle flex container resizes automatically
    const resizeObserver = new ResizeObserver(() => {
        handleResize();
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Handle Chart Type changes and series recreation
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Remove old series if exists
    if (seriesRef.current) {
      try {
        chartRef.current.removeSeries(seriesRef.current);
      } catch (e) {
        // Ignorar si la serie pertenece a una instancia anterior del gráfico (Next.js Fast Refresh)
      }
    }

    let series: ISeriesApi<any>;

    if (chartType === "area") {
      series = chartRef.current.addSeries(AreaSeries, {
        lineColor: "#22d3ee",
        topColor: "rgba(34, 211, 238, 0.4)",
        bottomColor: "rgba(34, 211, 238, 0)",
        lineWidth: 2,
      });
    } else if (chartType === "candlestick") {
      series = chartRef.current.addSeries(CandlestickSeries, {
        upColor: "#10b981", // emerald-500
        downColor: "#f43f5e", // rose-500
        borderVisible: false,
        wickUpColor: "#10b981",
        wickDownColor: "#f43f5e",
      });
    } else {
      series = chartRef.current.addSeries(LineSeries, {
        color: "#22d3ee",
        lineWidth: 2,
      });
    }

    seriesRef.current = series;
    
  }, [chartType]);

  // Update Data when history changes
  useEffect(() => {
    if (!seriesRef.current || !activeAssetId || !history[activeAssetId]) return;
    
    const data = history[activeAssetId];
    // filter uniques
    const uniqueData = data.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i);
    
    if (uniqueData.length > 0) {
      if (chartType === "candlestick") {
        seriesRef.current.setData(uniqueData as any);
      } else {
        // Area and Line need {time, value}
        const mapped = uniqueData.map(d => ({ time: d.time, value: d.value }));
        seriesRef.current.setData(mapped as any);
      }
    }
  }, [activeAssetId, history, chartType]);
  
  // Entry Price Line for Selected Position
  useEffect(() => {
    if (!seriesRef.current) return;

    // Remove existing line
    if (priceLineRef.current) {
      try {
        seriesRef.current.removePriceLine(priceLineRef.current);
      } catch (e) {}
      priceLineRef.current = null;
    }

    if (!selectedPositionId) return;

    const pos = positions.find(p => p.id === selectedPositionId);
    if (!pos || pos.assetId !== activeAssetId || !pos.entryPrice) return;

    // Create new line
    try {
      priceLineRef.current = seriesRef.current.createPriceLine({
        price: pos.entryPrice,
        color: '#3b82f6', // cyan/blue
        lineWidth: 2,
        lineStyle: 2, // Dotted
        axisLabelVisible: true,
        title: `ENTRADA ${pos.type === 'buy' ? 'COMPRA' : 'VENTA'}`,
      });
    } catch (e) {
      console.error("Error creating price line:", e);
    }

  }, [selectedPositionId, activeAssetId, positions, chartType]);

  if (!activeAsset) return null;

  const timeframes: { label: string; value: Timeframe }[] = [
    { label: "1s", value: "1s" },
    { label: "30s", value: "30s" },
    { label: "1m", value: "1m" },
    { label: "5m", value: "5m" },
    { label: "1H", value: "1h" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#020203] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{activeAsset.symbol}</h1>
          <p className="text-sm text-zinc-500">{activeAsset.name}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Selector de Timeframe */}
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/[0.06]">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${timeframe === tf.value ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/[0.1]"></div>

          {/* Selector de Tipo de Gráfico */}
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/[0.06]">
            <button
              onClick={() => setChartType("candlestick")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartType === 'candlestick' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Velas
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartType === 'area' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Área
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartType === 'line' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Línea
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full bg-zinc-950/50 rounded-2xl border border-white/[0.04] p-4 relative">
        <div ref={chartContainerRef} className="absolute inset-0 m-4" />
      </div>
    </div>
  );
}
