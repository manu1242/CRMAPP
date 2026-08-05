import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface PaymentGatewaySettings {
  id?: number;
  gatewayName?: string;
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  isActive: boolean;
  createdOn?: string;
  updatedOn?: string | null;
}

export interface GetGatewaySettingsResponse {
  success: boolean;
  message?: string;
  data: PaymentGatewaySettings;
}

export interface SaveGatewaySettingsPayload {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  isActive: boolean;
}

export interface SaveGatewaySettingsResponse {
  success: boolean;
  message: string;
  data?: PaymentGatewaySettings;
}

export const paymentGatewaySettingsService = {
  /**
   * Get Settings for a specific Gateway
   */
  getSettings: async (name: string = 'Razorpay'): Promise<GetGatewaySettingsResponse> => {
    return await apiClient.get<GetGatewaySettingsResponse>(
      API_ENDPOINTS.PAYMENT_GATEWAY_API.GET(name)
    );
  },

  /**
   * Save / Update Settings for a specific Gateway
   */
  saveSettings: async (
    name: string,
    payload: SaveGatewaySettingsPayload
  ): Promise<SaveGatewaySettingsResponse> => {
    return await apiClient.post<SaveGatewaySettingsResponse>(
      API_ENDPOINTS.PAYMENT_GATEWAY_API.SAVE(name),
      payload
    );
  },
};
