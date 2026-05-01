import {
  collection,
  doc,
  getDocs,
  query,
  getDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Balance, Deposit, Transaction, Withdrawal } from "@/lib/types";
import { normalizeDate } from "@/lib/firestore-client";

function buildGrowth(transactions: Transaction[], startBalance: number) {
  // Sort oldest first and compute running balance from zero
  const sorted = [...transactions].sort(
    (a, b) => new Date(normalizeDate(a.createdAt)).getTime() - new Date(normalizeDate(b.createdAt)).getTime()
  );

  // Group by YYYY-MM to avoid collisions across years
  const byMonth = new Map<string, number>();
  let running = startBalance;

  for (const item of sorted) {
    if (item.status === "rejected" || item.status === "failed") continue;
    const d = new Date(normalizeDate(item.createdAt));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
    if (item.type === "withdrawal") running -= item.amount;
    if (item.type === "deposit" || item.type === "profit") running += item.amount;
    byMonth.set(key, running);
  }

  if (!byMonth.size) {
    const now = new Date();
    return [{ name: now.toLocaleDateString("es-ES", { month: "short", year: "2-digit" }), balance: startBalance }];
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, balance]) => ({
      name: new Date(key + "-01").toLocaleDateString("es-ES", { month: "short", year: "2-digit" }),
      balance,
    }));
}

// Tasa diaria base (0.8% promedio)
const DAILY_RATE_BASE = 0.008;

export async function getInvestorData(userId: string) {
  const balanceRef = doc(db, "balances", userId);
  const balanceSnap = await getDoc(balanceRef);

  let balance = (balanceSnap.data() as Balance | undefined) ?? {
    userId,
    totalDeposited: 0,
    totalProfit: 0,
    currentBalance: 0,
    updatedAt: new Date().toISOString(),
  };

  // --- LÓGICA DE AUTO-ACREDITACIÓN (LAZY CREDIT) ---
  const now = new Date();
  
  // 1. Obtener primer depósito para hora de referencia
  const depositsRef = query(collection(db, "deposits"), where("userId", "==", userId), where("status", "==", "approved"));
  const depositsSnap = await getDocs(depositsRef);
  const deposits = depositsSnap.docs
    .map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) as Deposit[];

  if (deposits.length > 0 && balance.currentBalance > 0) {
    const referenceDate = new Date(deposits[0].createdAt);
    const lastCredit = balance.lastInterestCredit ? new Date(balance.lastInterestCredit) : null;
    
    let shouldCredit = false;
    if (!lastCredit) {
      const todayTarget = new Date(now);
      todayTarget.setHours(referenceDate.getHours(), referenceDate.getMinutes(), referenceDate.getSeconds(), 0);
      if (now.getTime() >= todayTarget.getTime()) shouldCredit = true;
    } else {
      const hoursSinceLast = (now.getTime() - lastCredit.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast >= 23.5) shouldCredit = true;
    }

    if (shouldCredit) {
      const fluctuation = (Math.random() * 0.002) - 0.001;
      const finalRate = DAILY_RATE_BASE + fluctuation;
      const profitAmount = Number((balance.currentBalance * finalRate).toFixed(2));

      if (profitAmount > 0) {
        const { writeBatch, collection: fsColl, doc: fsDoc } = await import("firebase/firestore");
        const batch = writeBatch(db);
        
        balance = {
          ...balance,
          totalProfit: (balance.totalProfit ?? 0) + profitAmount,
          currentBalance: (balance.currentBalance ?? 0) + profitAmount,
          lastInterestCredit: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        batch.set(balanceRef, balance, { merge: true });
        
        const trxRef = fsDoc(fsColl(db, "transactions"));
        batch.set(trxRef, {
          userId,
          type: "profit",
          amount: profitAmount,
          status: "approved",
          description: `Rendimiento diario automático (${(finalRate * 100).toFixed(2)}%)`,
          createdAt: now.toISOString(),
        });

        await batch.commit();
      }
    }
  }
  // --- FIN LÓGICA AUTO-ACREDITACIÓN ---

  const trxRef = query(collection(db, "transactions"), where("userId", "==", userId));
  const wdRef = query(collection(db, "withdrawals"), where("userId", "==", userId));

  const [trxSnap, wdSnap] = await Promise.all([
    getDocs(trxRef),
    getDocs(wdRef),
  ]);

  const transactions = trxSnap.docs
    .map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as Transaction[];

  const withdrawals = wdSnap.docs
    .map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as Withdrawal[];

  const sortedForGrowth = [...transactions].filter(
    (t) => t.status !== "rejected" && t.status !== "failed"
  );
  const growth = buildGrowth(sortedForGrowth, 0);

  return { balance, deposits, transactions, withdrawals, growth };
}
