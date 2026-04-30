import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  getDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Balance, Deposit, Transaction, Withdrawal } from "@/lib/types";
import { normalizeDate } from "@/lib/firestore-client";

function buildGrowth(transactions: Transaction[], initialBalance: number) {
  const byMonth = new Map<string, number>();
  const sorted = [...transactions].sort(
    (a, b) => new Date(normalizeDate(a.createdAt)).getTime() - new Date(normalizeDate(b.createdAt)).getTime()
  );

  let running = initialBalance;
  for (const item of sorted) {
    if (item.status === "rejected" || item.status === "failed") continue;
    const month = new Date(normalizeDate(item.createdAt)).toLocaleDateString("en-US", { month: "short" });
    if (item.type === "withdrawal") running -= item.amount;
    if (item.type === "deposit" || item.type === "profit") running += item.amount;
    byMonth.set(month, running);
  }

  if (!byMonth.size) {
    return [{ name: new Date().toLocaleDateString("en-US", { month: "short" }), balance: initialBalance }];
  }
  return Array.from(byMonth.entries()).map(([name, balance]) => ({ name, balance }));
}

export async function getInvestorData(userId: string) {
  const balanceSnap = await getDoc(doc(db, "balances", userId));
  const balancesRef = query(collection(db, "balances"), where("userId", "==", userId));
  try { 
    const fallbackBalanceSnap = await getDocs(balancesRef);
    const depositsRef = query(collection(db, "deposits"), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const trxRef = query(collection(db, "transactions"), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const wdRef = query(collection(db, "withdrawals"), where("userId", "==", userId), orderBy("createdAt", "desc"));

    const [depositsSnap, trxSnap, wdSnap] = await Promise.all([getDocs(depositsRef), getDocs(trxRef), getDocs(wdRef)]);

    const directBalance = balanceSnap.data() as Balance | undefined;
    const fallbackBalance = fallbackBalanceSnap.docs[0]?.data() as Balance | undefined;
    const balance = directBalance ?? fallbackBalance ?? {
      userId,
      totalDeposited: 0,
      totalProfit: 0,
      currentBalance: 0,
      updatedAt: new Date().toISOString(),
    };
    const deposits = depositsSnap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) })) as Deposit[];
    const transactions = trxSnap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) })) as Transaction[];
    const withdrawals = wdSnap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) })) as Withdrawal[];

    return {
      balance,
      deposits,
      transactions,
      withdrawals,
      growth: buildGrowth(transactions, balance.currentBalance),
    };
  } catch (error) {
    throw error;
  }
}
