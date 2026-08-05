import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import {
  GetUnassignedLeadsResponse,
  AssignExecutiveRequest,
  AssignExecutiveResponse,
  DeleteLeadResponse,
} from '../models/UnassignedLeadTypes';

export const UnassignedLeadService = {
  getUnassignedLeads: async (
    page: number = 1,
    pageSize: number = 10,
    search?: string
  ): Promise<GetUnassignedLeadsResponse> => {
    return apiClient.get<GetUnassignedLeadsResponse>(
      API_ENDPOINTS.UNASSIGNED_LEADS.GET_UNASSIGNED,
      {
        executiveId: 0,
        page,
        pageSize,
        search,
      }
    );
  },

  assignExecutive: async (payload: AssignExecutiveRequest): Promise<AssignExecutiveResponse> => {
    return apiClient.post<AssignExecutiveResponse>(
      API_ENDPOINTS.UNASSIGNED_LEADS.ASSIGN_EXECUTIVE,
      payload
    );
  },

  deleteLead: async (leadId: number): Promise<DeleteLeadResponse> => {
    return apiClient.post<DeleteLeadResponse>(
      `${API_ENDPOINTS.UNASSIGNED_LEADS.DELETE_LEAD}?leadId=${leadId}`
    );
  },
};
