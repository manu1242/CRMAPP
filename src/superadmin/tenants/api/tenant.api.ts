import { apiClient } from '@/api/apiClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { 
  Tenant, 
  TenantCreateRequest, 
  TenantUpdateRequest, 
  PaginatedTenantsResponse 
} from '../models/Tenant';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const tenantApi = {
  getTenants: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<PaginatedTenantsResponse>> => {
    return apiClient.get<ApiResponse<PaginatedTenantsResponse>>(
      API_ENDPOINTS.TENANTS.BASE,
      params
    );
  },

  getTenantById: async (id: string | number): Promise<ApiResponse<Tenant>> => {
    return apiClient.get<ApiResponse<Tenant>>(
      API_ENDPOINTS.TENANTS.BY_ID(id)
    );
  },

  createTenant: async (data: TenantCreateRequest): Promise<ApiResponse<Tenant>> => {
    return apiClient.post<ApiResponse<Tenant>>(
      API_ENDPOINTS.TENANTS.BASE,
      data
    );
  },

  updateTenant: async (
    id: string | number,
    data: TenantUpdateRequest
  ): Promise<ApiResponse<Tenant>> => {
    return apiClient.put<ApiResponse<Tenant>>(
      API_ENDPOINTS.TENANTS.BY_ID(id),
      data
    );
  },

  deleteTenant: async (id: string | number): Promise<ApiResponse<{ deletedId: number }>> => {
    return apiClient.delete<ApiResponse<{ deletedId: number }>>(
      API_ENDPOINTS.TENANTS.BY_ID(id)
    );
  },

  activateTenant: async (
    id: string | number
  ): Promise<ApiResponse<{ tenantId: number; status: string }>> => {
    return apiClient.post<ApiResponse<{ tenantId: number; status: string }>>(
      API_ENDPOINTS.TENANTS.ACTIVATE(id)
    );
  },

  suspendTenant: async (
    id: string | number,
    reason: string
  ): Promise<ApiResponse<{ tenantId: number; status: string }>> => {
    return apiClient.post<ApiResponse<{ tenantId: number; status: string }>>(
      API_ENDPOINTS.TENANTS.SUSPEND(id),
      { reason }
    );
  },

  lockTenant: async (
    id: string | number
  ): Promise<ApiResponse<{ tenantId: number; isActive: boolean }>> => {
    return apiClient.post<ApiResponse<{ tenantId: number; isActive: boolean }>>(
      API_ENDPOINTS.TENANTS.LOCK(id)
    );
  },

  unlockTenant: async (
    id: string | number
  ): Promise<ApiResponse<{ tenantId: number; isActive: boolean }>> => {
    return apiClient.post<ApiResponse<{ tenantId: number; isActive: boolean }>>(
      API_ENDPOINTS.TENANTS.UNLOCK(id)
    );
  },
};
