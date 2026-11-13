import { apiClient } from '../../../api/apiClient';
import { API_ENDPOINTS } from '../../../api/endpoints';

export interface DashboardMetrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  newInquiries: number;
  registeredEmails: number;
  totalInquiries: number;
  totalEmails: number;
}

export interface RecentTenantItem {
  tenantId: number;
  companyName: string;
  subdomain: string;
  plan: string;
  isActive: boolean;
  isSuspended: boolean;
  createdOn: string;
}

export interface RecentInquiryItem {
  inquiryId: number;
  companyName: string;
  contactPerson: string;
  phone?: string;
  email?: string;
  status: string;
  createdOn: string;
}

export interface SuperAdminDashboardData {
  metrics: DashboardMetrics;
  recentTenants: RecentTenantItem[];
  recentInquiries: RecentInquiryItem[];
}

export const superAdminDashboardApi = {
  getDashboard: async (): Promise<SuperAdminDashboardData> => {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      API_ENDPOINTS.SUPER_ADMIN.GET_DASHBOARD
    );

    if (response && response.success) {
      const apiData = response.data;
      return {
        metrics: {
          totalTenants: apiData.totalTenants ?? 0,
          activeTenants: apiData.activeTenants ?? 0,
          suspendedTenants: apiData.suspendedTenants ?? 0,
          newInquiries: apiData.newInquiries ?? 0,
          registeredEmails: apiData.totalEmails ?? apiData.activeUsers ?? 0,
          totalInquiries: apiData.totalInquiries ?? 0,
          totalEmails: apiData.totalEmails ?? 0,
        },
        recentTenants: apiData.recentRegistrations ?? [],
        recentInquiries: apiData.recentInquiries ?? [],
      };
    }

    throw new Error('Failed to retrieve dashboard data from server');
  },
};

