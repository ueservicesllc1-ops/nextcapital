import { INITIAL_ASSETS } from "./trading-types";

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
const CACHE_SECONDS = Number(process.env.MARKET_DATA_CACHE_SECONDS) || 30;
const CACHE_DURATION_MS = CACHE_SECONDS * 1000;

// Global cache object 
const priceCache: Record<string, { price: number; timestamp: number }> = {};

export type MarketDataResult = {
  prices: Record<string, number>;
  dataSource: "real" | "cached";
};

export async function getLivePrices(apiSymbols: string[]): Promise<MarketDataResult> {
  const result: MarketDataResult = {
    prices: {},
    dataSource: "cached" // Default to cached
  };

  if (!TWELVE_DATA_API_KEY || apiSymbols.length === 0) return result;

  const now = Date.now();
  const symbolsToFetch: string[] = [];

  // Check cache
  for (const symbol of apiSymbols) {
    if (priceCache[symbol] && (now - priceCache[symbol].timestamp < CACHE_DURATION_MS)) {
      result.prices[symbol] = priceCache[symbol].price;
    } else {
      symbolsToFetch.push(symbol);
    }
  }

  // If there are symbols that need fresh data
  if (symbolsToFetch.length > 0) {
    try {
      const symbolsParam = symbolsToFetch.join(",");
      const res = await fetch(`https://api.twelvedata.com/price?symbol=${symbolsParam}&apikey=${TWELVE_DATA_API_KEY}`);
      
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      
      console.log(`🤖 [Backend] TwelveData Respuesta Cruda para ${symbolsParam}:`, data);
      
      let fetchedSomethingReal = false;

      if (data) {
        if (data.status === "error") {
          throw new Error(`Twelve Data API Error: ${data.message}`);
        }
        
        if (symbolsToFetch.length === 1) {
          if (data.price) {
            const val = Number(data.price);
            priceCache[symbolsToFetch[0]] = { price: val, timestamp: now };
            result.prices[symbolsToFetch[0]] = val;
            fetchedSomethingReal = true;
          }
        } else {
          for (const symbol of symbolsToFetch) {
            if (data[symbol] && data[symbol].price) {
              const val = Number(data[symbol].price);
              priceCache[symbol] = { price: val, timestamp: now };
              result.prices[symbol] = val;
              fetchedSomethingReal = true;
            }
          }
        }
      }

      if (fetchedSomethingReal) {
        result.dataSource = "real";
      }

    } catch (error) {
      console.error("Error fetching from Twelve Data:", error);
      // Fallback to old cache on error
      for (const symbol of symbolsToFetch) {
        if (priceCache[symbol]) {
          result.prices[symbol] = priceCache[symbol].price;
        } else {
          // Ultimate fallback: if cache is empty (e.g. server just restarted) and API failed (e.g. out of credits)
          // we inject the basePrice so the simulation can still run and the screen doesn't stay black!
          const asset = INITIAL_ASSETS.find(a => a.apiSymbol === symbol);
          if (asset) {
            result.prices[symbol] = asset.basePrice;
            priceCache[symbol] = { price: asset.basePrice, timestamp: now };
          }
        }
      }
    }
  }

  return result;
}
