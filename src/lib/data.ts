import {
  collection,
  doc,
  getDocs,
  query,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Balance, Deposit, Transaction, Withdrawal } from "@/lib/types";
import { normalizeDate } from "@/lib/firestore-client";

const INVESTMENT_PLAN_EXCLUDE = ["wallet_topup", "trading_wallet_topup"];

// ─── Gráfico: balance acumulado día a día ───────────────────
function buildGrowth(events: Array<{ createdAt: string | number; amount: number; type: string; status: string }>) {
  const sorted = [...events].sort(
    (a, b) => new Date(normalizeDate(a.createdAt)).getTime() - new Date(normalizeDate(b.createdAt)).getTime()
  );

  const byDay = new Map<string, number>();
  let running = 0;

  for (const item of sorted) {
    if (item.status !== "approved") continue;
    const key = new Date(normalizeDate(item.createdAt)).toISOString().split("T")[0];
    if (item.type === "deposit" || item.type === "profit") running += item.amount;
    else if (item.type === "withdrawal") running -= item.amount;
    byDay.set(key, running);
  }

  if (!byDay.size) {
    const today = new Date();
    return [{ name: today.toLocaleDateString("es-ES", { day: "numeric", month: "short" }), balance: 0 }];
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, balance]) => ({
      name: new Date(key + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      balance,
    }));
}

// ─── getInvestorData: SOLO LECTURA ──────────────────────────
// La acreditación de intereses ocurre en /api/investor/credit-interests
// que se llama desde el dashboard al montar el componente.
export async function getInvestorData(userId: string) {
  const balanceRef = doc(db, "balances", userId);
  const [balanceSnap, depositsSnap, trxSnap, wdSnap] = await Promise.all([
    getDoc(balanceRef),
    getDocs(query(collection(db, "deposits"), where("userId", "==", userId), where("status", "==", "approved"))),
    getDocs(query(collection(db, "transactions"), where("userId", "==", userId))),
    getDocs(query(collection(db, "withdrawals"), where("userId", "==", userId))),
  ]);

  const balance: Balance = (balanceSnap.data() as Balance | undefined) ?? {
    userId,
    totalDeposited: 0,
    totalProfit: 0,
    currentBalance: 0,
    updatedAt: new Date().toISOString(),
  };

  const deposits = depositsSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Deposit, "id">), createdAt: normalizeDate(d.data().createdAt) }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as Deposit[];

  const transactions = trxSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, "id">), createdAt: normalizeDate(d.data().createdAt) }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as Transaction[];

  const withdrawals = wdSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Withdrawal, "id">), createdAt: normalizeDate(d.data().createdAt) }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as Withdrawal[];

  // Gráfico: depósitos de plan + ganancias
  const planDeposits = deposits.filter((d) => !INVESTMENT_PLAN_EXCLUDE.includes(d.planId ?? ""));
  const profitTrx = transactions.filter((t) => t.type === "profit" && t.status === "approved");

  const growth = buildGrowth([
    ...planDeposits.map((d) => ({ ...d, type: "deposit" })),
    ...profitTrx,
  ]);

  return { balance, deposits, transactions, withdrawals, growth };
}
