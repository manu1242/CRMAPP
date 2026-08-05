import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

// ----------------------------------------------------
// Agent Payouts Interfaces
// ----------------------------------------------------
export interface AgentPayoutSummary {
  totalAgents: number;
  totalSales: number;
  totalCommission: number;
  totalPayouts: number;
}

export interface AgentPayoutFilters {
  month: string;
  year: number;
  search: string | null;
  agentId: number | null;
}

export interface AgentPayoutItem {
  payoutId: number;
  agentId: number;
  agentName: string;
  agentType: string; // 'Salary' | 'Commission' | 'Hybrid'
  month: string;
  year: number;
  baseSalary: number;
  attendanceDeduction: number;
  commissionAmount: number;
  totalSales: number;
  workingDays: number;
  presentDays: number;
  finalPayout: number;
  amount: number;
  status: string; // 'Pending' | 'Processed' | 'Paid'
  createdOn?: string;
  processedOn?: string | null;
}

export interface AgentPayoutListResponse {
  success: boolean;
  summary: AgentPayoutSummary;
  filters: AgentPayoutFilters;
  data: AgentPayoutItem[];
}

export interface AgentAttendanceRecord {
  date: string;
  status: string;
  loginTime: string | null;
  logoutTime: string | null;
}

export interface AgentCommissionLog {
  logId: number;
  bookingId: number;
  propertyName: string;
  flatName: string;
  saleDate: string;
  commissionAmount: number;
}

export interface AgentPayoutDetailsData {
  payout: {
    payoutId: number;
    agentId: number;
    agentName: string;
    agentEmail?: string;
    agentType: string;
    month: string;
    year: number;
    baseSalary: number;
    attendanceDeduction: number;
    commissionAmount: number;
    finalPayout: number;
    workingDays: number;
    presentDays: number;
    absentDays?: number;
    status: string;
  };
  attendanceSummary: {
    workingDays: number;
    presentEquivalentDays: number;
    absentEquivalentDays: number;
    attendanceRecords: AgentAttendanceRecord[];
  };
  commissionLogs: AgentCommissionLog[];
}

export interface AgentPayslipData {
  payslipId: number;
  agentId: number;
  agentName: string;
  designation?: string;
  month: string;
  year: number;
  earnings: {
    baseSalary: number;
    commissionEarned: number;
    grossEarnings: number;
  };
  deductions: {
    attendanceDeduction: number;
    totalDeductions: number;
  };
  netSalary: number;
}

// ----------------------------------------------------
// Channel Partner Payouts Interfaces
// ----------------------------------------------------
export interface PartnerPayoutSummary {
  totalPartners: number;
  totalSales: number;
  averageCommission: number;
  totalPayouts: number;
}

export interface PartnerPayoutFilters {
  month: string;
  year: number;
  search: string | null;
  partnerId: number | null;
}

export interface PartnerPayoutItem {
  payoutId: number;
  partnerId: number;
  companyName: string;
  contactPerson: string;
  month: string;
  year: number;
  fixedCommissionPerSale: number;
  totalSales: number;
  totalLeads: number;
  convertedLeads: number;
  totalCommission: number;
  amount: number;
  status: string; // 'Pending' | 'Processed' | 'Paid'
  createdOn?: string;
  processedOn?: string | null;
}

export interface PartnerPayoutListResponse {
  success: boolean;
  summary: PartnerPayoutSummary;
  filters: PartnerPayoutFilters;
  data: PartnerPayoutItem[];
}

export interface PartnerBookingCommissionLog {
  logId: number;
  bookingId: number;
  saleDate: string;
  customerName: string;
  propertyName: string;
  flatName: string;
  fixedCommissionAmount: number;
}

export interface PartnerPayoutDetailsData {
  payout: {
    payoutId: number;
    partnerId: number;
    companyName: string;
    contactPerson: string;
    month: string;
    year: number;
    fixedCommissionPerSale: number;
    totalSales: number;
    totalCommission: number;
    status: string;
  };
  performance: {
    totalLeads: number;
    convertedLeads: number;
    conversionRatePercentage: number;
  };
  commissionLogs: PartnerBookingCommissionLog[];
}

