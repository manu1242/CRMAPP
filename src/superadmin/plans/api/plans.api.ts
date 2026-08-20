import { apiClient } from '../../../api/apiClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { Plan, PlanCreateRequest, PlanUpdateRequest } from '../models/Plan';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const plansApi = {
  getPlans: async (): Promise<ApiResponse<Plan[]>> => {
    return apiClient.get<ApiResponse<Plan[]>>(API_ENDPOINTS.PLANS.BASE);
  },

  getPlanById: async (id: number): Promise<ApiResponse<Plan>> => {
    return apiClient.get<ApiResponse<Plan>>(API_ENDPOINTS.PLANS.BY_ID(id));
  },

  createPlan: async (data: PlanCreateRequest): Promise<ApiResponse<Plan>> => {
    return apiClient.post<ApiResponse<Plan>>(API_ENDPOINTS.PLANS.BASE, data);
  },

  updatePlan: async (
    id: number,
    data: PlanUpdateRequest
  ): Promise<ApiResponse<Plan>> => {
    return apiClient.put<ApiResponse<Plan>>(API_ENDPOINTS.PLANS.BY_ID(id), data);
  },

  deletePlan: async (id: number): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.PLANS.BY_ID(id));
  },
};
