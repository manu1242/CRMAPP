import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface NoteItem {
  noteId: number;
  leadId: number;
  noteText: string;
  executiveId?: number;
  createdOn?: string;
}

export interface DocumentItem {
  uploadId: number;
  leadId: number;
  fileName: string;
  filePath: string;
  fileType?: string;
  uploadedBy?: number;
  uploadedOn?: string;
}

export interface SiteVisitItem {
  followUpId: number;
  leadId: number;
  propertyId?: number;
  propertyName?: string;
  visitDate: string;
  visitDateFormatted?: string;
  visitTime?: string;
  stage?: string;
  status?: string;
  interestStatus?: 'Interested' | 'Not Interested' | 'Cold' | string;
  rating?: string;
  comments?: string;
  executiveId?: number;
  executiveName?: string;
  createdOn?: string;
  completedOn?: string | null;
}

export interface ActivityItem {
  historyId: number;
  leadId: number;
  activity: string;
  activityDate: string;
  activityDateFormatted?: string;
  executiveId?: number;
  executiveName?: string;
}

export interface FollowUpItem {
  followUpId: number;
  leadId: number;
  followUpDate: string;
  followUpTime?: string;
  stage?: string;
  status?: string;
  comments?: string;
  rating?: string;
  createdOn?: string;
}

export const LeadDetailsService = {
  // ── Follow-ups ──────────────────────────────────────────────
  getFollowUps: async (leadId: number | string) => {
    return apiClient.get<any>(API_ENDPOINTS.LEADS.GET_FOLLOW_UPS(leadId));
  },

  addFollowUp: async (leadId: number | string, data: any) => {
    return apiClient.post<any>(API_ENDPOINTS.LEADS.ADD_FOLLOW_UP(leadId), data);
  },

  updateFollowUp: async (leadId: number | string, followUpId: number | string, data: any) => {
    return apiClient.put<any>(API_ENDPOINTS.LEADS.EDIT_FOLLOW_UP(leadId, followUpId), data);
  },

  deleteFollowUp: async (leadId: number | string, followUpId: number | string) => {
    return apiClient.delete<any>(API_ENDPOINTS.LEADS.DELETE_FOLLOW_UP(leadId, followUpId));
  },

  // ── Notes ───────────────────────────────────────────────────
  getNotes: async (leadId: number | string) => {
    return apiClient.get<any>(API_ENDPOINTS.LEADS.GET_NOTES(leadId));
  },

  addNote: async (leadId: number | string, noteText: string) => {
    return apiClient.post<any>(API_ENDPOINTS.LEADS.ADD_NOTE(leadId), { noteText });
  },

  updateNote: async (leadId: number | string, noteId: number | string, noteText: string) => {
    return apiClient.put<any>(API_ENDPOINTS.LEADS.UPDATE_NOTE(leadId, noteId), { noteText });
  },

  deleteNote: async (leadId: number | string, noteId: number | string) => {
    return apiClient.delete<any>(API_ENDPOINTS.LEADS.DELETE_NOTE(leadId, noteId));
  },

  // ── Documents ───────────────────────────────────────────────
  getDocuments: async (leadId: number | string) => {
    return apiClient.get<any>(API_ENDPOINTS.LEADS.GET_DOCUMENTS(leadId));
  },

  uploadDocument: async (leadId: number | string, formData: FormData) => {
    return apiClient.postForm<any>(API_ENDPOINTS.LEADS.UPLOAD_DOC(leadId), formData);
  },

  deleteDocument: async (leadId: number | string, uploadId: number | string) => {
    return apiClient.delete<any>(API_ENDPOINTS.LEADS.DELETE_DOC(leadId, uploadId));
  },

  // ── Site Visits ─────────────────────────────────────────────
  getSiteVisits: async (leadId: number | string) => {
    return apiClient.get<any>(API_ENDPOINTS.LEADS.GET_SITE_VISITS(leadId));
  },

  scheduleSiteVisit: async (leadId: number | string, data: any) => {
    return apiClient.post<any>(API_ENDPOINTS.LEADS.SCHEDULE_SITE_VISIT(leadId), data);
  },

  updateInterestStatus: async (
    leadId: number | string,
    followUpId: number | string,
    interestStatus: 'Interested' | 'Not Interested' | 'Cold' | string
  ) => {
    return apiClient.put<any>(
      API_ENDPOINTS.LEADS.UPDATE_INTEREST_STATUS(leadId, followUpId),
      { interestStatus }
    );
  },

  // ── Activities / Timeline ───────────────────────────────────
  getActivities: async (leadId: number | string) => {
    return apiClient.get<any>(API_ENDPOINTS.LEADS.GET_ACTIVITIES(leadId));
  },
};
