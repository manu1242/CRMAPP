import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  subscriptionService,
  CreatePlanPayload,
  AssignSubscriptionPayload,
  ProcessRefundPayload,
} from '../services/subscriptionService';

// ─── Stale / GC times ────────────────────────────────────────────────────────
// Plans are very stable — cache aggressively.
// Partner subscriptions and transactions are financial — refresh often.
const PLANS_STALE_MS      = 10 * 60 * 1000;  // 10 minutes
const PLANS_GC_MS         = 30 * 60 * 1000;  // 30 minutes
const SUB_STALE_MS        = 3 * 60 * 1000;   //  3 minutes
const SUB_GC_MS           = 8 * 60 * 1000;   //  8 minutes
const TXN_STALE_MS        = 2 * 60 * 1000;   //  2 minutes
const TXN_GC_MS           = 5 * 60 * 1000;   //  5 minutes

// ─── Subscription Plans ───────────────────────────────────────────────────────

/**
 * Hook to list all subscription plans with optional search/filter.
 * Plans are structural data — cached for 10 minutes.
 */
export const useSubscriptionPlans = (params?: {
  search?: string;
  isActive?: boolean;
  planType?: string;
}) => {
  return useQuery({
    queryKey: ['subscriptionPlans', params],
    queryFn: () => subscriptionService.getPlans(params),
    staleTime: PLANS_STALE_MS,
    gcTime: PLANS_GC_MS,
  });
};

/**
 * Hook to get a single plan's details by ID.
 */
export const useSubscriptionPlanDetails = (id: number | string | undefined) => {
  return useQuery({
    queryKey: ['subscriptionPlan', id],
    queryFn: () => subscriptionService.getPlanDetails(id!),
    enabled: !!id,
    staleTime: PLANS_STALE_MS,
    gcTime: PLANS_GC_MS,
  });
};

export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlanPayload) => subscriptionService.createPlan(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] }),
  });
};

export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Partial<CreatePlanPayload> }) =>
      subscriptionService.updatePlan(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlan', id] });
    },
  });
};

export const useActivateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => subscriptionService.activatePlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] }),
  });
};

export const useDeactivateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => subscriptionService.deactivatePlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] }),
  });
};

export const useDeleteSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => subscriptionService.deletePlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] }),
  });
};

// ─── Partner Subscriptions ────────────────────────────────────────────────────

/**
 * Hook to list paginated partner subscriptions.
 * Defaults pageSize to 20 — never fetches unbounded rows.
 * keepPreviousData ensures smooth page transitions.
 */
export const usePartnerSubscriptions = (params?: {
  search?: string;
  status?: string;
  partnerId?: number;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ['partnerSubscriptions', params],
    queryFn: () =>
      subscriptionService.getPartnerSubscriptions({
        page: 1,
        pageSize: 20,
        ...params,           // caller overrides take precedence
      }),
    staleTime: SUB_STALE_MS,
    gcTime: SUB_GC_MS,
    placeholderData: keepPreviousData,
  });
};

export const useAssignPartnerSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignSubscriptionPayload) =>
      subscriptionService.assignPartnerSubscription(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partnerSubscriptions'] }),
  });
};

// ─── Razorpay Transactions ────────────────────────────────────────────────────

/**
 * Hook to list paginated Razorpay transactions.
 * Defaults pageSize to 20. Financial data — short 2 min stale time.
 */
export const useRazorpayTransactions = (params?: {
  status?: string;
  method?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ['razorpayTransactions', params],
    queryFn: () =>
      subscriptionService.getRazorpayTransactions({
        page: 1,
        pageSize: 20,
        ...params,
      }),
    staleTime: TXN_STALE_MS,
    gcTime: TXN_GC_MS,
    placeholderData: keepPreviousData,
  });
};

// ─── Pending Refunds ──────────────────────────────────────────────────────────

/**
 * Hook to list paginated pending refunds.
 * Defaults pageSize to 20.
 */
export const usePendingRefunds = (params?: { page?: number; pageSize?: number }) => {
  return useQuery({
    queryKey: ['pendingRefunds', params],
    queryFn: () =>
      subscriptionService.getPendingRefunds({
        page: 1,
        pageSize: 20,
        ...params,
      }),
    staleTime: TXN_STALE_MS,
    gcTime: TXN_GC_MS,
    placeholderData: keepPreviousData,
  });
};

export const useProcessRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProcessRefundPayload) => subscriptionService.processRefund(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRefunds'] });
      queryClient.invalidateQueries({ queryKey: ['razorpayTransactions'] });
    },
  });
};

// ─── My CRM Plan ──────────────────────────────────────────────────────────────

/**
 * Hook to get the current CRM subscription plan + usage stats.
 * Cached for 10 minutes — plan/usage data doesn't change frequently.
 */
export const useMyCrmPlan = () => {
  return useQuery({
    queryKey: ['myCrmPlan'],
    queryFn: () => subscriptionService.getMyCrmPlan(),
    staleTime: PLANS_STALE_MS,
    gcTime: PLANS_GC_MS,
  });
};

// ─── CRM Transactions ─────────────────────────────────────────────────────────

/**
 * Hook to list paginated CRM billing transactions.
 * Defaults pageSize to 20.
 */
export const useCrmTransactions = (params?: { page?: number; pageSize?: number }) => {
  return useQuery({
    queryKey: ['crmTransactions', params],
    queryFn: () =>
      subscriptionService.getCrmTransactions({
        page: 1,
        pageSize: 20,
        ...params,
      }),
    staleTime: TXN_STALE_MS,
    gcTime: TXN_GC_MS,
    placeholderData: keepPreviousData,
  });
};
