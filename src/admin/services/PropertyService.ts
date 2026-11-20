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
    // The API pages results (default pageSize 50) while the Web list shows every active
    // property, so read all pages. Extra requests happen only when there are more than 50.
    const PAGE_SIZE = 50;
    const MAX_PAGES = 100; // safety stop
    const extractList = (res: any): any[] | null =>
      Array.isArray(res?.data) ? res.data : Array.isArray(res?.properties) ? res.properties : null;

    try {
      const response = await apiClient.get<any>(
        API_ENDPOINTS.PROPERTIES.GET_LIST,
        { page: 1, pageSize: PAGE_SIZE },
        { timeout: 30000 }
      );
      // Handle both { success: true, properties: [...] } and { success: true, data: [...] } formats
      const firstPage = extractList(response);
      if (!firstPage) return { success: false, properties: [] };

      const all = [...firstPage];
      const totalCount = Number(response?.totalCount);
      if (Number.isFinite(totalCount) && totalCount > all.length) {
        for (let page = 2; all.length < totalCount && page <= MAX_PAGES; page++) {
          const next = await apiClient.get<any>(
            API_ENDPOINTS.PROPERTIES.GET_LIST,
            { page, pageSize: PAGE_SIZE },
            { timeout: 30000 }
          );
          const items = extractList(next);
          if (!items || items.length === 0) break;
          all.push(...items);
        }
      }

      // A property created while paging shifts the newest-first order and can repeat a row.
      const seen = new Set<unknown>();
      const unique = all.filter((p) => {
        const id = p?.propertyId ?? p?.PropertyId;
        if (id == null) return true;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      return {
        success: response.success ?? true,
        properties: unique,
        message: response.message,
      };
    } catch (err: any) {
      console.warn('[PropertyService] Primary /api/v1/properties failed, trying fallback...', err?.message);
      try {
        const fallback = await apiClient.get<any>('/api/v1/properties/GetAllProperties', undefined, { timeout: 30000 });
        if (fallback) {
          const list = fallback.properties || fallback.data;
          if (Array.isArray(list)) {
            return {
              success: true,
              properties: list,
              message: fallback.message,
            };
          }
        }
      } catch (fallbackErr: any) {
        console.warn('[PropertyService] Fallback /api/v1/properties/GetAllProperties also failed:', fallbackErr?.message);
      }
      throw err;
    }
  },

  getBuilders: async (): Promise<BuildersResponse> => {
    return apiClient.get<BuildersResponse>(API_ENDPOINTS.PROPERTIES.GET_BUILDERS, undefined, { timeout: 25000 });
  },

  getExecutives: async (): Promise<ExecutivesResponse> => {
    return apiClient.get<ExecutivesResponse>(API_ENDPOINTS.PROPERTIES.GET_EXECUTIVES, undefined, { timeout: 25000 });
  },

  getPropertyById: async (id: number | string): Promise<{ success: boolean; message?: string } & Partial<PropertyDetails>> => {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.PROPERTIES.GET_BY_ID(id), undefined, { timeout: 30000 });
      if (res && res.data && typeof res.data === 'object') {
        return {
          success: res.success ?? true,
          message: res.message,
          ...res.data,
        };
      }
      return res;
    } catch (err: any) {
      console.warn(`[PropertyService] Failed to fetch property #${id}, attempting query fallback...`, err?.message);
      try {
        const fallback = await apiClient.get<any>(`/api/v1/properties/GetProperty?id=${id}`, undefined, { timeout: 30000 });
        if (fallback && fallback.data && typeof fallback.data === 'object') {
          return {
            success: fallback.success ?? true,
            message: fallback.message,
            ...fallback.data,
          };
        }
      } catch {}
      throw err;
    }
  },

  saveProperty: async (formData: FormData): Promise<GeneralApiResponse> => {
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.SAVE, formData);
  },

  deleteProperty: async (id: number | string): Promise<GeneralApiResponse> => {
    try {
      return await apiClient.delete<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE(id));
    } catch (err: any) {
      if (err?.response?.status === 405) {
        return await apiClient.post<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE(id));
      }
      throw err;
    }
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

  saveFlat: async (data: FormData | any): Promise<GeneralApiResponse> => {
    if (data instanceof FormData) {
      return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.SAVE_FLAT, data);
    }
    return apiClient.post<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.SAVE_FLAT, data);
  },

  deleteFlat: async (flatId: number | string): Promise<GeneralApiResponse> => {
    try {
      return await apiClient.delete<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_FLAT(flatId));
    } catch (err: any) {
      if (err?.response?.status === 405) {
        return await apiClient.post<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_FLAT(flatId));
      }
      throw err;
    }
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
    try {
      return await apiClient.delete<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_IMAGE(uploadId));
    } catch (err: any) {
      if (err?.response?.status === 405) {
        const formData = new FormData();
        formData.append('uploadId', uploadId.toString());
        return await apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_IMAGE(uploadId), formData);
      }
      throw err;
    }
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
    try {
      return await apiClient.delete<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_DOCUMENT(documentId));
    } catch (err: any) {
      if (err?.response?.status === 405) {
        const formData = new FormData();
        formData.append('documentId', documentId.toString());
        return await apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_DOCUMENT(documentId), formData);
      }
      throw err;
    }
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
