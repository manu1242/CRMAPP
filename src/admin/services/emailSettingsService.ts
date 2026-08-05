import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface GetEmailSettingsResponse {
  success: boolean;
  isConfigured: boolean;
  email: string;
  password: string;
}

export interface SaveSmtpPayload {
  email: string;
  password: string;
}

export interface SaveSmtpResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    password: string;
  };
}

export interface TestEmailPayload {
  recipientEmail: string;
}

export interface TestEmailResponse {
  success: boolean;
  message: string;
  data?: {
    recipient?: string;
  };
}

export const emailSettingsService = {
  /**
   * 1. Get Email Configuration (returns email and password)
   */
  getSmtpSettings: async (): Promise<GetEmailSettingsResponse> => {
    return await apiClient.get<GetEmailSettingsResponse>(
      API_ENDPOINTS.EMAIL_SETTINGS_API.GET
    );
  },

  /**
   * 2. Save Email Configuration ({ email, password })
   */
  saveSmtpSettings: async (payload: SaveSmtpPayload): Promise<SaveSmtpResponse> => {
    return await apiClient.post<SaveSmtpResponse>(
      API_ENDPOINTS.EMAIL_SETTINGS_API.SAVE_SMTP,
      payload
    );
  },

  /**
   * 3. Send Test Email ({ recipientEmail })
   */
  sendTestEmail: async (payload: TestEmailPayload): Promise<TestEmailResponse> => {
    return await apiClient.post<TestEmailResponse>(
      API_ENDPOINTS.EMAIL_SETTINGS_API.TEST_EMAIL,
      payload
    );
  },
};
