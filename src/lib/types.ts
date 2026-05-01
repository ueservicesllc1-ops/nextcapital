export type UserRole = "investor" | "admin";
export type EntityStatus = "active" | "inactive";

export type DepositMethod = "stripe" | "bank";
export type DepositStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "failed";
export type WithdrawalStatus = "pending" | "approved" | "rejected";
export type TransactionType = "deposit" | "profit" | "withdrawal";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  status: EntityStatus;
}

export interface Deposit {
  id: string;
  userId: string;
  amount: number;
  method: DepositMethod;
  status: DepositStatus;
  receiptUrl?: string;
  receiptPath?: string;
  bankName?: string;
  createdAt: string | number;
  approvedAt?: string;
  stripePaymentIntentId?: string;
  processedAt?: string;
}

export interface Balance {
  userId: string;
  totalDeposited: number;
  totalProfit: number;
  currentBalance: number;
  updatedAt: string | number;
  lastInterestCredit?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: DepositStatus | WithdrawalStatus;
  description: string;
  createdAt: string | number;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: string | number;
  processedAt?: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  estimatedDailyRange: string;
  estimatedMonthlyRange: string;
  riskLevel: "low" | "medium" | "high";
  active: boolean;
}
