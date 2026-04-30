import { Balance, Deposit, InvestmentPlan, Transaction, Withdrawal } from "./types";

export const demoGrowth = [
  { name: "Jan", balance: 5000 },
  { name: "Feb", balance: 5600 },
  { name: "Mar", balance: 6150 },
  { name: "Apr", balance: 6900 },
  { name: "May", balance: 7450 },
  { name: "Jun", balance: 8120 },
];

export const demoBalance: Balance = {
  userId: "demo-user",
  totalDeposited: 6500,
  totalProfit: 1620,
  currentBalance: 8120,
  updatedAt: new Date().toISOString(),
};

export const demoDeposits: Deposit[] = [
  {
    id: "dep-1",
    userId: "demo-user",
    amount: 2500,
    method: "bank",
    status: "approved",
    bankName: "Banco Pichincha",
    createdAt: "2026-04-05T10:20:00.000Z",
    approvedAt: "2026-04-05T16:20:00.000Z",
  },
  {
    id: "dep-2",
    userId: "demo-user",
    amount: 4000,
    method: "stripe",
    status: "completed",
    createdAt: "2026-04-21T12:00:00.000Z",
  },
];

export const demoTransactions: Transaction[] = [
  {
    id: "trx-1",
    userId: "demo-user",
    type: "deposit",
    amount: 4000,
    status: "completed",
    description: "Stripe card deposit",
    createdAt: "2026-04-21T12:03:00.000Z",
  },
  {
    id: "trx-2",
    userId: "demo-user",
    type: "profit",
    amount: 120,
    status: "approved",
    description: "Rendimiento estimado diario",
    createdAt: "2026-04-22T08:00:00.000Z",
  },
  {
    id: "trx-3",
    userId: "demo-user",
    type: "withdrawal",
    amount: 250,
    status: "pending",
    description: "Solicitud de retiro",
    createdAt: "2026-04-29T15:10:00.000Z",
  },
];

export const demoWithdrawals: Withdrawal[] = [
  {
    id: "wd-1",
    userId: "demo-user",
    amount: 250,
    status: "pending",
    createdAt: "2026-04-29T15:10:00.000Z",
  },
];

export const demoPlans: InvestmentPlan[] = [
  {
    id: "plan-1",
    name: "Alpha Crypto Flow",
    description: "Estrategia diversificada con exposición moderada a activos líquidos.",
    estimatedDailyRange: "hasta 1% diario en condiciones favorables",
    estimatedMonthlyRange: "hasta 30% mensual estimado",
    riskLevel: "medium",
    active: true,
  },
  {
    id: "plan-2",
    name: "Stable Yield Blend",
    description: "Enfoque conservador con rebalanceo semanal y control de riesgo.",
    estimatedDailyRange: "0.2% - 0.6% diario estimado",
    estimatedMonthlyRange: "6% - 18% mensual estimado",
    riskLevel: "low",
    active: true,
  },
];