export interface PartnerPayslipData {
  partnerId: number;
  companyName: string;
  contactPerson: string;
  month: string;
  year: number;
  totalSales: number;
  commissionEarned: number;
  netAmount: number;
}

// ----------------------------------------------------
// Payout Service Implementation
// ----------------------------------------------------
export const payoutService = {
  // --- Agent Payouts API Methods ---

  /**
   * 1.1 List Agent Payouts & Summary Stats
   */
  getAgentPayouts: async (params?: {
    month?: string;
    year?: number;
    search?: string;
    agentId?: number;
  }): Promise<AgentPayoutListResponse> => {
    return await apiClient.get<AgentPayoutListResponse>(
      API_ENDPOINTS.PAYOUTS.AGENT.LIST,
      params
    );
  },

  /**
   * 1.2 Get Agent Payout Details
   */
  getAgentPayoutDetails: async (
    agentId: number | string,
    params?: { month?: string; year?: number }
  ): Promise<AgentPayoutDetailsData> => {
    return await apiClient.get<AgentPayoutDetailsData>(
      API_ENDPOINTS.PAYOUTS.AGENT.DETAILS(agentId),
      params
    );
  },

  /**
   * 1.3 Process Monthly Agent Payouts
   */
  processAgentPayouts: async (payload: {
    month: string;
    year: number;
  }): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.PAYOUTS.AGENT.PROCESS,
      payload
    );
  },

  /**
   * 1.4 Update Agent Payout Status
   */
  updateAgentPayoutStatus: async (payload: {
    payoutId: number;
    status: string;
  }): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.PAYOUTS.AGENT.UPDATE_STATUS,
      payload
    );
  },

  /**
   * 1.5 Generate Agent Payslip
   */
  getAgentPayslip: async (params: {
    agentId: number | string;
    month: string;
    year: number;
  }): Promise<AgentPayslipData> => {
    return await apiClient.get<AgentPayslipData>(
      API_ENDPOINTS.PAYOUTS.AGENT.PAYSLIP,
      params
    );
  },

  // --- Channel Partner Payouts API Methods ---

  /**
   * 2.1 List Channel Partner Payouts & Stats
   */
  getPartnerPayouts: async (params?: {
    month?: string;
    year?: number;
    search?: string;
    partnerId?: number;
  }): Promise<PartnerPayoutListResponse> => {
    return await apiClient.get<PartnerPayoutListResponse>(
      API_ENDPOINTS.PAYOUTS.PARTNER.LIST,
      params
    );
  },

  /**
   * 2.2 Get Channel Partner Payout Details
   */
  getPartnerPayoutDetails: async (
    partnerId: number | string,
    params?: { month?: string; year?: number }
  ): Promise<PartnerPayoutDetailsData> => {
    return await apiClient.get<PartnerPayoutDetailsData>(
      API_ENDPOINTS.PAYOUTS.PARTNER.DETAILS(partnerId),
      params
    );
  },

  /**
   * 2.3 Process Monthly Partner Payouts
   */
  processPartnerPayouts: async (payload: {
    month: string;
    year: number;
  }): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.PAYOUTS.PARTNER.PROCESS,
      payload
    );
  },

  /**
   * 2.4 Update Channel Partner Payout Status
   */
  updatePartnerPayoutStatus: async (payload: {
    payoutId: number;
    status: string;
  }): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.PAYOUTS.PARTNER.UPDATE_STATUS,
      payload
    );
  },

  /**
   * 2.5 Recalculate Partner Payouts
   */
  recalculatePartnerPayouts: async (payload: {
    month: string;
    year: number;
  }): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.PAYOUTS.PARTNER.RECALCULATE,
      payload
    );
  },

  /**
   * 2.6 Channel Partner Payslip
   */
  getPartnerPayslip: async (params: {
    partnerId: number | string;
    month: string;
    year: number;
  }): Promise<PartnerPayslipData> => {
    return await apiClient.get<PartnerPayslipData>(
      API_ENDPOINTS.PAYOUTS.PARTNER.PAYSLIP,
      params
    );
  },
};
