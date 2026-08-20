import { apiClient } from '../../../api/apiClient';
import { API_ENDPOINTS } from '../../../api/endpoints';

export interface TenantSubscription {
  subscriptionId: number;
  tenantId: number;
  companyName: string;
  planId: number;
  planName: string;
  billingCycle: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
  cancelledOn: string | null;
  cancellationReason: string | null;
  autoRenew: boolean;
  paymentTransactionId: string | null;
  paymentMethod: string | null;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  createdOn: string;
}

export interface AssignSubscriptionRequest {
  tenantId: number;
  planId: number;
  billingCycle: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const subscriptionsApi = {
  getSubscriptions: async (): Promise<ApiResponse<TenantSubscription[]>> => {
    return apiClient.get<ApiResponse<TenantSubscription[]>>(API_ENDPOINTS.SUBSCRIPTIONS.BASE);
  },

  getSubscriptionById: async (id: number): Promise<ApiResponse<TenantSubscription>> => {
    return apiClient.get<ApiResponse<TenantSubscription>>(API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id));
  },

  assignSubscription: async (data: AssignSubscriptionRequest): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.SUBSCRIPTIONS.ASSIGN, data);
  },

  updateSubscription: async (id: number, data: any): Promise<ApiResponse<any>> => {
    return apiClient.put<ApiResponse<any>>(API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id), data);
  },

  deleteSubscription: async (id: number): Promise<ApiResponse<any>> => {
    return apiClient.delete<ApiResponse<any>>(API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id));
  },
};
