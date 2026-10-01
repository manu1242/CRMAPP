import { apiClient } from '../../../api/apiClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import {
  OwnerPlan,
  CreateOwnerPlanRequest,
  UpdateOwnerPlanRequest,
  ApiResponse,
} from '../models/ownerPlan';

export const ownerPlansApi = {
  getOwnerPlans: async (onlyActive?: boolean): Promise<ApiResponse<OwnerPlan[]>> => {
    return apiClient.get<ApiResponse<OwnerPlan[]>>(API_ENDPOINTS.OWNER_PLANS.BASE, {
      params: onlyActive ? { onlyActive: true } : undefined,
    });
  },

  getOwnerPlanById: async (id: number | string): Promise<ApiResponse<OwnerPlan>> => {
    return apiClient.get<ApiResponse<OwnerPlan>>(API_ENDPOINTS.OWNER_PLANS.BY_ID(id));
  },

  createOwnerPlan: async (data: CreateOwnerPlanRequest): Promise<ApiResponse<OwnerPlan>> => {
    return apiClient.post<ApiResponse<OwnerPlan>>(API_ENDPOINTS.OWNER_PLANS.BASE, data);
  },

  updateOwnerPlan: async (
    id: number | string,
    data: UpdateOwnerPlanRequest
  ): Promise<ApiResponse<OwnerPlan>> => {
    return apiClient.put<ApiResponse<OwnerPlan>>(API_ENDPOINTS.OWNER_PLANS.BY_ID(id), data);
  },

  toggleOwnerPlanStatus: async (
    id: number | string
  ): Promise<ApiResponse<{ planId: number; planName: string; isActive: boolean }>> => {
    return apiClient.patch<ApiResponse<{ planId: number; planName: string; isActive: boolean }>>(
      API_ENDPOINTS.OWNER_PLANS.TOGGLE_STATUS(id)
    );
  },

  deleteOwnerPlan: async (id: number | string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.OWNER_PLANS.BY_ID(id));
  },
};
