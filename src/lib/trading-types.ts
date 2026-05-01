export type Asset = {
  id: string;
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number;
  type: "crypto" | "stock" | "forex";
  apiSymbol: string; // Twelve Data symbol
};

export type OrderType = "buy" | "sell";

export type Position = {
  id: string;
  assetId: string;
  type: OrderType;
  amount: number;
  multiplier: number;
  entryPrice: number;
  openAt: number;
  takeProfit?: number; // Porcentaje de ganancia (ej. 20 para 20%)
  stopLoss?: number;   // Porcentaje de pérdida (ej. -10 para -10%)
};

export const INITIAL_ASSETS: Asset[] = [
  // Criptomonedas
  { id: "BTC-USD", symbol: "BTC/USD", name: "Bitcoin", type: "crypto", basePrice: 65000, volatility: 0.003, apiSymbol: "BTC/USD" },
  { id: "ETH-USD", symbol: "ETH/USD", name: "Ethereum", type: "crypto", basePrice: 3500, volatility: 0.004, apiSymbol: "ETH/USD" },
  { id: "SOL-USD", symbol: "SOL/USD", name: "Solana", type: "crypto", basePrice: 150, volatility: 0.006, apiSymbol: "SOL/USD" },
  { id: "XRP-USD", symbol: "XRP/USD", name: "Ripple", type: "crypto", basePrice: 0.60, volatility: 0.005, apiSymbol: "XRP/USD" },
  { id: "ADA-USD", symbol: "ADA/USD", name: "Cardano", type: "crypto", basePrice: 0.45, volatility: 0.006, apiSymbol: "ADA/USD" },
  { id: "DOGE-USD", symbol: "DOGE/USD", name: "Dogecoin", type: "crypto", basePrice: 0.15, volatility: 0.008, apiSymbol: "DOGE/USD" },
  
  // Acciones (US)
  { id: "AAPL", symbol: "AAPL", name: "Apple Inc.", type: "stock", basePrice: 175, volatility: 0.002, apiSymbol: "AAPL" },
  { id: "TSLA", symbol: "TSLA", name: "Tesla Inc.", type: "stock", basePrice: 180, volatility: 0.004, apiSymbol: "TSLA" },
  { id: "NVDA", symbol: "NVDA", name: "NVIDIA", type: "stock", basePrice: 850, volatility: 0.005, apiSymbol: "NVDA" },
  { id: "MSFT", symbol: "MSFT", name: "Microsoft", type: "stock", basePrice: 420, volatility: 0.0015, apiSymbol: "MSFT" },
  { id: "AMZN", symbol: "AMZN", name: "Amazon", type: "stock", basePrice: 185, volatility: 0.002, apiSymbol: "AMZN" },
  { id: "META", symbol: "META", name: "Meta Platforms", type: "stock", basePrice: 500, volatility: 0.0025, apiSymbol: "META" },
  { id: "GOOGL", symbol: "GOOGL", name: "Alphabet (Google)", type: "stock", basePrice: 165, volatility: 0.002, apiSymbol: "GOOGL" },
  { id: "NFLX", symbol: "NFLX", name: "Netflix", type: "stock", basePrice: 600, volatility: 0.0035, apiSymbol: "NFLX" },
  
  // Forex
  { id: "EUR-USD", symbol: "EUR/USD", name: "Euro / US Dollar", type: "forex", basePrice: 1.08, volatility: 0.0006, apiSymbol: "EUR/USD" },
  { id: "GBP-USD", symbol: "GBP/USD", name: "British Pound / US Dollar", type: "forex", basePrice: 1.25, volatility: 0.0007, apiSymbol: "GBP/USD" },
  { id: "USD-JPY", symbol: "USD/JPY", name: "US Dollar / Yen", type: "forex", basePrice: 155, volatility: 0.0009, apiSymbol: "USD/JPY" },
  { id: "AUD-USD", symbol: "AUD/USD", name: "Australian Dollar / USD", type: "forex", basePrice: 0.65, volatility: 0.0006, apiSymbol: "AUD/USD" },
  { id: "USD-CAD", symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", type: "forex", basePrice: 1.36, volatility: 0.0006, apiSymbol: "USD/CAD" },
  { id: "USD-CHF", symbol: "USD/CHF", name: "US Dollar / Swiss Franc", type: "forex", basePrice: 0.90, volatility: 0.0005, apiSymbol: "USD/CHF" },
];
