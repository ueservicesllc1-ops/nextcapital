import { NextResponse } from "next/server";
import { getLivePrices } from "@/lib/marketService";
import { INITIAL_ASSETS } from "@/lib/trading-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const apiSymbols = INITIAL_ASSETS.map(a => a.apiSymbol);
    const { prices: apiPrices, dataSource } = await getLivePrices(apiSymbols);
    
    const prices: Record<string, number> = {};
    
    // Map back to internal asset IDs
    INITIAL_ASSETS.forEach(asset => {
      if (apiPrices[asset.apiSymbol]) {
        prices[asset.id] = apiPrices[asset.apiSymbol];
      }
    });

    return NextResponse.json({ prices, dataSource });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching prices" }, { status: 500 });
  }
}
