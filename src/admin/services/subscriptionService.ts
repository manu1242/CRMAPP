import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface GenericApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// --- 1. Subscription Plans Interfaces ---
export interface SubscriptionPlanItem {
  planId: number;
  encodedPlanId?: string;
  planName: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxAgents: number;
  maxLeadsPerMonth: number;
  maxStorageGB: number;
  hasWhatsAppIntegration: boolean;
  hasFacebookIntegration: boolean;
  hasEmailIntegration: boolean;
  hasCustomAPIAccess: boolean;
  hasAdvancedReports: boolean;
  hasCustomReports: boolean;
  hasDataExport: boolean;
  hasPrioritySupport: boolean;
  hasPhoneSupport: boolean;
  hasDedicatedmanager: boolean;
  supportLevel?: string;
  planType?: string;
  isActive: boolean;
  sortOrder: number;
  createdDate?: string;
  updatedOn?: string | null;
  activeSubscribers?: number;
}

export interface PlanStats {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
}

export interface GetPlansResponse {
  success: boolean;
  message?: string;
  data: {
    stats: PlanStats;
    plans: SubscriptionPlanItem[];
  };
}

export interface GetPlanDetailsResponse {
  success: boolean;
  message?: string;
  data: SubscriptionPlanItem;
}

export interface CreatePlanPayload {
  planName: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxAgents: number;
  maxLeadsPerMonth: number;
  maxStorageGB: number;
  hasWhatsAppIntegration: boolean;
  hasFacebookIntegration: boolean;
  hasEmailIntegration: boolean;
  hasCustomAPIAccess: boolean;
  hasAdvancedReports: boolean;
  hasCustomReports: boolean;
  hasDataExport: boolean;
  hasPrioritySupport: boolean;
  hasPhoneSupport: boolean;
  hasDedicatedmanager: boolean;
  supportLevel?: string;
  planType?: string;
  isActive: boolean;
  sortOrder: number;
}

// --- 2. Partner Subscriptions Interfaces ---
export interface PartnerSubscriptionItem {
  subscriptionId: number;
  channelPartnerId: number;
  partnerName: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  planId: number;
  planName: string;
  billingCycle: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
  autoRenew: boolean;
  paymentMethod?: string;
  paymentTransactionId?: string;
  currentAgentCount: number;
  currentMonthLeads: number;
  currentStorageUsedGB: number;
  createdOn?: string;
}

