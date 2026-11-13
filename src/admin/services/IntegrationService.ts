import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { ApiResponse } from '../models/QuoatationTypes';
import {
  IntegrationsData,
  IntegrationItem,
  SaveIntegrationConfigPayload,
} from '../models/IntegrationTypes';

export const IntegrationService = {
  /**
   * Fetch all integrations, summary metrics, and baseUrl.
   */
  async getIntegrations(): Promise<ApiResponse<IntegrationsData>> {
    try {
      const res = await apiClient.get<ApiResponse<IntegrationsData>>(
        API_ENDPOINTS.INTEGRATIONS.BASE
      );
      return res;
    } catch (error: any) {
      console.error('Failed to get integrations:', error);
      throw error;
    }
  },

  /**
   * Get specific platform configuration.
   */
  async getPlatformConfig(platform: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.get<ApiResponse<any>>(
        API_ENDPOINTS.INTEGRATIONS.BY_PLATFORM(platform)
      );
    } catch (error: any) {
      console.error(`Failed to get config for ${platform}:`, error);
      throw error;
    }
  },

  /**
   * Save or update integration configuration.
   */
  async saveConfig(payload: SaveIntegrationConfigPayload): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.INTEGRATIONS.SAVE,
        payload
      );
    } catch (error: any) {
      console.error('Failed to save integration config:', error);
      throw error;
    }
  },

  /**
   * Toggle enabled/disabled state for a platform.
   */
  async toggleIntegration(platform: string, enable: boolean): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.INTEGRATIONS.TOGGLE(platform),
        { enable }
      );
    } catch (error: any) {
      console.error(`Failed to toggle ${platform}:`, error);
      throw error;
    }
  },

  /**
   * Sync real leads from platform.
   */
  async syncNow(platform: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.INTEGRATIONS.SYNC(platform),
        {}
      );
    } catch (error: any) {
      console.error(`Failed to sync ${platform}:`, error);
      throw error;
    }
  },

  /**
   * Generate test leads for platform.
   */
  async testSync(platform: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.INTEGRATIONS.TEST_SYNC(platform),
        {}
      );
    } catch (error: any) {
      console.error(`Failed test sync for ${platform}:`, error);
      throw error;
    }
  },

  /**
   * Sync all active integrations at once.
   */
  async syncAllActive(): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.INTEGRATIONS.SYNC_ALL,
        {}
      );
    } catch (error: any) {
      console.error('Failed to sync all integrations:', error);
      throw error;
    }
  },

  /**
   * Clear all test leads and reset counters.
   */
  async clearTestLeads(): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.INTEGRATIONS.CLEAR_TEST_LEADS,
        {}
      );
    } catch (error: any) {
      console.error('Failed to clear test leads:', error);
      throw error;
    }
  },
};

