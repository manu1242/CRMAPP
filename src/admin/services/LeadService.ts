import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import {
  LeadQueryParams,
  ApiResponse,
  LeadListResponseData,
  LeadFullDetails,
  AddNotePayload,
  AddFollowUpPayload,
} from '../models/LeadTypes';

export const LeadService = {
  getLeads: async (params?: LeadQueryParams, signal?: AbortSignal): Promise<ApiResponse<LeadListResponseData>> => {
    return apiClient.get<ApiResponse<LeadListResponseData>>(
      API_ENDPOINTS.LEADS.BASE,
      params,
      { signal }
    );
  },

  getLeadDetails: async (id: number | string, signal?: AbortSignal): Promise<ApiResponse<LeadFullDetails>> => {
    try {
      return await apiClient.get<ApiResponse<LeadFullDetails>>(
        API_ENDPOINTS.LEADS.DETAILS(id),
        undefined,
        { signal }
      );
    } catch (err1: any) {
      if (err1.name === 'CanceledError' || err1.name === 'AbortError') throw err1;
      if (err1.response?.status !== 404) throw err1;

      try {
        return await apiClient.get<ApiResponse<LeadFullDetails>>(
          `/api/v1/LeadsApi/${id}/full-details`,
          undefined,
          { signal }
        );
      } catch (err2: any) {
        if (err2.name === 'CanceledError' || err2.name === 'AbortError') throw err2;
        if (err2.response?.status !== 404) throw err2;

        const singleRes = await apiClient.get<ApiResponse<any>>(
          API_ENDPOINTS.LEADS.BY_ID(id),
          undefined,
          { signal }
        );

        if (singleRes.success && singleRes.data) {
          const d = singleRes.data;
          return {
            success: true,
            message: singleRes.message || 'Lead details retrieved successfully',
            data: {
              contactInformation: {
                leadId: d.leadId || Number(id),
                fullName: d.fullName || d.name || '',
                email: d.email || '',
                phone: d.phone || d.contact || '',
                stage: d.stage || 'New',
                status: d.status || 'Active',
                source: d.source || 'Website',
                rating: d.rating,
                comments: d.comments,
                handoverStatus: d.handoverStatus,
                channelPartnerId: d.channelPartnerId,
                assignedToAgentId: d.assignedToAgentId || d.executiveId,
                assignedToAgentName: d.assignedToAgentName,
                followUpDate: d.followUpDate,
                createdDate: d.createdDate || d.createdOn,
              },
              propertyRequirements: {
                groupName: d.groupName,
                preferredLocation: d.preferredLocation,
                sqft: d.sqft,
                facing: d.facing,
                type: d.type,
                propertyType: d.propertyType,
                bhk: d.bhk,
                requirement: d.requirement,
              },
              activities: d.activities || [],
              followUps: d.followUps || [],
              notes: d.notes || [],
              documents: d.documents || [],
              siteVisits: d.siteVisits || [],
              transitions: d.transitions || [],
            },
          };
        }

        throw err2;
      }
    }
  },

  addNote: async (id: number | string, payload: AddNotePayload): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.LEADS.ADD_NOTE(id),
      payload
    );
  },

  addFollowUp: async (id: number | string, payload: AddFollowUpPayload): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.LEADS.ADD_FOLLOW_UP(id),
      payload
    );
  },

  uploadDocument: async (id: number | string, formData: FormData): Promise<ApiResponse<any>> => {
    return apiClient.postForm<ApiResponse<any>>(
      `/api/v1/LeadsApi/${id}/documents`,
      formData
    );
  },

  updateStatus: async (id: number | string, status: string): Promise<ApiResponse<any>> => {
    return apiClient.patch<ApiResponse<any>>(
      `/api/v1/LeadsApi/${id}/status`,
      { status }
    );
  },
};
