import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { normalizeDate } from "@/lib/firestore-client";

const DAILY_RATE = 0.01;
const INVESTMENT_PLAN_EXCLUDE = ["wallet_topup", "trading_wallet_topup"];

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });



    // 1. Leer balance
    const balanceRef = adminDb.collection("balances").doc(userId);
    const balanceSnap = await balanceRef.get();
    const balance = balanceSnap.data() ?? { totalDeposited: 0, totalProfit: 0, currentBalance: 0 };

    // 2. Leer depósitos aprobados del plan
    const depositsSnap = await adminDb
      .collection("deposits")
      .where("userId", "==", userId)
      .where("status", "==", "approved")
      .get();

    const planDeposits = depositsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d: any) => !INVESTMENT_PLAN_EXCLUDE.includes(d.planId ?? ""))
      .sort((a: any, b: any) => new Date(normalizeDate(a.createdAt)).getTime() - new Date(normalizeDate(b.createdAt)).getTime());

    if (planDeposits.length === 0) {
      return NextResponse.json({ credited: 0, message: "No hay depósitos de plan aprobados" });
    }

    const totalDeposited = planDeposits.reduce((acc: number, d: any) => acc + (d.amount ?? 0), 0);
    const firstDeposit = new Date(normalizeDate((planDeposits[0] as any).createdAt));
    const now = new Date();

    // 3. Verificar qué días ya fueron acreditados (por ID determinista)
    const profitSnap = await adminDb
      .collection("transactions")
      .where("userId", "==", userId)
      .where("type", "==", "profit")
      .get();

    const alreadyCredited = new Set(profitSnap.docs.map((d) => d.id));

    // 4. Calcular días pendientes (misma hora exacta que el depósito)
    let iterDate = new Date(firstDeposit);
    iterDate.setDate(iterDate.getDate() + 1);

    const writes: Array<{ id: string; amount: number; date: string }> = [];

    while (iterDate <= now) {
      const dateKey = iterDate.toISOString().split("T")[0];
      const trxId = `profit-${userId}-${dateKey}`;

      if (!alreadyCredited.has(trxId) && now.getTime() >= iterDate.getTime()) {
        const amount = Number((totalDeposited * DAILY_RATE).toFixed(2));
        writes.push({ id: trxId, amount, date: iterDate.toISOString() });
      }

      iterDate = new Date(iterDate);
      iterDate.setDate(iterDate.getDate() + 1);
    }

    if (writes.length === 0) {
      return NextResponse.json({ credited: 0, message: "No hay días nuevos por acreditar" });
    }

    // 5. Escribir en batch atómico
    const batch = adminDb.batch();
    let totalToAdd = 0;

    for (const w of writes) {
      totalToAdd += w.amount;
      const ref = adminDb.collection("transactions").doc(w.id);
      batch.set(ref, {
        userId,
        type: "profit",
        amount: w.amount,
        status: "approved",
        description: "Rendimiento diario fijo (1.00%)",
        createdAt: w.date,
      });
    }

    // Balance con valores ABSOLUTOS (no increment) para garantizar idempotencia
    const newTotalProfit = (balance.totalProfit ?? 0) + totalToAdd;
    const newCurrentBalance = (balance.currentBalance ?? 0) + totalToAdd;

    batch.set(balanceRef, {
      ...balance,
      userId,
      totalDeposited,
      totalProfit: newTotalProfit,
      currentBalance: newCurrentBalance,
      lastInterestCredit: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    await batch.commit();

    return NextResponse.json({
      credited: writes.length,
      totalAdded: totalToAdd,
      newBalance: newCurrentBalance,
      days: writes.map((w) => w.id),
    });
  } catch (err: any) {
    console.error("Error acreditando intereses:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
