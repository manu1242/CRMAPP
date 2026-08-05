import { apiClient } from '../../api/apiClient';
import { ChannelPartner, SubscriptionPlan } from '../models/ChannelPartnerTypes';

export interface GetPartnersResponse {
  success: boolean;
  message: string;
  data: {
    items: ChannelPartner[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface GetPartnerDetailsResponse {
  success: boolean;
  message: string;
  data: ChannelPartner;
}

export interface CreatePartnerResponse {
  success: boolean;
  message: string;
  data: {
    partnerId: number;
  };
}

export interface GetPlansResponse {
  success: boolean;
  message: string;
  data: SubscriptionPlan[];
}

export const ChannelPartnerService = {
  // 1. Get Channel Partner List
  async getPartners(
    params?: {
      search?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
      page?: number;
      pageSize?: number;
    },
    signal?: AbortSignal
  ) {
    return apiClient.get<GetPartnersResponse>('/api/v1/ChannelPartnersApi', params, { signal });
  },

  // 2. Get Channel Partner Details by ID
  async getPartnerById(id: number | string) {
    return apiClient.get<GetPartnerDetailsResponse>(`/api/v1/ChannelPartnersApi/${id}`);
  },

  // 3. Create Channel Partner (FormData for multipart/form-data)
  async createPartner(formData: FormData) {
    return apiClient.postForm<CreatePartnerResponse>('/api/v1/ChannelPartnersApi', formData);
  },

  // 4. Get Subscription Plans
  async getPlans() {
    return apiClient.get<GetPlansResponse>('/api/v1/ChannelPartnersApi/plans');
  },

  // 5. Update Channel Partner details (JSON data)
  async updatePartner(id: number | string, data: any) {
    return apiClient.put<{ success: boolean; message: string; data: ChannelPartner }>(`/api/v1/ChannelPartnersApi/${id}`, data);
  },

  // 6. Delete Channel Partner
  async deletePartner(id: number | string) {
    return apiClient.delete<{ success: boolean; message: string; data: null }>(`/api/v1/ChannelPartnersApi/${id}`);
  },

  // 7. Upload Document for Channel Partner
  async uploadDocument(
    partnerId: number | string,
    fileUri: string,
    fileName: string,
    fileType: string,
    docName: string,
    docType: string
  ) {
    const formData = new FormData();
    formData.append('documentName', docName);
    formData.append('documentType', docType);
    formData.append('documentFile', {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as any);

    return apiClient.postForm<{ success: boolean; message: string; data: any }>(
      `/api/v1/ChannelPartnersApi/${partnerId}/documents`,
      formData
    );
  },

  // 8. Delete Channel Partner Document
  async deleteDocument(documentId: number | string) {
    return apiClient.delete<{ success: boolean; message: string; data: null }>(
      `/api/v1/ChannelPartnersApi/documents/${documentId}`
    );
  },

  // 9. Download Single Channel Partner Document
  async downloadDocument(documentId: number | string): Promise<Blob> {
    return apiClient.download(`/api/v1/ChannelPartnersApi/documents/${documentId}`);
  },

  // 10. Download All Channel Partner Documents
  async downloadAllDocuments(partnerId: number | string): Promise<Blob> {
    return apiClient.download(`/api/v1/ChannelPartnersApi/${partnerId}/documents/download-all`);
  },
};
