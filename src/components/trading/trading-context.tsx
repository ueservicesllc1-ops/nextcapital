"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Asset, INITIAL_ASSETS, OrderType, Position } from "@/lib/trading-types";
import { useToast } from "@/components/providers/toast-provider";

export type PriceHistoryPoint = { 
  time: number; 
  value: number; // For Line/Area
  open: number;  // For Candlestick
  high: number;
  low: number;
  close: number;
};

export type DataSourceType = "real" | "cached" | "visual_simulation";
export type Timeframe = "1s" | "30s" | "1m" | "5m" | "1h";

export const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  "1s": 1,
  "30s": 30,
  "1m": 60,
  "5m": 300,
  "1h": 3600,
};

export type TradingMode = "demo" | "real";

interface TradingContextProps {
  balance: number;
  assets: Asset[];
  activeAssetId: string;
  setActiveAssetId: (id: string) => void;
  realPrices: Record<string, number>;
  visualPrices: Record<string, number>;
  dataSource: DataSourceType;
  history: Record<string, PriceHistoryPoint[]>;
  positions: Position[];
  openPosition: (assetId: string, type: OrderType, amount: number, multiplier: number) => void;
  closePosition: (positionId: string) => void;
  updatePosition: (positionId: string, updates: Partial<Position>) => void;
  calculatePnL: (position: Position) => number;
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  tradingMode: TradingMode;
  setTradingMode: (mode: TradingMode) => void;
  rechargeDemo: () => void;
  selectedPositionId: string | null;
  setSelectedPositionId: (id: string | null) => void;
}

import { useAuth } from "@/components/providers/auth-provider";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

