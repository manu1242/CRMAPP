import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { ApiResponse } from '../models/QuoatationTypes';
import { IntegrationsData, SaveIntegrationConfigPayload } from '../models/IntegrationTypes';

/**
 * Backend: Controllers/Api/IntegrationsApiController.cs (mirrors web IntegrationsController).
 * Business failures come back as 200 { success:false, message } — callers check `success`.
 */
export const IntegrationService = {
  getIntegrations: (signal?: AbortSignal) =>
    apiClient.get<ApiResponse<IntegrationsData>>(API_ENDPOINTS.INTEGRATIONS.BASE, undefined, { signal }),

  getPlatformConfig: (platform: string) =>
    apiClient.get<ApiResponse<any>>(API_ENDPOINTS.INTEGRATIONS.BY_PLATFORM(platform)),

  saveConfig: (payload: SaveIntegrationConfigPayload) =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.INTEGRATIONS.SAVE, payload),

  toggleIntegration: (platform: string, enable: boolean) =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.INTEGRATIONS.TOGGLE(platform), { enable }),

  syncNow: (platform: string) =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.INTEGRATIONS.SYNC(platform), {}),

  testSync: (platform: string) =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.INTEGRATIONS.TEST_SYNC(platform), {}),

  syncAllActive: () =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.INTEGRATIONS.SYNC_ALL, {}),

  clearTestLeads: () =>
    apiClient.post<ApiResponse<any>>(API_ENDPOINTS.INTEGRATIONS.CLEAR_TEST_LEADS, {}),
};
