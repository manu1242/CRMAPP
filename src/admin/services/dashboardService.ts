import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface MonthlyLeadItem {
  month: string;
  count: number;
}

export interface LeadSourceItem {
  source: string;
  count: number;
}

export interface PipelineStageItem {
  stage: string;
  count: number;
}

export interface LeadSummaryItem {
  leadId: number;
  name: string;
  contact: string;
  stage: string;
  createdOn: string;
}

export interface RevenueExpenseItem {
  month: string;
  revenue: number;
  expenses: number;
}

export interface TransactionSummaryItem {
  paymentId: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
}

export interface RawDashboardResponse {
  totalLeads?: number;
  facebookLeads?: number;
  totalRevenue?: number;
  totalExpenses?: number;
  totalProfit?: number;
  monthlyLeads?: MonthlyLeadItem[];
  monthlyTrend?: MonthlyLeadItem[];
  sources?: LeadSourceItem[];
  leadsBySource?: LeadSourceItem[];
  pipeline?: PipelineStageItem[];
  leadsByStage?: PipelineStageItem[];
  newLeads?: LeadSummaryItem[];
  revenueExpenses?: RevenueExpenseItem[];
  recentTransactions?: TransactionSummaryItem[];
  overview?: {
    totalLeads?: number;
    totalRevenue?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface DashboardData {
  totalLeads: number;
  facebookLeads: number;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  monthlyLeads: MonthlyLeadItem[];
  sources: LeadSourceItem[];
  pipeline: PipelineStageItem[];
  newLeads: LeadSummaryItem[];
  revenueExpenses: RevenueExpenseItem[];
  recentTransactions: TransactionSummaryItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const dashboardService = {
  getDashboardData: async (signal?: AbortSignal): Promise<DashboardData> => {
    const res = await apiClient.get<ApiResponse<RawDashboardResponse>>(
      API_ENDPOINTS.DASHBOARD.ANALYTICS,
      undefined,
      { signal }
    );

    const raw: RawDashboardResponse = (res as any)?.data ?? (res as any) ?? {};
    const overview = raw.overview ?? {};

    return {
      totalLeads:         raw.totalLeads     ?? overview.totalLeads     ?? 0,
      facebookLeads:      raw.facebookLeads  ?? overview.facebookLeads  ?? 0,
      totalRevenue:       raw.totalRevenue   ?? overview.totalRevenue   ?? 0,
      totalExpenses:      raw.totalExpenses  ?? overview.totalExpenses  ?? 0,
      totalProfit:        raw.totalProfit    ?? overview.totalProfit    ?? 0,
      monthlyLeads:       raw.monthlyLeads   ?? raw.monthlyTrend        ?? [],
      sources:            raw.sources        ?? raw.leadsBySource       ?? [],
      pipeline:           raw.pipeline       ?? raw.leadsByStage        ?? [],
      newLeads:           raw.newLeads       ?? [],
      revenueExpenses:    raw.revenueExpenses ?? [],
      recentTransactions: raw.recentTransactions ?? [],
    };
  },
};
