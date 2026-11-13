export interface AgentTrackingAgent {
  userId: number;
  name: string;
  email?: string;
  leadCount: number;
}

export interface AgentTrackingLead {
  leadId: number;
  name: string;
  contact: string;
  email: string;
  stage: string;
  status: string;
  source: string;
  location: string;
  createdOn: string;
  followUpDate: string | null;
  assignedAgentId: number | null;
  assignedAgentName: string;
}

export interface AgentTrackingData {
  agents: AgentTrackingAgent[];
  selectedExecutiveId: number | null;
  canAssignLeads: boolean;
  isPartnerTeamUser: boolean;
  items: AgentTrackingLead[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface AssignAgentLeadPayload {
  leadId: number;
  agentId: number | null;
}

