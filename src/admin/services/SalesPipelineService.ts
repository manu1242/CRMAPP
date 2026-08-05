import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { ApiResponse } from '../models/LeadTypes';
import { SalesPipelineStageGroup, UpdateLeadStagePayload } from '../models/SalesPipelineTypes';

export const SalesPipelineService = {
  getStages: async (): Promise<ApiResponse<string[]>> => {
    return apiClient.get<ApiResponse<string[]>>(API_ENDPOINTS.SALES_PIPELINE.STAGES);
  },

  getLeadsByStage: async (): Promise<ApiResponse<SalesPipelineStageGroup[]>> => {
    try {
      return await apiClient.get<ApiResponse<SalesPipelineStageGroup[]>>(
        API_ENDPOINTS.SALES_PIPELINE.LEADS_BY_STAGE
      );
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Fallback endpoint if /leads-by-stage returns 404
        return await apiClient.get<ApiResponse<SalesPipelineStageGroup[]>>('/api/v1/sales-pipeline');
      }
      throw err;
    }
  },

  updateLeadStage: async (payload: UpdateLeadStagePayload): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.SALES_PIPELINE.UPDATE_STAGE,
      payload
    );
  },
};
