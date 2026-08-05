import { apiClient } from '@/api/apiClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { SaaSSettings } from '../models/Tenant';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type SaaSSettingsResponse = ApiResponse<SaaSSettings>;

export const settingsApi = {
  getSettings: async (): Promise<SaaSSettingsResponse> => {
    return apiClient.get(API_ENDPOINTS.SETTINGS.GET_SETTINGS);
  },

  saveSettings: async (
    settings: SaaSSettings
  ): Promise<SaaSSettingsResponse> => {
    return apiClient.post(API_ENDPOINTS.SETTINGS.SAVE_SETTINGS, settings);
  },
};