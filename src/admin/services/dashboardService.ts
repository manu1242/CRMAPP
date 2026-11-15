import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface MonthlyLeadItem {
  month: string;
  count: number;
}

export interface RevenueMonthlyTrendItem {
  month: string;
  revenue: number;
}

export interface LeadSourceItem {
  source: string;
  count: number;
}

export interface LeadStatusItem {
  status: string;
  count: number;
}

export interface PipelineStageItem {
  stage: string;
  count: number;
}

export interface TopAgentItem {
  agentName: string;
  leadCount: number;
  convertedCount: number;
  conversionRate: number;
}

export interface DashboardOverview {
  totalLeads?: number;
  newLeadsToday?: number;
  newLeadsThisMonth?: number;
  totalBookings?: number;
  bookingsThisMonth?: number;
  totalBookingValue?: number;
  totalRevenue?: number;
  revenueThisMonth?: number;
  conversionRate?: number;
  facebookLeads?: number;
  totalExpenses?: number;
  totalProfit?: number;
  [key: string]: any;
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

export interface RecentLeadItem {
  leadId: number;
  name: string;
  email: string;
  contact: string;
  status: string;
  stage: string;
  createdOn: string;
  type: string;
}

export interface RecentBookingItem {
  bookingId: number;
  customerName: string;
  totalAmount: number;
  bookingDate: string;
  status: string;
  type: string;
}

export interface SalesReportMonthItem {
  month: string;
  sales: number;
}

export interface SalesOverviewBookingItem {
  bookingId: number;
  bookingAmount: number;
  status: string;
  customerName?: string;
  createdOn: string;
}

export interface SalesOverviewData {
  totalEarning: number;
  totalExpenses: number;
  totalProfit: number;
  totalBookings: number;
  salesReport: SalesReportMonthItem[];
  recentBookings: SalesOverviewBookingItem[];
  salesStatus: {
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  };
}

export interface TeamMemberPerformanceItem {
  userId: number;
  username: string;
  email?: string;
  role?: string;
  leadsCount: number;
  bookingsCount: number;
}

export interface TeamDashboardData {
  totalTeamMembers: number;
  newTeamMembers: number;
  totalChannelPartners: number;
  teamPerformance: TeamMemberPerformanceItem[];
  topPerformers: TeamMemberPerformanceItem[];
}

export interface MilestoneItem {
  installmentId: number;
  bookingId: number;
  leadName: string;
  contact?: string;
  project: string;
  flat: string;
  milestone: string;
  dueDate: string;
  amount: number;
  paid: number;
  status: string;
}

export interface MilestoneStats {
  totalMilestones: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface MilestoneTrackingData {
  stats: MilestoneStats;
  items: MilestoneItem[];
}

export interface RecentActivitiesData {
  recentLeads: RecentLeadItem[];
  recentBookings: RecentBookingItem[];
}

export interface FollowUpItem {
  followUpId: number;
  leadId: number;
  leadName: string;
  leadContact: string;
  followUpDate: string;
  followUpType: string;
  status: string;
  notes: string;
  executiveName: string;
  isOverdue: boolean;
}

export interface RawDashboardResponse {
  overview?: DashboardOverview;
  totalLeads?: number;
  facebookLeads?: number;
  totalRevenue?: number;
  totalExpenses?: number;
  totalProfit?: number;
  monthlyLeads?: MonthlyLeadItem[];
  monthlyTrend?: MonthlyLeadItem[];
  revenueMonthlyTrend?: RevenueMonthlyTrendItem[];
  sources?: LeadSourceItem[];
  leadsBySource?: LeadSourceItem[];
  leadsByStatus?: LeadStatusItem[];
  pipeline?: PipelineStageItem[];
  leadsByStage?: PipelineStageItem[];
  topAgents?: TopAgentItem[];
  newLeads?: LeadSummaryItem[];
  revenueExpenses?: RevenueExpenseItem[];
  recentTransactions?: TransactionSummaryItem[];
  [key: string]: any;
}

export interface DashboardData {
  overview: DashboardOverview;
  totalLeads: number;
  facebookLeads: number;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  monthlyLeads: MonthlyLeadItem[];
  monthlyTrend: MonthlyLeadItem[];
  revenueMonthlyTrend: RevenueMonthlyTrendItem[];
  sources: LeadSourceItem[];
  leadsBySource: LeadSourceItem[];
  leadsByStatus: LeadStatusItem[];
  pipeline: PipelineStageItem[];
  leadsByStage: PipelineStageItem[];
  topAgents: TopAgentItem[];
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
    const overview: DashboardOverview = raw.overview ?? {};

    const totalLeads = raw.totalLeads ?? overview.totalLeads ?? 0;
    const facebookLeads = raw.facebookLeads ?? overview.facebookLeads ?? 0;
    const totalRevenue = raw.totalRevenue ?? overview.totalRevenue ?? 0;
    const totalExpenses = raw.totalExpenses ?? overview.totalExpenses ?? 0;
    const totalProfit = raw.totalProfit ?? overview.totalProfit ?? (totalRevenue - totalExpenses);

    const monthlyLeads = raw.monthlyTrend ?? raw.monthlyLeads ?? [];
    const monthlyTrend = raw.monthlyTrend ?? raw.monthlyLeads ?? [];
    const revenueMonthlyTrend = raw.revenueMonthlyTrend ?? [];
    const sources = raw.leadsBySource ?? raw.sources ?? [];
    const leadsBySource = raw.leadsBySource ?? raw.sources ?? [];
    const leadsByStatus = raw.leadsByStatus ?? [];
    const pipeline = raw.leadsByStage ?? raw.pipeline ?? [];
    const leadsByStage = raw.leadsByStage ?? raw.pipeline ?? [];
    const topAgents = raw.topAgents ?? [];

