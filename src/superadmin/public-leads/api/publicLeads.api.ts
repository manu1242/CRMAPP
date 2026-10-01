import { apiClient } from '../../../api/apiClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import {
  PublicLeadItem,
  PublicLeadStats,
  PublicLeadsPaginatedData,
  PublicLeadsFilterParams,
  PublicLeadApiResponse,
} from '../models/publicLead';

export const publicLeadsApi = {
  getPublicLeads: async (
    params?: PublicLeadsFilterParams
  ): Promise<PublicLeadApiResponse<PublicLeadsPaginatedData>> => {
    const queryParams: Record<string, any> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.pageSize) queryParams.pageSize = params.pageSize;
    if (params?.type && params.type !== 'All') queryParams.type = params.type;
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    return apiClient.get<PublicLeadApiResponse<PublicLeadsPaginatedData>>(
      API_ENDPOINTS.PUBLIC_LEADS.BASE,
      { params: queryParams }
    );
  },

  getPublicLeadStats: async (): Promise<PublicLeadApiResponse<PublicLeadStats>> => {
    return apiClient.get<PublicLeadApiResponse<PublicLeadStats>>(
      API_ENDPOINTS.PUBLIC_LEADS.STATS
    );
  },

  getPublicLeadById: async (
    id: number | string
  ): Promise<PublicLeadApiResponse<PublicLeadItem>> => {
    return apiClient.get<PublicLeadApiResponse<PublicLeadItem>>(
      API_ENDPOINTS.PUBLIC_LEADS.BY_ID(id)
    );
  },

  deletePublicLead: async (
    id: number | string
  ): Promise<PublicLeadApiResponse<{ leadId: number }>> => {
    return apiClient.delete<PublicLeadApiResponse<{ leadId: number }>>(
      API_ENDPOINTS.PUBLIC_LEADS.BY_ID(id)
    );
  },

  bulkDeletePublicLeads: async (
    leadIds: number[]
  ): Promise<PublicLeadApiResponse<{ deletedCount: number }>> => {
    return apiClient.post<PublicLeadApiResponse<{ deletedCount: number }>>(
      API_ENDPOINTS.PUBLIC_LEADS.BULK_DELETE,
      { leadIds }
    );
  },
};
