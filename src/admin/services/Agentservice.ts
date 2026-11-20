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
    stats?: { total: number; pending: number; approved: number; rejected: number };
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
  ): Promise<GetAgentsResponse> {
    const candidates = [
      '/api/v1/agents',
      '/api/v1/agentsapi',
      API_ENDPOINTS.AGENTS.LIST,
      '/Agent/GetAgents',
      '/Agent/List',
      '/Agent/GetAgent',
      '/Agent/GetAll',
    ];
    let lastError: any;
    for (const url of candidates) {
      try {
        const rawRes = await apiClient.get<any>(url, params, { signal });
        
        let items: any[] = [];
        let totalCount = 0;
        
        if (Array.isArray(rawRes)) {
          items = rawRes;
          totalCount = rawRes.length;
        } else if (Array.isArray(rawRes?.data)) {
          items = rawRes.data;
          totalCount = rawRes.totalCount || rawRes.data.length;
        } else if (Array.isArray(rawRes?.data?.items)) {
          items = rawRes.data.items;
          totalCount = rawRes.data.totalCount || items.length;
        } else if (Array.isArray(rawRes?.agents)) {
          items = rawRes.agents;
          totalCount = rawRes.totalCount || rawRes.count || items.length;
        } else if (Array.isArray(rawRes?.items)) {
          items = rawRes.items;
          totalCount = rawRes.totalCount || items.length;
        } else if (rawRes?.agent) {
          items = [rawRes.agent];
          totalCount = 1;
        } else if (rawRes?.data && typeof rawRes.data === 'object') {
          if (rawRes.data.fullName || rawRes.data.FullName || rawRes.data.agentId || rawRes.data.AgentId) {
            items = [rawRes.data];
            totalCount = 1;
          }
        }

        const normalizedItems: Agent[] = items.map((a: any) => ({
          agentId: a.agentId ?? a.AgentId ?? a.id ?? a.Id ?? 0,
          fullName: a.fullName ?? a.FullName ?? a.name ?? a.Name ?? '',
          email: a.email ?? a.Email ?? '',
          phone: a.phone ?? a.Phone ?? a.phoneNumber ?? a.PhoneNumber ?? '',
          address: a.address ?? a.Address ?? '',
          agentType: a.agentType ?? a.AgentType ?? 'Salary',
          salary: Number(a.salary ?? a.Salary ?? 0),
          commissionRules: a.commissionRules ?? a.CommissionRules ?? '',
          status: a.status ?? a.Status ?? a.verificationStatus ?? a.VerificationStatus ?? 'Approved',
          verificationStatus: a.verificationStatus ?? a.VerificationStatus ?? a.status ?? a.Status ?? 'Approved',
          createdOn: a.createdOn ?? a.CreatedOn ?? a.createdDate ?? a.CreatedDate ?? a.createdAt ?? new Date().toISOString(),
          createdDate: a.createdDate ?? a.CreatedDate ?? a.createdOn ?? a.CreatedOn ?? new Date().toISOString(),
          approvedBy: a.approvedBy ?? a.ApprovedBy ?? null,
          approvedOn: a.approvedOn ?? a.ApprovedOn ?? null,
          channelPartnerId: a.channelPartnerId ?? a.ChannelPartnerId ?? null,
          agentDocuments: (a.agentDocuments ?? a.AgentDocuments ?? a.documents ?? a.Documents ?? []).map((d: any) => ({
            documentId: d.documentId ?? d.DocumentId ?? d.id ?? d.Id ?? 0,
            documentName: d.documentName ?? d.DocumentName ?? d.name ?? d.Name ?? '',
            documentType: d.documentType ?? d.DocumentType ?? d.type ?? d.Type ?? '',
            fileSize: d.fileSize ?? d.FileSize ?? 0,
            verificationStatus: d.verificationStatus ?? d.VerificationStatus ?? 'Pending',
            rejectionReason: d.rejectionReason ?? d.RejectionReason ?? '',
          })),
        }));

        return {
          success: true,
          message: rawRes?.message || 'Success',
          data: {
            items: normalizedItems,
            totalCount: totalCount || normalizedItems.length,
            pageNumber: params?.page || 1,
            pageSize: params?.pageSize || 10,
            totalPages: Math.ceil((totalCount || normalizedItems.length) / (params?.pageSize || 10)) || 1,
            // Web Agent List banner stats (TOTAL / PENDING / APPROVED / REJECTED)
            stats: rawRes?.data?.stats ?? undefined,
          },
        };
      } catch (err: any) {
        lastError = err;
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
        if (err?.response?.status !== 404 && err?.response?.status !== 405) throw err;
      }
    }
    throw lastError;
  },

  // 2. Dropdown Lists
  async getDropdowns() {
    const candidates = [
      '/api/v1/agents/dropdowns',
      '/api/v1/agentsapi/dropdowns',
      '/Agent/Dropdowns',
    ];
    for (const url of candidates) {
      try {
        const res = await apiClient.get<any>(url);
        if (res?.data?.agentTypes || res?.agentTypes) {
          return {
            success: true,
            message: res?.message || 'Dropdowns fetched',
            data: {
              agentTypes: res.data?.agentTypes || res.agentTypes || ['Commission', 'Salary', 'Hybrid'],
              commissionRules: res.data?.commissionRules || res.commissionRules || ['None (0% of sale)', 'Standard (2%)', 'Premium (3%)', 'Custom'],
            },
          };
        }
      } catch {
        // try next
      }
    }
    return {
      success: true,
      message: 'Default dropdowns',
      data: {
        agentTypes: ['Salary', 'Hybrid', 'Commission'],
        commissionRules: ['None (0% of sale)', 'Standard (2%)', 'Premium (3%)', 'Custom'],
      },
    };
  },

  // 3. Agent Onboarding (supports FormData and JSON payload)
  async onboardAgent(payload: any, formData?: FormData) {
    let fd = formData;
    if (!fd && payload) {
      if (payload instanceof FormData) {
        fd = payload;
      } else {
        fd = new FormData();
        if (payload.fullName || payload.FullName) fd.append('FullName', (payload.fullName || payload.FullName).trim());
        if (payload.email || payload.Email) fd.append('Email', (payload.email || payload.Email).trim());
        if (payload.phone || payload.Phone) fd.append('Phone', (payload.phone || payload.Phone).trim());
        if (payload.address || payload.Address) fd.append('Address', (payload.address || payload.Address).trim());
        if (payload.agentType || payload.AgentType) fd.append('AgentType', payload.agentType || payload.AgentType);
        if (payload.salary !== undefined) fd.append('Salary', String(payload.salary));
        if (payload.commissionRules || payload.CommissionRules) fd.append('CommissionRules', payload.commissionRules || payload.CommissionRules);
      }
    }

    const apiEndpoints = [
      '/api/v1/agents/onboard',
      '/api/v1/agentsapi/onboard',
    ];

    let lastError: any;
    if (fd) {
      for (const url of apiEndpoints) {
        try {
          return await apiClient.postForm<OnboardResponse>(url, fd);
        } catch (err: any) {
          lastError = err;
          if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
          if (err?.response?.status !== 404 && err?.response?.status !== 405 && err?.response?.status !== 415) throw err;
        }
      }
    }

    if (payload && !(payload instanceof FormData)) {
      for (const url of apiEndpoints) {
        try {
          return await apiClient.post<OnboardResponse>(url, payload);
        } catch (err: any) {
          lastError = err;
          if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
          if (err?.response?.status !== 404 && err?.response?.status !== 405 && err?.response?.status !== 415) throw err;
        }
      }
    }

    // Fallback to legacy MVC endpoints
    const mvcCandidates = [
      '/Agent/Onboard',
      '/Agent/SaveAgent',
      '/Agent/Create',
    ];
    if (fd) {
      for (const url of mvcCandidates) {
        try {
          return await apiClient.postForm<OnboardResponse>(url, fd);
        } catch (err: any) {
          lastError = err;
          if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
          if (err?.response?.status !== 404) throw err;
        }
      }
    }

    throw lastError;
  },

  // 4. Edit Agent (calls HTTP PUT to /api/v1/agents/{id})
  async updateAgent(id: number | string, payload: any, formData?: FormData) {
    let fd = formData;
    if (!fd && payload) {
      if (payload instanceof FormData) {
        fd = payload;
      } else {
        fd = new FormData();
        if (payload.fullName || payload.FullName) fd.append('FullName', (payload.fullName || payload.FullName).trim());
        if (payload.email || payload.Email) fd.append('Email', (payload.email || payload.Email).trim());
        if (payload.phone || payload.Phone) fd.append('Phone', (payload.phone || payload.Phone).trim());
        if (payload.address || payload.Address) fd.append('Address', (payload.address || payload.Address).trim());
        if (payload.agentType || payload.AgentType) fd.append('AgentType', payload.agentType || payload.AgentType);
        if (payload.salary !== undefined) fd.append('Salary', String(payload.salary));
        if (payload.commissionRules || payload.CommissionRules) fd.append('CommissionRules', payload.commissionRules || payload.CommissionRules);
      }
    }

    const putUrls = [
      `/api/v1/agents/${id}`,
      `/api/v1/agentsapi/${id}`,
    ];

    let lastError: any;
    // 1. Try PUT multipart/form-data first (matches [HttpPut("{id}")] [FromForm] in AgentsApiController)
    if (fd) {
      for (const url of putUrls) {
        try {
          return await apiClient.putForm<{ success: boolean; message: string; data: any }>(url, fd);
        } catch (err: any) {
          lastError = err;
          if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
          if (err?.response?.status !== 404 && err?.response?.status !== 405 && err?.response?.status !== 415) throw err;
        }
      }
    }

    // 2. Try PUT JSON
    if (payload && !(payload instanceof FormData)) {
      for (const url of putUrls) {
        try {
          return await apiClient.put<{ success: boolean; message: string; data: any }>(url, payload);
        } catch (err: any) {
          lastError = err;
          if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
          if (err?.response?.status !== 404 && err?.response?.status !== 405 && err?.response?.status !== 415) throw err;
        }
      }
    }

    // 3. Fallback to legacy MVC POST
    const mvcCandidates = [
      `/Agent/UpdateAgent?id=${id}`,
      `/Agent/Update?id=${id}`,
      `/Agent/Update`,
      `/Agent/UpdateAgent`,
    ];
    if (fd) {
      for (const url of mvcCandidates) {
        try {
          return await apiClient.postForm<any>(url, fd);
        } catch (err: any) {
          lastError = err;
          if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
          if (err?.response?.status !== 404) throw err;
        }
      }
    }

    throw lastError;
  },

  // 5. Delete Agent (calls HTTP DELETE to /api/v1/agents/{id})
  async deleteAgent(id: number | string) {
    const restCandidates = [
      `/api/v1/agents/${id}`,
      `/api/v1/agentsapi/${id}`,
      API_ENDPOINTS.AGENTS.BY_ID(id),
    ];
    let lastError: any;
    for (const url of restCandidates) {
      try {
        return await apiClient.delete<{ success: boolean; message: string; data: null }>(url);
      } catch (err: any) {
        lastError = err;
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
        if (err?.response?.status !== 404 && err?.response?.status !== 405) throw err;
      }
    }

    // Fallback to legacy MVC GET /Agent/Delete?agentId=...
    try {
      return await apiClient.get<any>(`/Agent/Delete?agentId=${id}`);
    } catch {
      throw lastError;
    }
  },

  // 6. Get Agent Details by ID
  async getAgentById(id: number | string): Promise<GetAgentDetailsResponse> {
    const candidates = [
      `/api/v1/agents/${id}`,
      `/api/v1/agentsapi/${id}`,
      API_ENDPOINTS.AGENTS.GET_AGENT(id),
      `/Agent/GetAgentDetails?id=${id}`,
      `/Agent/Details/${id}`,
      `/Agent/GetAgent?agentId=${id}`,
      `/Agent/GetAgent?id=${id}`,
      `/Agent/Get?id=${id}`,
    ];
    let lastError: any;
    for (const url of candidates) {
      try {
        const rawRes = await apiClient.get<any>(url);
        const rawAgent = rawRes?.data || rawRes?.agent || rawRes?.Agent || rawRes;
        
        const normalized: Agent = {
          agentId: rawAgent.agentId ?? rawAgent.AgentId ?? rawAgent.id ?? rawAgent.Id ?? Number(id),
          fullName: rawAgent.fullName ?? rawAgent.FullName ?? rawAgent.name ?? rawAgent.Name ?? '',
          email: rawAgent.email ?? rawAgent.Email ?? '',
          phone: rawAgent.phone ?? rawAgent.Phone ?? rawAgent.phoneNumber ?? rawAgent.PhoneNumber ?? '',
          address: rawAgent.address ?? rawAgent.Address ?? '',
          agentType: rawAgent.agentType ?? rawAgent.AgentType ?? 'Salary',
          salary: Number(rawAgent.salary ?? rawAgent.Salary ?? 0),
          commissionRules: rawAgent.commissionRules ?? rawAgent.CommissionRules ?? '',
          status: rawAgent.status ?? rawAgent.Status ?? rawAgent.verificationStatus ?? rawAgent.VerificationStatus ?? 'Approved',
          verificationStatus: rawAgent.verificationStatus ?? rawAgent.VerificationStatus ?? rawAgent.status ?? rawAgent.Status ?? 'Approved',
          createdOn: rawAgent.createdOn ?? rawAgent.CreatedOn ?? rawAgent.createdDate ?? rawAgent.CreatedDate ?? rawAgent.createdAt ?? new Date().toISOString(),
          createdDate: rawAgent.createdDate ?? rawAgent.CreatedDate ?? rawAgent.createdOn ?? rawAgent.CreatedOn ?? new Date().toISOString(),
          approvedBy: rawAgent.approvedBy ?? rawAgent.ApprovedBy ?? null,
          approvedOn: rawAgent.approvedOn ?? rawAgent.ApprovedOn ?? null,
          channelPartnerId: rawAgent.channelPartnerId ?? rawAgent.ChannelPartnerId ?? null,
          agentDocuments: (rawAgent.agentDocuments ?? rawAgent.AgentDocuments ?? rawAgent.documents ?? rawAgent.Documents ?? []).map((d: any) => ({
            documentId: d.documentId ?? d.DocumentId ?? d.id ?? d.Id ?? 0,
            documentName: d.documentName ?? d.DocumentName ?? d.name ?? d.Name ?? '',
            documentType: d.documentType ?? d.DocumentType ?? d.type ?? d.Type ?? '',
            fileSize: d.fileSize ?? d.FileSize ?? 0,
            verificationStatus: d.verificationStatus ?? d.VerificationStatus ?? 'Pending',
            rejectionReason: d.rejectionReason ?? d.RejectionReason ?? '',
          })),
        };

        return {
          success: true,
          message: rawRes?.message || 'Success',
          data: normalized,
        };
      } catch (err: any) {
        lastError = err;
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
        if (err?.response?.status !== 404 && err?.response?.status !== 405) throw err;
      }
    }
    throw lastError;
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

    const candidates = [
      `/api/v1/agents/${agentId}/documents`,
      `/api/v1/agentsapi/${agentId}/documents`,
      API_ENDPOINTS.AGENTS.UPLOAD_DOCUMENT(agentId),
      '/Agent/UploadDocument',
    ];
    let lastError: any;
    for (const url of candidates) {
      try {
        return await apiClient.postForm<{ success: boolean; message: string; data: any }>(
          url,
          formData
        );
      } catch (err: any) {
        lastError = err;
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
        if (err?.response?.status !== 404 && err?.response?.status !== 405) throw err;
      }
    }
    throw lastError;
  },

  // 8. Delete Agent Document
  async deleteDocument(documentId: number | string) {
    const candidates = [
      `/api/v1/agents/documents/${documentId}`,
      `/api/v1/agentsapi/documents/${documentId}`,
      API_ENDPOINTS.AGENTS.DELETE_DOCUMENT(documentId),
      `/Agent/DeleteDocument?id=${documentId}`,
      `/Agent/DeleteDocument?documentId=${documentId}`,
    ];
    let lastError: any;
    for (const url of candidates) {
      try {
        return await apiClient.delete<{ success: boolean; message: string; data: null }>(url);
      } catch (err: any) {
        lastError = err;
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') throw err;
        if (err?.response?.status !== 404 && err?.response?.status !== 405) throw err;
      }
    }
    throw lastError;
  },

  // 9. Download Single Agent Document (returns Blob)
  async downloadDocument(documentId: number | string): Promise<Blob> {
    return apiClient.download(API_ENDPOINTS.AGENTS.DOWNLOAD_DOCUMENT(documentId));
  },

  // 10. Download All Agent Documents (returns zipped Blob)
  async downloadAllDocuments(agentId: number | string): Promise<Blob> {
    return apiClient.download(API_ENDPOINTS.AGENTS.DOWNLOAD_ALL_DOCUMENTS(agentId));
  },

  // 11. Approve Agent
  async approveAgent(agentId: number | string) {
    return apiClient.post<{ success: boolean; message: string; data: any }>(
      API_ENDPOINTS.AGENTS.APPROVE(agentId)
    );
  },

  // 12. Reject Agent
  async rejectAgent(agentId: number | string, reason?: string) {
    return apiClient.post<{ success: boolean; message: string; data: any }>(
      API_ENDPOINTS.AGENTS.REJECT(agentId),
      reason ? { reason } : undefined
    );
  },

  // Web parity: AgentController.CheckCanOnboard (subscription / plan limits)
  async checkCanOnboard() {
    return apiClient.get<{ success: boolean; message: string; data: { allowed: boolean; showUpgrade: boolean } }>(
      API_ENDPOINTS.AGENTS.CAN_ONBOARD
    );
  },

  // Web parity: AgentController.ApproveDocument / RejectDocument
  async approveDocument(documentId: number | string) {
    return apiClient.post<{ success: boolean; message: string; data: any }>(API_ENDPOINTS.AGENTS.APPROVE_DOCUMENT(documentId));
  },

  async rejectDocument(documentId: number | string, reason: string) {
    return apiClient.post<{ success: boolean; message: string; data: any }>(API_ENDPOINTS.AGENTS.REJECT_DOCUMENT(documentId), { reason });
  },

  // 13. Check Email Exists
  // async checkEmailExists(email: string) {
  //   return apiClient.get<{ exists: boolean; message?: string }>(
  //     API_ENDPOINTS.AGENTS.CHECK_EMAIL(email)
  //   );
  // },

  // 14. Public / Portal Agents API (p_AgentsController)
  async getPortalAgents(params?: {
    city?: string;
    verifiedOnly?: boolean;
    featuredOnly?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    return apiClient.get<any>(API_ENDPOINTS.AGENTS.PORTAL_LIST, params);
  },

  // 15. Public / Portal Agent Details
  async getPortalAgentById(id: number | string) {
    return apiClient.get<any>(API_ENDPOINTS.AGENTS.PORTAL_BY_ID(id));
  },

  // 16. Public / Portal Featured Agents
  async getPortalFeaturedAgents(count: number = 4) {
    return apiClient.get<any>(API_ENDPOINTS.AGENTS.PORTAL_FEATURED(count));
  },
};