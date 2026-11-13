import { apiClient } from '../../../api/apiClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import {
  PendingPropertyApiResponse,
  PendingPropertiesPaginatedData,
  PendingPropertiesStats,
  PendingPropertyItem,
  PendingPropertiesFilterParams,
} from '../models/pendingProperty';

export const pendingPropertiesApi = {
  getProperties: async (
    params?: PendingPropertiesFilterParams
  ): Promise<PendingPropertyApiResponse<PendingPropertiesPaginatedData>> => {
    const queryParams: Record<string, any> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.pageSize) queryParams.pageSize = params.pageSize;
    if (params?.status && params.status !== 'ALL') queryParams.status = params.status;
    if (params?.category && params.category !== 'ALL') queryParams.category = params.category;
    if (params?.propertyType && params.propertyType !== 'ALL') queryParams.propertyType = params.propertyType;
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();

    return apiClient.get<PendingPropertyApiResponse<PendingPropertiesPaginatedData>>(
      API_ENDPOINTS.PENDING_PROPERTIES.BASE,
      queryParams
    );
  },

  getStats: async (): Promise<PendingPropertyApiResponse<PendingPropertiesStats>> => {
    return apiClient.get<PendingPropertyApiResponse<PendingPropertiesStats>>(
      API_ENDPOINTS.PENDING_PROPERTIES.STATS
    );
  },

  getById: async (
    id: number | string
  ): Promise<PendingPropertyApiResponse<PendingPropertyItem>> => {
    return apiClient.get<PendingPropertyApiResponse<PendingPropertyItem>>(
      API_ENDPOINTS.PENDING_PROPERTIES.BY_ID(id)
    );
  },

  moderateProperty: async (
    id: number | string,
    status: 'ACTIVE' | 'REJECTED',
    rejectReason?: string
  ): Promise<PendingPropertyApiResponse<{ propertyId: number; propertyStatus: string }>> => {
    return apiClient.post<PendingPropertyApiResponse<{ propertyId: number; propertyStatus: string }>>(
      API_ENDPOINTS.PENDING_PROPERTIES.MODERATE(id),
      {
        status,
        rejectReason: rejectReason || null,
      }
    );
  },
};

