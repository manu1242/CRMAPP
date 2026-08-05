import { apiClient } from '../../api/apiClient';

// ─── Interfaces matching backend response ─────────────────────────────────────

export interface LeadPerformanceItem {
  month: string;
  leads: number;
  conversions: number;
}

export interface LeadStatus {
  newLeads: number;
  contacted: number;
  qualified: number;
  converted: number;
}

export interface CommissionTrendItem {
  month: string;
  commission: number;
}

export interface RecentLeadItem {
  name: string;
  status: string;
  value: number;
  date: string;
}

export interface PartnerDashboardData {
  totalLeads: number;
  totalCommission: number;
  conversionRate: number;
  monthlyRevenue: number;
  leadPerformance: LeadPerformanceItem[];
  leadStatus: LeadStatus;
  commissionTrend: CommissionTrendItem[];
  recentLeads: RecentLeadItem[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const partnerDashboardService = {
  /**
   * GET /Home/GetPartnerDashboardData
   * Fetches the partner dashboard stats for the currently authenticated partner user.
   */
  getDashboardData: async (): Promise<PartnerDashboardData> => {
    const raw: any = await apiClient.get<any>('/Home/GetPartnerDashboardData');

    const data: any = raw?.data ?? raw ?? {};

    return {
      totalLeads: data.totalLeads ?? 0,
      totalCommission: data.totalCommission ?? 0,
      conversionRate: data.conversionRate ?? 0,
      monthlyRevenue: data.monthlyRevenue ?? 0,
      leadPerformance: data.leadPerformance ?? [],
      leadStatus: data.leadStatus ?? { newLeads: 0, contacted: 0, qualified: 0, converted: 0 },
      commissionTrend: data.commissionTrend ?? [],
      recentLeads: data.recentLeads ?? [],
    };
  },
};
