import { apiClient } from '../../../api/apiClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import {
  OwnerSubscriptionItem,
  OwnerSubscriptionsPaginatedData,
  AssignOwnerSubscriptionRequest,
  OwnerSubscriptionApiResponse,
  OwnerSubscriptionsFilterParams,
} from '../models/ownerSubscription';

export const ownerSubscriptionsApi = {
  getOwnerSubscriptions: async (
    params?: OwnerSubscriptionsFilterParams
  ): Promise<OwnerSubscriptionApiResponse<OwnerSubscriptionsPaginatedData>> => {
    const queryParams: Record<string, any> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.pageSize) queryParams.pageSize = params.pageSize;
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.status && params.status !== 'all') queryParams.status = params.status;

    return apiClient.get<OwnerSubscriptionApiResponse<OwnerSubscriptionsPaginatedData>>(
      API_ENDPOINTS.OWNER_SUBSCRIPTIONS.BASE,
      { params: queryParams }
    );
  },

  getOwnerSubscriptionById: async (
    id: number | string
  ): Promise<OwnerSubscriptionApiResponse<OwnerSubscriptionItem>> => {
    return apiClient.get<OwnerSubscriptionApiResponse<OwnerSubscriptionItem>>(
      API_ENDPOINTS.OWNER_SUBSCRIPTIONS.BY_ID(id)
    );
  },

  assignOwnerSubscription: async (
    data: AssignOwnerSubscriptionRequest
  ): Promise<OwnerSubscriptionApiResponse<OwnerSubscriptionItem>> => {
    return apiClient.post<OwnerSubscriptionApiResponse<OwnerSubscriptionItem>>(
      API_ENDPOINTS.OWNER_SUBSCRIPTIONS.ASSIGN,
      data
    );
  },

  toggleOwnerSubscriptionStatus: async (
    id: number | string
  ): Promise<
    OwnerSubscriptionApiResponse<{
      subscriptionId: number;
      ownerPhone: string;
      isActive: boolean;
    }>
  > => {
    return apiClient.patch<
      OwnerSubscriptionApiResponse<{
        subscriptionId: number;
        ownerPhone: string;
        isActive: boolean;
      }>
    >(API_ENDPOINTS.OWNER_SUBSCRIPTIONS.TOGGLE_STATUS(id));
  },

  deleteOwnerSubscription: async (
    id: number | string
  ): Promise<OwnerSubscriptionApiResponse<null>> => {
    return apiClient.delete<OwnerSubscriptionApiResponse<null>>(
      API_ENDPOINTS.OWNER_SUBSCRIPTIONS.BY_ID(id)
    );
  },
};
