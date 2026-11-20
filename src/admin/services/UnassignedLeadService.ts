import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import {
  GetUnassignedLeadsResponse,
  GetUnassignedExecutivesResponse,
  AssignExecutiveRequest,
  AssignExecutiveResponse,
  DeleteLeadResponse,
  UnassignedSourceFilter,
} from '../models/UnassignedLeadTypes';

export const UnassignedLeadService = {
  getUnassignedLeads: (
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    source?: UnassignedSourceFilter,
    signal?: AbortSignal
  ): Promise<GetUnassignedLeadsResponse> =>
    apiClient.get<GetUnassignedLeadsResponse>(
      API_ENDPOINTS.UNASSIGNED_LEADS.GET_UNASSIGNED,
      { page, pageSize, search: search || undefined, source: source || undefined },
      { signal }
    ),

  getExecutives: (): Promise<GetUnassignedExecutivesResponse> =>
    apiClient.get<GetUnassignedExecutivesResponse>(API_ENDPOINTS.UNASSIGNED_LEADS.EXECUTIVES),

  assignExecutive: (payload: AssignExecutiveRequest): Promise<AssignExecutiveResponse> =>
    apiClient.post<AssignExecutiveResponse>(API_ENDPOINTS.UNASSIGNED_LEADS.ASSIGN_EXECUTIVE, payload),

  deleteLead: (leadId: number): Promise<DeleteLeadResponse> =>
    apiClient.delete<DeleteLeadResponse>(API_ENDPOINTS.UNASSIGNED_LEADS.DELETE_LEAD(leadId)),
};
