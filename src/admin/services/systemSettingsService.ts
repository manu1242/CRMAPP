import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface SystemSettingsMap {
  CompanyName?: string;
  GSTNumber?: string;
  Address?: string;
  MapURL?: string;
  PhoneNumber?: string;
  EmailAddress?: string;
  CopyrightText?: string;
  CompanyLogo?: string;
  CollapsedLogo?: string;
  GSTRate?: string;
  DefaultBooking?: string;
  EMIStructure?: string;
  CurrencySymbol?: string;
  InvoicePrefix?: string;
  QuotationPrefix?: string;
  BookingPrefix?: string;
  [key: string]: any;
}

export interface GetSystemSettingsResponse {
  success: boolean;
  role?: string;
  channelPartnerId?: number | null;
  settings: SystemSettingsMap;
}

export interface SaveSystemSettingsPayload {
  settings: SystemSettingsMap;
}

export interface SaveSystemSettingsResponse {
  success: boolean;
  message: string;
  data?: {
    updatedCount: number;
  };
}

export interface UploadLogoPayload {
  imageBase64: string;
  logoType?: string; // "CompanyLogo" or "CollapsedLogo"
}

export interface UploadLogoResponse {
  success: boolean;
  message: string;
  data?: {
    logoKey: string;
    logoDataUrl: string;
  };
}

export const systemSettingsService = {
  /**
   * 1. Get System Settings
   */
  getSettings: async (): Promise<GetSystemSettingsResponse> => {
    return await apiClient.get<GetSystemSettingsResponse>(
      API_ENDPOINTS.SYSTEM_SETTINGS_API.GET
    );
  },

  /**
   * 2. Save / Update System Settings
   */
  saveSettings: async (
    payload: SaveSystemSettingsPayload
  ): Promise<SaveSystemSettingsResponse> => {
    return await apiClient.post<SaveSystemSettingsResponse>(
      API_ENDPOINTS.SYSTEM_SETTINGS_API.SAVE,
      payload
    );
  },

  /**
   * 3. Upload Company / Collapsed Sidebar Logo
   */
  uploadLogo: async (payload: UploadLogoPayload): Promise<UploadLogoResponse> => {
    return await apiClient.post<UploadLogoResponse>(
      API_ENDPOINTS.SYSTEM_SETTINGS_API.UPLOAD_LOGO,
      payload
    );
  },
};