export interface PartnerSubStats {
  totalSubscriptions: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

export interface GetPartnerSubscriptionsResponse {
  success: boolean;
  message?: string;
  data: {
    stats: PartnerSubStats;
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    subscriptions: PartnerSubscriptionItem[];
  };
}

export interface AssignSubscriptionPayload {
  channelPartnerId: number;
  planId: number;
  billingCycle: string;
  amount: number;
  autoRenew: boolean;
  paymentMethod?: string;
  paymentTransactionId?: string;
}

// --- 3. Razorpay Transactions Interfaces ---
export interface RazorpayTransactionItem {
  transactionId: number;
  transactionReference: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  channelPartnerId?: number;
  partnerName?: string;
  subscriptionId?: number;
  planName?: string;
  amount: number;
  currency: string;
  transactionType: string;
  status: string;
  paymentMethod?: string;
  cardType?: string;
  cardNetwork?: string;
  cardLast4?: string;
  bankName?: string;
  transactionDate: string;
  completedDate?: string;
  description?: string;
  failureReason?: string | null;
}

export interface RazorpayStats {
  totalTransactions: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  totalSuccessfulAmount: number;
}

export interface GetRazorpayTransactionsResponse {
  success: boolean;
  message?: string;
  data: {
    stats: RazorpayStats;
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    transactions: RazorpayTransactionItem[];
  };
}

// --- 4. Pending Refunds Interfaces ---
export interface PendingRefundItem {
  transactionId: number;
  subscriptionId: number;
  transactionReference: string;
  razorpayPaymentId?: string;
  channelPartnerId?: number;
  partnerName?: string;
  email?: string;
  planName?: string;
  amount: number;
  currency: string;
  status: string;
  requestDate: string;
  completedDate?: string | null;
  description?: string;
}

export interface RefundStats {
  totalRefundRequests: number;
  pendingCount: number;
  processedCount: number;
  totalRefundedAmount: number;
}

export interface GetPendingRefundsResponse {
  success: boolean;
  message?: string;
  data: {
    stats: RefundStats;
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    refunds: PendingRefundItem[];
  };
}

export interface ProcessRefundPayload {
  subscriptionId: number;
  amount: number;
  reason?: string;
}

// --- 5. My CRM Plan Interfaces ---
export interface MyCrmPlanUsage {
  agentsUsed: number;
  maxAgents: number;
  agentsRemaining: number;
  leadsUsedThisMonth: number;
  maxLeadsPerMonth: number;
  leadsRemaining: number;
  storageUsedGB: number;
  maxStorageGB: number;
}

export interface MyCrmPlanFeatures {
  hasWhatsAppIntegration: boolean;
  hasFacebookIntegration: boolean;
  hasEmailIntegration: boolean;
  hasCustomAPIAccess: boolean;
  hasAdvancedReports: boolean;
  hasPrioritySupport: boolean;
  supportLevel?: string;
}

export interface CurrentSubscription {
  planName: string;
  billingCycle: string;
  amount: number;
  status: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  isTrial: boolean;
  trialExpiresOn?: string;
  autoRenew?: boolean;
}

export interface UpgradeOptionType {
  key: string;
  label: string;
  description: string;
}

export interface UpgradeOptions {
  types: UpgradeOptionType[];
}

export interface AvailablePlanItem {
  planId: number;
  planName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isCurrentPlan: boolean;
  features: string[];
}

export interface MyCrmPlanData {
  currentSubscription: CurrentSubscription;
  usage: MyCrmPlanUsage;
  features: MyCrmPlanFeatures;
  upgradeOptions?: UpgradeOptions;
  availablePlans?: AvailablePlanItem[];
}

export interface GetMyCrmPlanResponse {
  success: boolean;
  message?: string;
  data: MyCrmPlanData;
}

// --- 6. CRM Transactions Interfaces ---
export interface CrmTransactionItem {
  transactionId: number;
  transactionReference: string;
  invoiceNumber: string;
  invoiceDate: string;
  planName: string;
  billingCycle: string;
  amount: number;
  taxAmount: number;
  netAmount: number;
  currency: string;
  transactionType: string;
  status: string;
  paymentMethod: string;
  transactionDate: string;
  completedDate?: string;
  description?: string;
}

export interface CrmTxStats {
  totalTransactions: number;
  totalPaidAmount: number;
}

export interface GetCrmTransactionsResponse {
  success: boolean;
  message?: string;
  data: {
    stats: CrmTxStats;
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    transactions: CrmTransactionItem[];
  };
}

// --- SUBSCRIPTION SERVICE ---
export const subscriptionService = {
  // 1. Subscription Plans
  getPlans: async (params?: { search?: string; isActive?: boolean; planType?: string }): Promise<GetPlansResponse> => {
    return await apiClient.get<GetPlansResponse>(API_ENDPOINTS.SUBSCRIPTION_API.PLANS.LIST, { params });
  },

  getPlanDetails: async (id: number | string): Promise<GetPlanDetailsResponse> => {
    return await apiClient.get<GetPlanDetailsResponse>(API_ENDPOINTS.SUBSCRIPTION_API.PLANS.DETAILS(id));
  },

  createPlan: async (payload: CreatePlanPayload): Promise<GenericApiResponse> => {
    return await apiClient.post<GenericApiResponse>(API_ENDPOINTS.SUBSCRIPTION_API.PLANS.CREATE, payload);
  },

  updatePlan: async (id: number | string, payload: Partial<CreatePlanPayload>): Promise<GenericApiResponse> => {
    return await apiClient.put<GenericApiResponse>(API_ENDPOINTS.SUBSCRIPTION_API.PLANS.UPDATE(id), payload);
  },

  activatePlan: async (id: number | string): Promise<GenericApiResponse> => {
    return await apiClient.post<GenericApiResponse>(API_ENDPOINTS.SUBSCRIPTION_API.PLANS.ACTIVATE(id));
  },

  deactivatePlan: async (id: number | string): Promise<GenericApiResponse> => {
    return await apiClient.post<GenericApiResponse>(API_ENDPOINTS.SUBSCRIPTION_API.PLANS.DEACTIVATE(id));
  },

  deletePlan: async (id: number | string): Promise<GenericApiResponse> => {
    return await apiClient.delete<GenericApiResponse>(API_ENDPOINTS.SUBSCRIPTION_API.PLANS.DELETE(id));
  },

  // 2. Partner Subscriptions
  getPartnerSubscriptions: async (params?: {
    search?: string;
    status?: string;
    partnerId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<GetPartnerSubscriptionsResponse> => {
    return await apiClient.get<GetPartnerSubscriptionsResponse>(
      API_ENDPOINTS.SUBSCRIPTION_API.PARTNER_SUBSCRIPTIONS.LIST,
      { params }
    );
  },

  getPartnerSubscriptionDetails: async (id: number | string): Promise<GenericApiResponse> => {
    return await apiClient.get<GenericApiResponse>(API_ENDPOINTS.SUBSCRIPTION_API.PARTNER_SUBSCRIPTIONS.DETAILS(id));
  },

  assignPartnerSubscription: async (payload: AssignSubscriptionPayload): Promise<GenericApiResponse> => {
    return await apiClient.post<GenericApiResponse>(API_ENDPOINTS.SUBSCRIPTION_API.PARTNER_SUBSCRIPTIONS.ASSIGN, payload);
  },

  // 3. Razorpay Transactions
  getRazorpayTransactions: async (params?: {
    status?: string;
    method?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<GetRazorpayTransactionsResponse> => {
    return await apiClient.get<GetRazorpayTransactionsResponse>(
      API_ENDPOINTS.SUBSCRIPTION_API.RAZORPAY_TRANSACTIONS.LIST,
      { params }
    );
  },

  getRazorpayTransactionDetails: async (id: number | string): Promise<GenericApiResponse> => {
    return await apiClient.get<GenericApiResponse>(API_ENDPOINTS.SUBSCRIPTION_API.RAZORPAY_TRANSACTIONS.DETAILS(id));
  },

  // 4. Pending Refunds
  getPendingRefunds: async (params?: { page?: number; pageSize?: number }): Promise<GetPendingRefundsResponse> => {
    return await apiClient.get<GetPendingRefundsResponse>(
      API_ENDPOINTS.SUBSCRIPTION_API.PENDING_REFUNDS.LIST,
      { params }
    );
  },

  processRefund: async (payload: ProcessRefundPayload): Promise<GenericApiResponse> => {
    return await apiClient.post<GenericApiResponse>(API_ENDPOINTS.SUBSCRIPTION_API.PENDING_REFUNDS.PROCESS, payload);
  },

  // 5. My CRM Plan
  getMyCrmPlan: async (): Promise<GetMyCrmPlanResponse> => {
    return await apiClient.get<GetMyCrmPlanResponse>(API_ENDPOINTS.SUBSCRIPTION_API.MY_CRM_PLAN.GET);
  },

  // 6. CRM Transactions
  getCrmTransactions: async (params?: { page?: number; pageSize?: number }): Promise<GetCrmTransactionsResponse> => {
    return await apiClient.get<GetCrmTransactionsResponse>(
      API_ENDPOINTS.SUBSCRIPTION_API.CRM_TRANSACTIONS.LIST,
      { params }
    );
  },

  getCrmTransactionDetails: async (id: number | string): Promise<GenericApiResponse> => {
    return await apiClient.get<GenericApiResponse>(API_ENDPOINTS.SUBSCRIPTION_API.CRM_TRANSACTIONS.DETAILS(id));
  },
};
