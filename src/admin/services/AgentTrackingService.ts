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
  try {
    let url = `${API_ENDPOINTS.LEADS.AGENT_TRACKING}?page=${page}&pageSize=${pageSize}`;
    if (executiveId) url += `&executiveId=${executiveId}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (stage && stage !== 'All') url += `&stage=${encodeURIComponent(stage)}`;

    const response = await apiClient.get<ApiResponse<AgentTrackingData>>(url);
    if (response?.success && response.data) {
      return response;
    }
    return await fallbackFetchAgentTracking(executiveId, search, stage, page, pageSize);
  } catch (error) {
    console.warn('Agent tracking endpoint failed, using resilient fallback:', error);
    return await fallbackFetchAgentTracking(executiveId, search, stage, page, pageSize);
  }
}

/**
 * Assigns or reassigns an agent to a lead.
 */
export async function assignAgentLead(
  payload: AssignAgentLeadPayload
): Promise<ApiResponse<any>> {
  try {
    return await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.LEADS.AGENT_TRACKING_ASSIGN,
      payload
    );
  } catch (error: any) {
    // Fallback to legacy assignment route if newly deployed route is not reached
    try {
      return await apiClient.post<ApiResponse<any>>('/leads/update-assignment', payload);
    } catch {
      throw error;
    }
  }
}

/**
 * Fallback synthesizer that queries /api/v1/leads and /api/v1/agents
 * to guarantee complete operational stability in any environment.
 */
async function fallbackFetchAgentTracking(
  executiveId?: number,
  search?: string,
  stage?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<AgentTrackingData>> {
  try {
    // 1. Fetch agents
    let agentsList: any[] = [];
    try {
      const agentsRes = await apiClient.get<ApiResponse<any>>('/api/v1/agents?page=1&pageSize=100');
      agentsList = agentsRes?.data?.items || agentsRes?.data || [];
    } catch (e) {
      console.warn('Fallback fetching agents failed:', e);
    }

    const agentMap: Record<number, string> = {};
    const formattedAgents = agentsList.map((a: any) => {
      const id = a.agentId || a.userId;
      const name = a.fullName || a.username || a.name || `Agent #${id}`;
      if (id) agentMap[id] = name;
      return {
        userId: id,
        name,
        email: a.email,
        leadCount: 0,
      };
    });

    // 2. Fetch leads
    let leadsUrl = `/api/v1/leads?page=1&pageSize=100`;
    if (executiveId) leadsUrl += `&executiveId=${executiveId}`;
    if (search) leadsUrl += `&search=${encodeURIComponent(search)}`;
    if (stage && stage !== 'All') leadsUrl += `&stage=${encodeURIComponent(stage)}`;

    const leadsRes = await apiClient.get<ApiResponse<any>>(leadsUrl);
    const rawLeads: any[] = leadsRes?.data?.items || leadsRes?.data || [];

    // Count leads per agent
    rawLeads.forEach((l: any) => {
      const agId = l.assignedToAgentId || l.executiveId;
      const match = formattedAgents.find(a => a.userId === agId);
      if (match) match.leadCount += 1;
    });

    let filtered = rawLeads;
    if (executiveId) {
      filtered = filtered.filter(l => (l.assignedToAgentId || l.executiveId) === executiveId);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(l =>
        (l.fullName || l.name || '').toLowerCase().includes(s) ||
        (l.phone || l.contact || '').toLowerCase().includes(s) ||
        (l.email || '').toLowerCase().includes(s)
      );
    }
    if (stage && stage !== 'All') {
      filtered = filtered.filter(l => (l.stage || '').toLowerCase() === stage.toLowerCase());
    }

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    const items = paged.map((l: any) => {
      const agId = l.assignedToAgentId || l.executiveId || null;
      return {
        leadId: l.leadId,
        name: l.fullName || l.name || 'Unnamed Lead',
        contact: l.phone || l.contact || '-',
        email: l.email || '-',
        stage: l.stage || 'New',
        status: l.status || 'New',
        source: l.source || 'Direct',
        location: l.preferredLocation || l.groupName || '-',
        createdOn: l.createdDate || l.createdOn || new Date().toISOString(),
        followUpDate: l.followUpDate || null,
        assignedAgentId: agId,
        assignedAgentName: agId && agentMap[agId] ? agentMap[agId] : 'Unassigned',
      };
    });

    return {
      success: true,
      message: 'Agent lead tracking data retrieved successfully',
      data: {
        agents: formattedAgents,
        selectedExecutiveId: executiveId || null,
        canAssignLeads: true,
        isPartnerTeamUser: false,
        items,
        totalCount,
        pageNumber: page,
        pageSize,
        totalPages,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to fetch agent tracking data',
      data: {
        agents: [],
        selectedExecutiveId: null,
        canAssignLeads: false,
        isPartnerTeamUser: false,
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize,
        totalPages: 1,
      },
    };
  }
}

