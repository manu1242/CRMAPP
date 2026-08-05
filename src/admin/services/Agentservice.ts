import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Agent } from '../models/AgentTypes';

export interface OnboardResponse {
  success: boolean;
  message: string;
  data: {
    agentId: number;
  };
}

export interface GetAgentsResponse {
  success: boolean;
  message: string;
  data: {
    items: Agent[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface DropdownItemResponse {
  success: boolean;
  message: string;
  data: {
    agentTypes: string[];
    commissionRules: string[];
  };
}

export interface GetAgentDetailsResponse {
  success: boolean;
  message: string;
  data: Agent;
}

export const AgentsService = {
  // 1. Get Agents List
  async getAgents(
    params?: {
      search?: string;
      status?: string;
      type?: string;
      fromDate?: string;
      toDate?: string;
      page?: number;
      pageSize?: number;
    },
    signal?: AbortSignal
  ) {
    return apiClient.get<GetAgentsResponse>('/api/v1/AgentsApi', params, { signal });
  },

  // 2. Dropdown Lists
  async getDropdowns() {
    return apiClient.get<DropdownItemResponse>('/api/v1/AgentsApi/dropdowns');
  },

  // 3. Agent Onboarding (FormData for multipart/form-data)
  async onboardAgent(formData: FormData) {
    return apiClient.postForm<OnboardResponse>('/api/v1/AgentsApi/onboard', formData);
  },

  // 4. Edit Agent (FormData for multipart/form-data)
  async updateAgent(id: number | string, formData: FormData) {
    return apiClient.putForm<{ success: boolean; message: string; data: null }>(`/api/v1/AgentsApi/${id}`, formData);
  },

  // 5. Delete Agent
  async deleteAgent(id: number | string) {
    return apiClient.delete<{ success: boolean; message: string; data: null }>(`/api/v1/AgentsApi/${id}`);
  },

  // 6. Get Agent Details by ID
  async getAgentById(id: number | string) {
    return apiClient.get<GetAgentDetailsResponse>(`/api/v1/AgentsApi/${id}`);
  },

  // 7. Upload Document for Agent
  async uploadDocument(
    agentId: number | string,
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
      API_ENDPOINTS.AGENTS.UPLOAD_DOCUMENT(agentId),
      formData
    );
  },

  // 8. Delete Agent Document
  async deleteDocument(documentId: number | string) {
    return apiClient.delete<{ success: boolean; message: string; data: null }>(
      API_ENDPOINTS.AGENTS.DELETE_DOCUMENT(documentId)
    );
  },

  // 9. Download Single Agent Document (returns Blob)
  async downloadDocument(documentId: number | string): Promise<Blob> {
    return apiClient.download(API_ENDPOINTS.AGENTS.DOWNLOAD_DOCUMENT(documentId));
  },

  // 10. Download All Agent Documents (returns zipped Blob)
  async downloadAllDocuments(agentId: number | string): Promise<Blob> {
    return apiClient.download(API_ENDPOINTS.AGENTS.DOWNLOAD_ALL_DOCUMENTS(agentId));
  },
};