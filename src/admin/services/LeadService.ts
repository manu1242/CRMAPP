import AsyncStorage from '@react-native-async-storage/async-storage';
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
    const formattedPayload: AddLeadPayload = {
      ...payload,
      assignedToAgentId: payload.assignedToAgentId ?? payload.executiveId,
      executiveId: payload.executiveId ?? payload.assignedToAgentId,
    };
    return apiClient.post<ApiResponse<LeadItem>>(
      API_ENDPOINTS.LEADS.SAVE,
      formattedPayload
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
                modifiedOn: d.modifiedOn,
                locationDistance: d.locationDistance,
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
                locationDistance: d.locationDistance,
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
        `/Leads/SaveLeadUpload?leadId=${id}`,
        formData
      );
    }
  },

  deleteDocument: async (id: number | string, uploadId: number | string): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.delete<ApiResponse<any>>(API_ENDPOINTS.LEADS.DELETE_DOC(id, uploadId));
    } catch (err: any) {
      if (err?.response?.status === 405 || err?.response?.status === 404 || err?.status === 405) {
        try {
          return await apiClient.post<ApiResponse<any>>(`/Leads/DeleteUpload?uploadId=${uploadId}`);
        } catch {
          const fd = new FormData();
          fd.append('uploadId', String(uploadId));
          return await apiClient.post<ApiResponse<any>>('/Leads/DeleteUpload', fd);
        }
      }
      throw err;
    }
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
    try {
      return await apiClient.put<ApiResponse<any>>(
        API_ENDPOINTS.LEADS.UPDATE_INTEREST_STATUS(id, followUpId),
        { interestStatus }
      );
    } catch (err: any) {
      if (err?.response?.status === 405 || err?.response?.status === 404 || err?.status === 405) {
        try {
          return await apiClient.post<ApiResponse<any>>(`/Leads/UpdateInterestStatus`, null, {
            params: { followUpId, interestStatus },
          });
        } catch {
          const fd = new FormData();
          fd.append('followUpId', String(followUpId));
          fd.append('interestStatus', interestStatus);
          return await apiClient.post<ApiResponse<any>>('/Leads/UpdateInterestStatus', fd);
        }
      }
      throw err;
    }
  },

  // ── Activities ──────────────────────────────────────────────
  getActivities: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(API_ENDPOINTS.LEADS.GET_ACTIVITIES(id));
  },

  // ── Lead Stages ─────────────────────────────────────────────
  getStages: async (): Promise<ApiResponse<string[]>> => {
    let stagesList: string[] = [];

    // 1. Primary: GET /api/v1/sales-pipeline/stages
    try {
      const res: any = await apiClient.get<any>(API_ENDPOINTS.SALES_PIPELINE.STAGES);
      const list = res?.data?.data || res?.data || res?.stages;
      if (Array.isArray(list) && list.length > 0) {
        stagesList = list.map((s: any) => (typeof s === 'string' ? s : s?.name || s?.stage || s?.label)).filter(Boolean);
      }
    } catch {
      // 2. Fallback: GET /api/v1/leads/form-options
      try {
        const optRes: any = await apiClient.get<any>(API_ENDPOINTS.LEADS.FORM_OPTIONS);
        const stagesOpt = optRes?.data?.stages;
        if (Array.isArray(stagesOpt) && stagesOpt.length > 0) {
          stagesList = stagesOpt.map((s: any) => s.value || s.label).filter(Boolean);
        }
      } catch {
        // 3. Fallback: legacy GET /leads/stages
        try {
          const legacyRes: any = await apiClient.get<any>('/leads/stages');
          const list = legacyRes?.data?.stages || legacyRes?.stages;
          if (Array.isArray(list) && list.length > 0) {
            stagesList = list;
          }
        } catch {}
      }
    }

    // 4. Retrieve saved custom stages from local storage
    try {
      const stored = await AsyncStorage.getItem('@crm_custom_stages');
      if (stored) {
        const custom = JSON.parse(stored);
        if (Array.isArray(custom)) {
          stagesList = [...stagesList, ...custom];
        }
      }
    } catch {}

    const defaultList = [
      'New',
      'Enquiry',
      'Contacted',
      'Site Visit Requested',
      'Site Visit Done',
      'Office Meeting',
      'Quotation',
      'Quotation Sent',
      'Negotiation',
      'Booked',
      'Converted',
      'Support',
    ];

    const merged = Array.from(new Set([...defaultList, ...stagesList])).filter(Boolean);
    return {
      success: true,
      message: 'Stages retrieved',
      data: merged,
    };
  },

  updateLeadStage: async (leadId: number | string, stage: string): Promise<ApiResponse<any>> => {
    const numId = Number(leadId);
    // 1. Primary: PUT /api/v1/leads/{id}/stage (API endpoint supporting JWT Bearer)
    try {
      return await apiClient.put<ApiResponse<any>>(
        API_ENDPOINTS.LEADS.UPDATE_STAGE(numId),
        { newStage: stage, stage }
      );
    } catch (err1: any) {
      // 2. Fallback: POST /api/v1/sales-pipeline/update-stage
      try {
        return await apiClient.post<ApiResponse<any>>(
          API_ENDPOINTS.SALES_PIPELINE.UPDATE_STAGE,
          { leadId: numId, newStage: stage }
        );
      } catch (err2: any) {
        // 3. Fallback: POST /leads/update-stage
        return await apiClient.post<ApiResponse<any>>(
          '/leads/update-stage',
          { leadId: numId, stage }
        );
      }
    }
  },

  createLeadStage: async (name: string): Promise<ApiResponse<any>> => {
    const trimmed = name.trim();

    // 1. Persist custom stage locally in AsyncStorage so it remains available across sessions
    try {
      const stored = await AsyncStorage.getItem('@crm_custom_stages');
      const list: string[] = stored ? JSON.parse(stored) : [];
      if (!list.includes(trimmed)) {
        list.push(trimmed);
        await AsyncStorage.setItem('@crm_custom_stages', JSON.stringify(list));
      }
    } catch (storageErr) {
      console.warn('Could not store custom stage in AsyncStorage:', storageErr);
    }

    // 2. Try POST /leads/create-stage on the server
    try {
      const res = await apiClient.post<ApiResponse<any>>(API_ENDPOINTS.LEADS.CREATE_STAGE, {
        name: trimmed,
      });
      return res;
    } catch {
      // Custom stage is already preserved locally and will be persisted on the lead in DB
      return {
        success: true,
        message: 'Custom stage created',
        data: { stage: trimmed },
      };
    }
  },

  // ── General Lead Management ─────────────────────────────────
  updateLead: async (id: number | string, payload: AddLeadPayload): Promise<ApiResponse<any>> => {
    const formattedPayload: AddLeadPayload = {
      ...payload,
      assignedToAgentId: payload.assignedToAgentId ?? payload.executiveId,
      executiveId: payload.executiveId ?? payload.assignedToAgentId,
    };
    return apiClient.put<ApiResponse<any>>(
      API_ENDPOINTS.LEADS.BY_ID(id),
      formattedPayload
    );
  },

  getFormOptions: async (): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(
      API_ENDPOINTS.LEADS.ADD_OPTIONS('')
    );
  },

  // ── Assignable employees (same list as the Web lead-assignment modal) ──
  // GET /api/v1/leads/agent-tracking returns the Web's scoped assignee list: active, approved
  // Agents plus custom-role employees of the caller's organization, gated by the
  // Leads/AssignEmployees permission. There are deliberately NO fallbacks to other user lists:
  // they are scoped differently and showed agents the Web does not offer.
  getAssignableAgents: async (): Promise<
    ApiResponse<Array<{ userId: number; username: string; role?: string; email?: string; phone?: string; leadCount?: number }>> & {
      canAssign?: boolean;
    }
  > => {
    const res = await apiClient.get<any>(API_ENDPOINTS.LEADS.AGENT_TRACKING, { page: 1, pageSize: 1 });
    if (!res || !res.success || !res.data) {
      return { success: false, data: [], message: res?.message || 'Could not load agents' };
    }

    const canAssign = res.data.canAssignLeads ?? res.data.CanAssignLeads;
    const rawAgents = res.data.agents || res.data.Agents || [];
    const formatted = (Array.isArray(rawAgents) ? rawAgents : []).map((a: any) => {
      const cleanName = (a.name || a.Name || '').trim();
      const uId = Number(a.userId ?? a.UserId);
      return {
        userId: uId,
        username: cleanName || `Agent #${uId}`,
        role: a.role || a.Role || 'Agent',
        email: a.email || a.Email || '',
        phone: '',
        leadCount: typeof a.leadCount === 'number' ? a.leadCount : undefined,
      };
    });

    return {
      success: true,
      data: formatted,
      canAssign: canAssign !== false,
      message: canAssign === false ? 'You do not have permission to assign leads.' : 'Assignable employees loaded',
    };
  },

  // ── Lead Assignment ─────────────────────────────────────────
  // Single endpoint with the same validation as the Web's /leads/update-assignment
  // (permission, lead ownership/handover status, assignee must be in the scoped list).
  assignLead: async (id: number | string, agentId: number | null): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.LEADS.AGENT_TRACKING_ASSIGN, {
      leadId: Number(id),
      agentId: agentId ? Number(agentId) : null,
    });
  },

  bulkAssign: async (leadIds: number[], agentId: number): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.LEADS.ASSIGN_BULK,
        { leadIds, executiveId: agentId }
      );
    } catch {
      return await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.UNASSIGNED_LEADS.ASSIGN_EXECUTIVE,
        { leadIds, executiveId: agentId }
      );
    }
  },

  updateStatus: async (id: number | string, status: string): Promise<ApiResponse<any>> => {
    return apiClient.patch<ApiResponse<any>>(
      `/api/v1/LeadsApi/${id}/status`,
      { status }
    );
  },

  // ── Delete Lead ──────────────────────────────────────────────
  deleteLead: async (id: number | string): Promise<{ success: boolean; message: string; isReferenceError?: boolean }> => {
    const numId = Number(id);
    // 1. Primary: POST /Leads/Delete?id=${numId} (matches Web CRM)
    try {
      const res = await apiClient.post<any>(`/Leads/Delete?id=${numId}`);
      return res.data || res;
    } catch (err1: any) {
      // 2. Fallback: DELETE /api/v1/leads/${numId}
      try {
        const res = await apiClient.delete<any>(`/api/v1/leads/${numId}`);
        return res.data || res;
      } catch (err2: any) {
        // 3. Fallback: POST /WebhookLeads/DeleteLead?leadId=${numId}
        const res = await apiClient.post<any>(`/WebhookLeads/DeleteLead?leadId=${numId}`);
        return res.data || res;
      }
    }
  },
};