const TradingContext = createContext<TradingContextProps | undefined>(undefined);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const authContext = useAuth(); // Importamos Auth de forma segura
  const appUser = authContext?.appUser;
  
  const [balance, setBalance] = useState(10000);
  const [assets] = useState<Asset[]>(INITIAL_ASSETS);
  const [activeAssetId, setActiveAssetId] = useState<string>(INITIAL_ASSETS[0].id);
  const [timeframe, setTimeframeState] = useState<Timeframe>("1m");
  
  const [realPrices, setRealPrices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    INITIAL_ASSETS.forEach(a => init[a.id] = a.basePrice);
    return init;
  });

  const [visualPrices, setVisualPrices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    INITIAL_ASSETS.forEach(a => init[a.id] = a.basePrice);
    return init;
  });

  const [dataSource, setDataSource] = useState<DataSourceType>("cached");
  
  const [history, setHistory] = useState<Record<string, PriceHistoryPoint[]>>(() => {
    const init: Record<string, PriceHistoryPoint[]> = {};
    INITIAL_ASSETS.forEach(a => { init[a.id] = []; });
    return init;
  });
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradingMode, setTradingMode] = useState<TradingMode>("demo");
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);

  // Limpiar posiciones al cambiar de modo para evitar mezclar Demo y Real
  useEffect(() => {
    setPositions([]);
    setSelectedPositionId(null);
    if (tradingMode === "demo") {
      setBalance(10000); // Saldo inicial de prueba
    }
  }, [tradingMode]);

  // --- FUNCIONES CORE ---

  const calculatePnL = useCallback((position: Position) => {
    // Usamos visualPrices para que el PnL baile en tiempo real con la gráfica
    const currentPrice = visualPrices[position.assetId] || realPrices[position.assetId];
    if (!currentPrice) return 0;
    
    const priceDiff = position.type === "buy" 
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice;
      
    const percentage = priceDiff / position.entryPrice;
    return position.amount * position.multiplier * percentage;
  }, [visualPrices, realPrices]);

  const closePosition = async (positionId: string) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;
    
    const pnl = calculatePnL(pos);
    
    // Actualizamos el saldo local inmediatamente
    setBalance(prevBalance => prevBalance + pos.amount + pnl);
    
    // Mostramos la notificación una sola vez
    showToast(`Operación cerrada: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USD`, pnl >= 0 ? "success" : "error");
    
    // Removemos la posición de la lista local
    setPositions(prev => prev.filter(p => p.id !== positionId));

    // Sincronizar con Firestore en segundo plano (Solo si es MODO REAL)
    if (appUser && tradingMode === "real") {
      try {
        await deleteDoc(doc(db, "users", appUser.uid, "positions", positionId));
        await setDoc(doc(db, "users", appUser.uid, "history", positionId), {
          ...pos,
          closePrice: visualPrices[pos.assetId] || realPrices[pos.assetId],
          pnl,
          closedAt: Date.now()
        });
        await updateDoc(doc(db, "trading_balances", appUser.uid), {
          currentBalance: balance + pos.amount + pnl,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error borrando posición de Firestore:", error);
      }
    }
  };

  const updatePosition = async (positionId: string, updates: Partial<Position>) => {
    setPositions(prev => prev.map(p => p.id === positionId ? { ...p, ...updates } : p));
    if (appUser && tradingMode === "real") {
      try {
        await updateDoc(doc(db, "users", appUser.uid, "positions", positionId), updates);
      } catch (error) {
        console.error("Error actualizando posición en Firestore:", error);
        showToast("Error: No se pudieron guardar los límites en la nube", "error");
      }
    }
  };

  // Monitor de Auto-Cierre (TP/SL)
  useEffect(() => {
    positions.forEach(pos => {
      if (pos.takeProfit || pos.stopLoss) {
        const pnl = calculatePnL(pos);
        const pnlPercent = (pnl / pos.amount) * 100;

        if (pos.takeProfit && pnlPercent >= pos.takeProfit) {
          showToast(`Take Profit alcanzado: +${pnlPercent.toFixed(2)}%`, "success");
          closePosition(pos.id);
        }
        else if (pos.stopLoss && pnlPercent <= pos.stopLoss) {
          showToast(`Stop Loss alcanzado: ${pnlPercent.toFixed(2)}%`, "error");
          closePosition(pos.id);
        }
      }
    });
  }, [visualPrices, positions, closePosition, calculatePnL, showToast]);

  // Sincronización en Tiempo Real con Firestore (Modo Real)
  useEffect(() => {
    if (!appUser || tradingMode !== "real") return;

    // Escuchar Balance en tiempo real
    const unsubBalance = onSnapshot(doc(db, "trading_balances", appUser.uid), (snap) => {
      if (snap.exists() && snap.data().currentBalance !== undefined) {
        setBalance(snap.data().currentBalance);
      }
    }, (error) => {
       console.error("Error en Snapshot de Balance:", error);
       showToast("Error de conexión con tu saldo real", "error");
    });

    // Escuchar Posiciones en tiempo real
    const unsubPos = onSnapshot(collection(db, "users", appUser.uid, "positions"), (snap) => {
      const loadedPositions: Position[] = [];
      snap.forEach(doc => {
        loadedPositions.push({ id: doc.id, ...doc.data() } as Position);
      });
      setPositions(loadedPositions);
    }, (error) => {
      console.error("Error en Snapshot de Posiciones:", error);
      showToast("Error al cargar tus operaciones de la nube", "error");
    });

    return () => {
      unsubBalance();
      unsubPos();
    };
  }, [appUser, tradingMode, showToast]);

  // Function to change timeframe and clear history so it regenerates
  const setTimeframe = useCallback((tf: Timeframe) => {
    setTimeframeState(tf);
    setHistory(prev => {
      const init: Record<string, PriceHistoryPoint[]> = {};
      INITIAL_ASSETS.forEach(a => { init[a.id] = []; }); // clear history
      return init;
    });
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices");
        if (!res.ok) {
          console.error("API response not ok", res.status);
          return;
        }
        const data = await res.json();

        if (data.prices && Object.keys(data.prices).length > 0) {
          const now = Math.floor(Date.now() / 1000); 
          const tfSecs = TIMEFRAME_SECONDS[timeframe];
          // Round down current time to the nearest timeframe interval (e.g. nearest minute)
          const currentCandleTime = Math.floor(now / tfSecs) * tfSecs;
          
          setRealPrices(prevReal => {
            const newReal = { ...prevReal, ...data.prices };
            const sourceFromApi = data.dataSource as "real" | "cached";
            
            setVisualPrices(prevVisual => {
              const nextVisual = { ...prevVisual };
              
              setHistory(prevHist => {
                const nextHist = { ...prevHist };
                
                Object.keys(newReal).forEach(id => {
                  const actualPrice = newReal[id];
                  const asset = assets.find(a => a.id === id);
                  let displayPrice = actualPrice;

                  if (sourceFromApi === "cached") {
                    // Algoritmo de "Random Walk" (Paseo Aleatorio) para crear tendencias visuales
                    // En lugar de vibrar estáticamente, la vela continúa desde donde quedó la anterior
                    const prevDisplay = nextVisual[id] || actualPrice;
                    
                    // Pequeña fuerza magnética que arrastra el precio falso de vuelta al precio real 
                    // para que no se aleje demasiado de la realidad
                    const drift = (actualPrice - prevDisplay) * 0.08; 
                    
                    // Volatilidad incrementada para que el gráfico se vea muy activo
                    const jitter = actualPrice * (Math.random() - 0.5) * (asset?.volatility || 0.001) * 0.8;
                    
                    displayPrice = prevDisplay + drift + jitter;
                  }

                  nextVisual[id] = displayPrice;
                  
                  // Initialize history backwards if it's the very first time we get real data for this timeframe
                  if (!nextHist[id] || nextHist[id].length === 0) {
                    const hist: PriceHistoryPoint[] = [];
                    let p = actualPrice;
                    // volatility scales with sqrt of time
                    const tfVolatility = (asset?.volatility || 0.001) * Math.sqrt(tfSecs / 2);
                    
                    for (let i = 60; i > 0; i--) {
                      const vol = p * tfVolatility;
                      const close = p + (Math.random() - 0.5) * vol;
                      hist.push({
                        time: currentCandleTime - i * tfSecs,
                        value: close,
                        open: p,
                        high: Math.max(p, close) + Math.random() * vol * 0.5,
                        low: Math.min(p, close) - Math.random() * vol * 0.5,
                        close
                      });
                      p = close;
                    }
                    nextHist[id] = hist;
                  }
                  
                  const histArr = nextHist[id];
                  const lastPoint = histArr[histArr.length - 1];
                  
                  // Aggregation Logic: Update current candle or create a new one
                  if (lastPoint && lastPoint.time === currentCandleTime) {
                    // Update existing candle
                    lastPoint.close = displayPrice;
                    lastPoint.value = displayPrice;
                    // Actualiza el máximo y el mínimo si el precio los supera, y añade mechas (wicks) aleatorias
                    const wick = actualPrice * (asset?.volatility || 0.001) * 0.2;
                    if (displayPrice > lastPoint.high) lastPoint.high = displayPrice + Math.random() * wick;
                    if (displayPrice < lastPoint.low) lastPoint.low = displayPrice - Math.random() * wick;
                  } else {
                    // Create new candle
                    const open = lastPoint ? lastPoint.close : displayPrice;
                    const close = displayPrice;
                    const wick = actualPrice * (asset?.volatility || 0.001) * 0.3;
                    const newPoint: PriceHistoryPoint = {
                      time: currentCandleTime,
                      value: close,
                      open,
                      high: Math.max(open, close) + Math.random() * wick,
                      low: Math.min(open, close) - Math.random() * wick,
                      close
                    };
                    histArr.push(newPoint);
                    if (histArr.length > 500) histArr.shift(); 
                  }
                  
                  nextHist[id] = [...histArr]; // trigger react state
                });
                return nextHist;
              });

              return nextVisual;
            });

            setDataSource(sourceFromApi === "cached" ? "visual_simulation" : "real");

            return newReal;
          });
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 2000); 
    return () => clearInterval(interval);
  }, [assets, timeframe]);


  const openPosition = async (assetId: string, type: OrderType, amount: number, multiplier: number) => {
    if (amount <= 0) {
      showToast("Cantidad inválida", "error");
      return;
    }
    if (balance < amount) {
      showToast("Saldo insuficiente", "error");
      return;
    }

    const currentPrice = realPrices[assetId];
    if (!currentPrice) {
      showToast("Precio no disponible, intenta de nuevo", "error");
      return;
    }

    // Actualiza UI local inmediatamente para no tener lag
    setBalance(prev => prev - amount);

    // Spread Dinámico (Comisión del broker realista)
    const asset = assets.find(a => a.id === assetId);
    
    const getDynamicSpread = (assetType?: string) => {
      const now = new Date();
      const day = now.getUTCDay();
      const hourEst = now.getUTCHours() - 4;
      const isWeekend = day === 0 || day === 6;
      const isMarketOpen = !isWeekend && (hourEst >= 9 && hourEst < 16);
      const volatilitySpike = Math.random() > 0.8 ? 3 : 1; 

      if (assetType === 'crypto') {
        return 0.001 * volatilitySpike;
      } else if (assetType === 'forex') {
        return isWeekend ? 0.005 : (0.0002 * volatilitySpike);
      } else {
        if (isWeekend) return 0.015;
        if (!isMarketOpen) return 0.008;
        return 0.001 * volatilitySpike;
      }
    };

    const spreadPercentage = getDynamicSpread(asset?.type);
    
    const entryPrice = type === "buy" 
      ? currentPrice * (1 + spreadPercentage) 
      : currentPrice * (1 - spreadPercentage);
    
    const newPos: Position = {
      id: Math.random().toString(36).substring(2, 9),
      assetId,
      type,
      amount,
      multiplier,
      entryPrice,
      openAt: Date.now()
    };
    
    setPositions(prev => [...prev, newPos]);
    showToast(`Operación ${type === 'buy' ? 'Compra' : 'Venta'} abierta`, "success");

    // Sincronizar con Firestore en segundo plano (Solo si es MODO REAL)
    if (appUser && tradingMode === "real") {
      try {
        await setDoc(doc(db, "users", appUser.uid, "positions", newPos.id), newPos);
        await updateDoc(doc(db, "trading_balances", appUser.uid), {
          currentBalance: balance - amount,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error guardando posición en Firestore:", error);
        showToast("Error: No se pudo guardar la operación en la nube", "error");
      }
    }
  };


  const rechargeDemo = () => {
    if (tradingMode === "demo") {
      setBalance(10000);
      showToast("Saldo de prueba recargado: $10,000", "success");
    }
  };


  return (
    <TradingContext.Provider value={{
      balance,
      assets,
      activeAssetId,
      setActiveAssetId,
      realPrices,
      visualPrices,
      dataSource,
      history,
      positions,
      openPosition,
      closePosition,
      updatePosition,
      calculatePnL,
      timeframe,
      setTimeframe,
      tradingMode,
      setTradingMode,
      rechargeDemo,
      selectedPositionId,
      setSelectedPositionId,
    }}>
      {children}
    </TradingContext.Provider>
  );
}

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) throw new Error("useTrading must be used within TradingProvider");
  return context;
};