    return {
      overview,
      totalLeads,
      facebookLeads,
      totalRevenue,
      totalExpenses,
      totalProfit,
      monthlyLeads,
      monthlyTrend,
      revenueMonthlyTrend,
      sources,
      leadsBySource,
      leadsByStatus,
      pipeline,
      leadsByStage,
      topAgents,
      newLeads: raw.newLeads ?? [],
      revenueExpenses: raw.revenueExpenses ?? [],
      recentTransactions: raw.recentTransactions ?? [],
    };
  },

  getRecentActivities: async (signal?: AbortSignal): Promise<RecentActivitiesData> => {
    const res = await apiClient.get<ApiResponse<RecentActivitiesData>>(
      API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITIES,
      undefined,
      { signal }
    );
    const data = (res as any)?.data ?? (res as any) ?? {};
    return {
      recentLeads: Array.isArray(data.recentLeads) ? data.recentLeads : [],
      recentBookings: Array.isArray(data.recentBookings) ? data.recentBookings : [],
    };
  },

  getFollowUps: async (signal?: AbortSignal): Promise<FollowUpItem[]> => {
    const res = await apiClient.get<ApiResponse<FollowUpItem[]>>(
      API_ENDPOINTS.DASHBOARD.FOLLOW_UPS,
      undefined,
      { signal }
    );
    const data = (res as any)?.data ?? (res as any) ?? [];
    return Array.isArray(data) ? data : [];
  },

  getAdminAnalytics: async (signal?: AbortSignal): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>(
      API_ENDPOINTS.DASHBOARD.ADMIN_ANALYTICS,
      undefined,
      { signal }
    );
    return (res as any)?.data ?? (res as any) ?? {};
  },

  getSalesOverview: async (signal?: AbortSignal): Promise<SalesOverviewData> => {
    try {
      const res = await apiClient.get<ApiResponse<SalesOverviewData>>(
        API_ENDPOINTS.DASHBOARD.SALES_OVERVIEW,
        undefined,
        { signal }
      );
      const data = (res as any)?.data ?? (res as any) ?? {};
      return {
        totalEarning: data.totalEarning ?? 0,
        totalExpenses: data.totalExpenses ?? 0,
        totalProfit: data.totalProfit ?? 0,
        totalBookings: data.totalBookings ?? 0,
        salesReport: Array.isArray(data.salesReport) ? data.salesReport : [],
        recentBookings: Array.isArray(data.recentBookings) ? data.recentBookings : [],
        salesStatus: data.salesStatus ?? { paidCount: 0, pendingCount: 0, overdueCount: 0 },
      };
    } catch {
      // Fallback to MVC controller endpoint if needed
      const res = await apiClient.get<any>('/Home/GetSalesOverviewData', undefined, { signal });
      const data = res?.data ?? res ?? {};
      return {
        totalEarning: data.totalEarning ?? 0,
        totalExpenses: data.totalExpenses ?? 0,
        totalProfit: data.totalProfit ?? 0,
        totalBookings: (data.recentBookings && data.recentBookings.length) || 0,
        salesReport: Array.isArray(data.salesReport) ? data.salesReport : [],
        recentBookings: Array.isArray(data.recentBookings) ? data.recentBookings : [],
        salesStatus: data.salesStatus ?? { paidCount: 0, pendingCount: 0, overdueCount: 0 },
      };
    }
  },

  getTeamDashboard: async (signal?: AbortSignal): Promise<TeamDashboardData> => {
    try {
      const res = await apiClient.get<ApiResponse<TeamDashboardData>>(
        API_ENDPOINTS.DASHBOARD.TEAM_DASHBOARD,
        undefined,
        { signal }
      );
      const data = (res as any)?.data ?? (res as any) ?? {};
      return {
        totalTeamMembers: data.totalTeamMembers ?? 0,
        newTeamMembers: data.newTeamMembers ?? 0,
        totalChannelPartners: data.totalChannelPartners ?? 0,
        teamPerformance: Array.isArray(data.teamPerformance) ? data.teamPerformance : [],
        topPerformers: Array.isArray(data.topPerformers) ? data.topPerformers : [],
      };
    } catch {
      const res = await apiClient.get<any>('/Home/GetTeamDashboardData', undefined, { signal });
      const data = res?.data ?? res ?? {};
      return {
        totalTeamMembers: data.totalTeamMembers ?? 0,
        newTeamMembers: data.newTeamMembers ?? 0,
        totalChannelPartners: data.totalChannelPartners ?? 0,
        teamPerformance: Array.isArray(data.teamPerformance) ? data.teamPerformance : [],
        topPerformers: Array.isArray(data.topPerformers) ? data.topPerformers : [],
      };
    }
  },

  getMilestoneTracking: async (search?: string, signal?: AbortSignal): Promise<MilestoneTrackingData> => {
    const res = await apiClient.get<ApiResponse<MilestoneTrackingData>>(
      API_ENDPOINTS.DASHBOARD.MILESTONE_TRACKING,
      search ? { search } : undefined,
      { signal }
    );
    const data = (res as any)?.data ?? (res as any) ?? {};
    return {
      stats: data.stats ?? {
        totalMilestones: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
      },
      items: Array.isArray(data.items) ? data.items : [],
    };
  },
};
