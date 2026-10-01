import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { getApiUrl } from '../../api/remoteConfig';

export interface BrandingData {
  companyLogo?: string | null;
  collapsedLogo?: string | null;
  logoPath?: string | null;
  companyName?: string | null;
  primaryColor?: string | null;
}

export interface BrandingResponse {
  success: boolean;
  data: BrandingData;
  message?: string;
}

export const BrandingService = {
  getBranding: async (signal?: AbortSignal): Promise<BrandingData> => {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.SETTINGS.BRANDING, undefined, { signal });
      const data: BrandingData = res?.data ?? res ?? {};
      return {
        companyLogo: data.companyLogo || data.logoPath || null,
        collapsedLogo: data.collapsedLogo || null,
        logoPath: data.logoPath || null,
        companyName: data.companyName || 'RealEstate CRM',
        primaryColor: data.primaryColor || '#3b82f6',
      };
    } catch {
      return {
        companyLogo: null,
        collapsedLogo: null,
        logoPath: null,
        companyName: 'RealEstate CRM',
        primaryColor: '#3b82f6',
      };
    }
  },

  // Helper to format logo URI if it's relative
  resolveLogoUri: (rawUri?: string | null): string | null => {
    if (!rawUri) return null;
    if (rawUri.startsWith('data:') || rawUri.startsWith('http://') || rawUri.startsWith('https://')) {
      return rawUri;
    }
    const base = getApiUrl();
    return `${base}${rawUri.startsWith('/') ? '' : '/'}${rawUri}`;
  },
};
