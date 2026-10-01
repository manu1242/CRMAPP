import { apiClient } from '../../api/apiClient';
import { axiosInstance } from '../../api/axios';
import { API_ENDPOINTS } from '../../api/endpoints';
import { getApiUrl } from '../../api/remoteConfig';
import {
  PropertyListResponse,
  BuildersResponse,
  ExecutivesResponse,
  PropertyDetails,
  PropertyItem,
  GeneralApiResponse,
  FlatItem,
  PropertyImageItem,
} from '../models/PropertyTypes';

// Helper: fetch an image via authenticated axios and return base64 data URI
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await axiosInstance.get(url, { responseType: 'arraybuffer' });
    const bytes = new Uint8Array(response.data as ArrayBuffer);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    const base64 = btoa(binary);
    const contentType = response.headers['content-type'] || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

export const PropertyService = {
  getPropertiesList: async (): Promise<PropertyListResponse> => {
    const response = await apiClient.get<any>(API_ENDPOINTS.PROPERTIES.GET_LIST);
    // Handle both { success: true, properties: [...] } and { success: true, data: [...] } formats
    if (response) {
      if (Array.isArray(response.data)) {
        return {
          success: response.success ?? true,
          properties: response.data,
          message: response.message,
        };
      }
      if (Array.isArray(response.properties)) {
        return response;
      }
    }
    return { success: false, properties: [] };
  },

  getBuilders: async (): Promise<BuildersResponse> => {
    return apiClient.get<BuildersResponse>(API_ENDPOINTS.PROPERTIES.GET_BUILDERS);
  },

  getExecutives: async (): Promise<ExecutivesResponse> => {
    return apiClient.get<ExecutivesResponse>(API_ENDPOINTS.PROPERTIES.GET_EXECUTIVES);
  },

  getPropertyById: async (id: number | string): Promise<{ success: boolean; message?: string } & Partial<PropertyDetails>> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.PROPERTIES.GET_BY_ID(id));
    if (res && res.data && typeof res.data === 'object') {
      return {
        success: res.success ?? true,
        message: res.message,
        ...res.data,
      };
    }
    return res;
  },

  saveProperty: async (formData: FormData): Promise<GeneralApiResponse> => {
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.SAVE, formData);
  },

  deleteProperty: async (id: number | string): Promise<GeneralApiResponse> => {
    return apiClient.post<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE(id));
  },

  bulkUploadProperties: async (formData: FormData): Promise<GeneralApiResponse> => {
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.BULK_UPLOAD, formData);
  },

  getFlats: async (propertyId: number | string, searchBhk?: string): Promise<{ success: boolean; flats: FlatItem[] }> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.PROPERTIES.GET_FLATS(propertyId, searchBhk));
    if (res && Array.isArray(res.data)) {
      return { success: res.success ?? true, flats: res.data };
    }
    return res;
  },

  saveFlat: async (formData: FormData): Promise<GeneralApiResponse> => {
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.SAVE_FLAT, formData);
  },

  deleteFlat: async (flatId: number | string): Promise<GeneralApiResponse> => {
    return apiClient.post<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_FLAT(flatId));
  },

  getImages: async (propertyId: number | string): Promise<{ success: boolean; uploads: PropertyImageItem[] }> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.PROPERTIES.GET_IMAGES(propertyId));
    if (res && Array.isArray(res.data)) {
      return { success: res.success ?? true, uploads: res.data };
    }
    return res;
  },

  uploadImage: async (formData: FormData): Promise<GeneralApiResponse> => {
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.UPLOAD_IMAGE, formData);
  },

  deleteImage: async (uploadId: number | string): Promise<GeneralApiResponse> => {
    // Send uploadId in a FormData object as expected by standard POST endpoints in MVC
    const formData = new FormData();
    formData.append('uploadId', uploadId.toString());
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_IMAGE(uploadId), formData);
  },

  getDocuments: async (propertyId: number | string): Promise<{ success: boolean; documents: any[] }> => {
    const res = await apiClient.get<any>(API_ENDPOINTS.PROPERTIES.GET_DOCUMENTS(propertyId));
    if (res && Array.isArray(res.data)) {
      return { success: res.success ?? true, documents: res.data };
    }
    return res;
  },

  uploadDocument: async (formData: FormData): Promise<GeneralApiResponse> => {
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.UPLOAD_DOCUMENT, formData);
  },

  deleteDocument: async (documentId: number | string): Promise<GeneralApiResponse> => {
    const formData = new FormData();
    formData.append('documentId', documentId.toString());
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_DOCUMENT(documentId), formData);
  },

  // Helper to resolve property cover image URI directly
  getPropertyImageUri: (property: Partial<PropertyItem | PropertyDetails> | null | undefined): string | null => {
    if (!property) return null;
    const base = getApiUrl();
    const raw =
      property.imageUrl ||
      property.image ||
      (typeof property.propertyImage === 'string' ? property.propertyImage : null) ||
      property.thumbnailUrl ||
      property.directImageUrl ||
      property.imageEndpoint;

    if (raw) {
      if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) {
        return raw;
      }
      return `${base}${raw.startsWith('/') ? '' : '/'}${raw}`;
    }

    if (property.hasImage && property.propertyId) {
      return `${base}/api/v1/properties/${property.propertyId}/image`;
    }
    return null;
  },

  // Helper to resolve gallery upload photo URI directly
  getUploadImageUri: (img: Partial<PropertyImageItem> | null | undefined): string | null => {
    if (!img) return null;
    const base = getApiUrl();
    const raw = img.imageUrl || img.image || img.url;

    if (raw) {
      if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) {
        return raw;
      }
      return `${base}${raw.startsWith('/') ? '' : '/'}${raw}`;
    }

    if (img.uploadId) {
      return `${base}/api/v1/properties/images/${img.uploadId}/file`;
    }
    return null;
  },

  // Fetch property cover image as authenticated base64 data URI (fallback)
  getPropertyImageBase64: async (propertyId: number | string): Promise<string | null> => {
    const primary = await fetchImageAsBase64(`/api/v1/properties/${propertyId}/image`);
    if (primary) return primary;
    const fallback = await fetchImageAsBase64(`/api/v1/properties/GetPropertyImage?propertyId=${propertyId}`);
    if (fallback) return fallback;
    return fetchImageAsBase64(`/Properties/GetPropertyImage?propertyId=${propertyId}`);
  },

  // Fetch uploaded gallery image as authenticated base64 data URI (fallback)
  getUploadImageBase64: async (uploadId: number | string): Promise<string | null> => {
    const primary = await fetchImageAsBase64(`/api/v1/properties/images/${uploadId}/file`);
    if (primary) return primary;
    const fallback = await fetchImageAsBase64(`/api/v1/properties/GetImages?uploadId=${uploadId}`);
    if (fallback) return fallback;
    return fetchImageAsBase64(`/Properties/DownloadImage?uploadId=${uploadId}`);
  },
};
