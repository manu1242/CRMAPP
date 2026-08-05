export interface ProfitExpenseItem {
  expenseId: number;
  type: string;
  description: string;
  amount: number;
  date: string; // ISO string e.g. "2026-07-23T00:00:00"
  channelPartnerId: number | null;
}

export interface ProfitRevenueItem {
  revenueId: number;
  type: string;
  description: string;
  amount: number;
  date: string; // ISO string e.g. "2026-07-23T17:45:00"
  channelPartnerId: number | null;
}

export interface ProfitAnalyticsData {
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  expenses: ProfitExpenseItem[];
  revenues: ProfitRevenueItem[];
}
