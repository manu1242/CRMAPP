import { ApiResponse } from './QuoatationTypes';

export interface ExpenseItem {
  expenseId: number;
  type: string; // Land, Construction, Legal, Marketing, Agent, Tax, Maintenance, Other
  description: string;
  amount: number;
  date: string; // ISO DateTime e.g. "2026-07-23T12:00:00"
  channelPartnerId: string | null;
}

export interface ExpenseSummary {
  totalExpenses: number;
  thisMonthExpenses: number;
  totalCount: number;
}

export interface ExpenseListData {
  items: ExpenseItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  summary: ExpenseSummary;
}

export interface CreateExpenseRequest {
  type: string;
  description: string;
  amount: number;
  date: string; // ISO string e.g., "2026-07-23T12:00:00"
}

export interface UpdateExpenseRequest {
  type: string;
  description: string;
  amount: number;
  date: string; // ISO string e.g., "2026-07-23T12:00:00"
}
