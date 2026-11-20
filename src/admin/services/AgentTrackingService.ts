import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { ApiResponse } from '../models/QuoatationTypes';
import {
  AgentTrackingData,
  AssignAgentLeadPayload,
} from '../models/AgentTrackingTypes';

/**
 * Fetch agent lead tracking data (scoped agents, lead counts, and detailed leads).
 * Matches web LeadsController.AgentTracking behavior.
 */
export async function getAgentLeadTracking(
  executiveId?: number,
  search?: string,
  stage?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<AgentTrackingData>> {
  // Backend: Controllers/Api/AgentTrackingApiController.cs (web LeadsController.AgentTracking)
  let url = `${API_ENDPOINTS.LEADS.AGENT_TRACKING}?page=${page}&pageSize=${pageSize}`;
  if (executiveId) url += `&executiveId=${executiveId}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (stage && stage !== 'All') url += `&stage=${encodeURIComponent(stage)}`;
  return apiClient.get<ApiResponse<AgentTrackingData>>(url);
}

/**
 * Assigns or reassigns an agent to a lead (web LeadsController.UpdateAssignment rules).
 */
export async function assignAgentLead(payload: AssignAgentLeadPayload): Promise<ApiResponse<any>> {
  return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.LEADS.AGENT_TRACKING_ASSIGN, payload);
}
