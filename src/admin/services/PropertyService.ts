import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import {
  PropertyListResponse,
  BuildersResponse,
  ExecutivesResponse,
  PropertyDetails,
  GeneralApiResponse,
  FlatItem,
  PropertyImageItem,
} from '../models/PropertyTypes';

export const PropertyService = {
  getPropertiesList: async (): Promise<PropertyListResponse> => {
    const response = await apiClient.get<PropertyListResponse>(API_ENDPOINTS.PROPERTIES.GET_LIST);
    return response;
  },

  getBuilders: async (): Promise<BuildersResponse> => {
    return apiClient.get<BuildersResponse>(API_ENDPOINTS.PROPERTIES.GET_BUILDERS);
  },

  getExecutives: async (): Promise<ExecutivesResponse> => {
    return apiClient.get<ExecutivesResponse>(API_ENDPOINTS.PROPERTIES.GET_EXECUTIVES);
  },

  getPropertyById: async (id: number | string): Promise<{ success: boolean; message?: string } & Partial<PropertyDetails>> => {
    return apiClient.get<any>(API_ENDPOINTS.PROPERTIES.GET_BY_ID(id));
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
    return apiClient.get<any>(API_ENDPOINTS.PROPERTIES.GET_FLATS(propertyId, searchBhk));
  },

  saveFlat: async (formData: FormData): Promise<GeneralApiResponse> => {
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.SAVE_FLAT, formData);
  },

  deleteFlat: async (flatId: number | string): Promise<GeneralApiResponse> => {
    return apiClient.post<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_FLAT(flatId));
  },

  getImages: async (propertyId: number | string): Promise<{ success: boolean; uploads: PropertyImageItem[] }> => {
    return apiClient.get<any>(API_ENDPOINTS.PROPERTIES.GET_IMAGES(propertyId));
  },

  uploadImage: async (formData: FormData): Promise<GeneralApiResponse> => {
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.UPLOAD_IMAGE, formData);
  },

  deleteImage: async (uploadId: number | string): Promise<GeneralApiResponse> => {
    // Send uploadId in a FormData object as expected by standard POST endpoints in MVC
    const formData = new FormData();
    formData.append('uploadId', uploadId.toString());
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_IMAGE, formData);
  },

  getDocuments: async (propertyId: number | string): Promise<{ success: boolean; documents: any[] }> => {
    return apiClient.get<any>(API_ENDPOINTS.PROPERTIES.GET_DOCUMENTS(propertyId));
  },

  uploadDocument: async (formData: FormData): Promise<GeneralApiResponse> => {
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.UPLOAD_DOCUMENT, formData);
  },

  deleteDocument: async (documentId: number | string): Promise<GeneralApiResponse> => {
    const formData = new FormData();
    formData.append('documentId', documentId.toString());
    return apiClient.postForm<GeneralApiResponse>(API_ENDPOINTS.PROPERTIES.DELETE_DOCUMENT, formData);
  },
};
