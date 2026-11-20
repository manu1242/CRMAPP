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

export const partnerDashboardService = {
  /**
   * Fetches the partner dashboard stats for the currently authenticated or impersonated partner user.
   * Priority:
   * 1. GET /api/v1/dashboard/partner-data (API Controller with JWT Bearer auth)
   * 2. GET /api/v1/dashboard/GetPartnerDashboardData
   * 3. GET /api/v1/dashboard (General analytics API which already handles partner role on production server)
   * 4. GET /Home/GetPartnerDashboardData (Legacy web MVC endpoint fallback)
   */
  getDashboardData: async (): Promise<PartnerDashboardData> => {
    const endpoints = [
      '/api/v1/dashboard/partner-data',
      '/api/v1/dashboard/GetPartnerDashboardData',
      '/api/v1/dashboard',
      '/Home/GetPartnerDashboardData',
    ];

    let raw: any = null;

    for (const url of endpoints) {
      try {
        const response = await apiClient.get<any>(url);
        if (response) {
          raw = response;
          break;
        }
      } catch (err: any) {
        // Fall through to next available endpoint
        continue;
      }
    }

    // Default safe fallback if backend is unreachable or endpoints respond with unauthorized
    const defaultData: PartnerDashboardData = {
      totalLeads: 0,
      totalCommission: 0,
      conversionRate: 0,
      monthlyRevenue: 0,
      leadPerformance: [],
      leadStatus: { newLeads: 0, contacted: 0, qualified: 0, converted: 0 },
      commissionTrend: [],
      recentLeads: [],
    };

    if (!raw) {
      return defaultData;
    }

    const payload: any = raw?.data ?? raw ?? {};

    // Shape 1: Dedicated Partner Data (/api/v1/dashboard/partner-data or /Home/GetPartnerDashboardData)
    if (payload.totalLeads !== undefined || payload.TotalLeads !== undefined) {
      return {
        totalLeads: payload.totalLeads ?? payload.TotalLeads ?? 0,
        totalCommission: payload.totalCommission ?? payload.TotalCommission ?? 0,
        conversionRate: payload.conversionRate ?? payload.ConversionRate ?? 0,
        monthlyRevenue: payload.monthlyRevenue ?? payload.MonthlyRevenue ?? 0,
        leadPerformance: payload.leadPerformance ?? payload.LeadPerformance ?? [],
        leadStatus: payload.leadStatus ?? payload.LeadStatus ?? { newLeads: 0, contacted: 0, qualified: 0, converted: 0 },
        commissionTrend: payload.commissionTrend ?? payload.CommissionTrend ?? [],
        recentLeads: payload.recentLeads ?? payload.RecentLeads ?? [],
      };
    }

    // Shape 2: General Analytics (/api/v1/dashboard)
    const overview = payload.overview ?? payload.Overview ?? {};
    const leadsByStage = payload.leadsByStage ?? payload.LeadsByStage ?? [];
    const monthlyTrend = payload.monthlyTrend ?? payload.MonthlyTrend ?? [];
    const revenueMonthlyTrend = payload.revenueMonthlyTrend ?? payload.RevenueMonthlyTrend ?? [];

    const leadPerf: LeadPerformanceItem[] = Array.isArray(monthlyTrend)
      ? monthlyTrend.map((m: any) => ({
          month: m.month ?? m.Month ?? '',
          leads: m.count ?? m.Count ?? 0,
          conversions: 0,
        }))
      : [];

    const commTrend: CommissionTrendItem[] = Array.isArray(revenueMonthlyTrend)
      ? revenueMonthlyTrend.map((r: any) => ({
          month: r.month ?? r.Month ?? '',
          commission: r.revenue ?? r.Revenue ?? 0,
        }))
      : [];

    let newLeads = 0;
    let contacted = 0;
    let qualified = 0;
    let converted = overview.totalBookings ?? overview.TotalBookings ?? 0;

    if (Array.isArray(leadsByStage)) {
      for (const item of leadsByStage) {
        const stage = String(item.stage ?? item.Stage ?? '').toLowerCase();
        const count = Number(item.count ?? item.Count ?? 0);
        if (stage.includes('new')) newLeads += count;
        else if (stage.includes('contact')) contacted += count;
        else if (stage.includes('qual')) qualified += count;
        else if (stage.includes('won') || stage.includes('convert') || stage.includes('book')) converted += count;
      }
    }

    return {
      totalLeads: overview.totalLeads ?? overview.TotalLeads ?? 0,
      totalCommission: overview.totalRevenue ?? overview.TotalRevenue ?? 0,
      conversionRate: overview.conversionRate ?? overview.ConversionRate ?? 0,
      monthlyRevenue: overview.revenueThisMonth ?? overview.RevenueThisMonth ?? 0,
      leadPerformance: leadPerf,
      leadStatus: {
        newLeads,
        contacted,
        qualified,
        converted,
      },
      commissionTrend: commTrend,
      recentLeads: [],
    };
  },
};
