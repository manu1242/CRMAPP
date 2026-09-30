import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import {
  LeadQueryParams,
  ApiResponse,
  LeadListResponseData,
  LeadFullDetails,
  AddNotePayload,
  AddFollowUpPayload,
  AddLeadPayload,
  LeadItem,
} from '../models/LeadTypes';

export const LeadService = {
  addLead: async (payload: AddLeadPayload): Promise<ApiResponse<LeadItem>> => {
    return apiClient.post<ApiResponse<LeadItem>>(
      API_ENDPOINTS.LEADS.SAVE,
      payload
    );
  },

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
          `/api/v1/leads/${id}/full-details`,
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

  // ── Notes ───────────────────────────────────────────────────
  getNotes: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(API_ENDPOINTS.LEADS.GET_NOTES(id));
  },

  addNote: async (id: number | string, payload: AddNotePayload | string): Promise<ApiResponse<any>> => {
    const noteText = typeof payload === 'string' ? payload : payload.noteText;
    try {
      return await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.LEADS.ADD_NOTE(id),
        { noteText, leadId: id }
      );
    } catch {
      return apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.LEADS.SAVE_NOTE,
        { noteText, leadId: id }
      );
    }
  },

  updateNote: async (id: number | string, noteId: number | string, noteText: string): Promise<ApiResponse<any>> => {
    return apiClient.put<ApiResponse<any>>(
      API_ENDPOINTS.LEADS.UPDATE_NOTE(id, noteId),
      { noteText }
    );
  },

  deleteNote: async (id: number | string, noteId: number | string): Promise<ApiResponse<any>> => {
    return apiClient.delete<ApiResponse<any>>(API_ENDPOINTS.LEADS.DELETE_NOTE(id, noteId));
  },

  // ── Follow-ups ──────────────────────────────────────────────
  getFollowUps: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(API_ENDPOINTS.LEADS.GET_FOLLOW_UPS(id));
  },

  addFollowUp: async (id: number | string, payload: AddFollowUpPayload): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.LEADS.ADD_FOLLOW_UP(id),
        { ...payload, leadId: id }
      );
    } catch {
      return apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.LEADS.SAVE_FOLLOW_UP,
        { ...payload, leadId: id }
      );
    }
  },

  editFollowUp: async (id: number | string, followUpId: number | string, payload: any): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.put<ApiResponse<any>>(
        API_ENDPOINTS.LEADS.EDIT_FOLLOW_UP(id, followUpId),
        { ...payload, leadId: id, followUpId }
      );
    } catch {
      return apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.LEADS.SAVE_FOLLOW_UP,
        { ...payload, leadId: id, followUpId }
      );
    }
  },

  deleteFollowUp: async (id: number | string, followUpId: number | string): Promise<ApiResponse<any>> => {
    return apiClient.delete<ApiResponse<any>>(API_ENDPOINTS.LEADS.DELETE_FOLLOW_UP(id, followUpId));
  },

  // ── Documents ───────────────────────────────────────────────
  getDocuments: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(API_ENDPOINTS.LEADS.GET_DOCUMENTS(id));
  },

  uploadDocument: async (id: number | string, formData: FormData): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.postForm<ApiResponse<any>>(
        API_ENDPOINTS.LEADS.UPLOAD_DOC(id),
        formData
      );
    } catch {
      return apiClient.postForm<ApiResponse<any>>(
        '/Leads/SaveLeadUpload',
        formData
      );
    }
  },

  deleteDocument: async (id: number | string, uploadId: number | string): Promise<ApiResponse<any>> => {
    return apiClient.delete<ApiResponse<any>>(API_ENDPOINTS.LEADS.DELETE_DOC(id, uploadId));
  },

  // ── Site Visits ─────────────────────────────────────────────
  getSiteVisits: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(API_ENDPOINTS.LEADS.GET_SITE_VISITS(id));
  },

  scheduleSiteVisit: async (id: number | string, data: any): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.LEADS.SCHEDULE_SITE_VISIT(id), data);
  },

  updateInterestStatus: async (
    id: number | string,
    followUpId: number | string,
    interestStatus: 'Interested' | 'Not Interested' | 'Cold' | string
  ): Promise<ApiResponse<any>> => {
    return apiClient.put<ApiResponse<any>>(
      API_ENDPOINTS.LEADS.UPDATE_INTEREST_STATUS(id, followUpId),
      { interestStatus }
    );
  },

  // ── Activities ──────────────────────────────────────────────
  getActivities: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(API_ENDPOINTS.LEADS.GET_ACTIVITIES(id));
  },

  // ── General Lead Management ─────────────────────────────────
  updateLead: async (id: number | string, payload: AddLeadPayload): Promise<ApiResponse<any>> => {
    return apiClient.put<ApiResponse<any>>(
      API_ENDPOINTS.LEADS.BY_ID(id),
      payload
    );
  },

  getFormOptions: async (): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(
      API_ENDPOINTS.LEADS.ADD_OPTIONS('')
    );
  },

  updateStatus: async (id: number | string, status: string): Promise<ApiResponse<any>> => {
    return apiClient.patch<ApiResponse<any>>(
      `/api/v1/LeadsApi/${id}/status`,
      { status }
    );
  },
};
