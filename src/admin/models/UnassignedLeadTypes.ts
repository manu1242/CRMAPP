export interface UnassignedLeadItem {
  leadId: number;
  fullName: string;
  email?: string;
  phone: string;
  stage?: string;
  status?: string;
  source?: string;
  groupName?: string;
  preferredLocation?: string;
  sqft?: string;
  facing?: string;
  type?: string;
  propertyType?: string;
  bhk?: string;
  requirement?: string;
  comments?: string;
  rating?: string | null;
  handoverStatus?: string;
  channelPartnerId?: number | null;
  assignedToAgentId?: number | null;
  followUpDate?: string | null;
  createdDate?: string;
}

export interface UnassignedLeadsPaginatedData {
  items: UnassignedLeadItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface GetUnassignedLeadsResponse {
  success: boolean;
  message: string;
  data: UnassignedLeadsPaginatedData;
}

export interface AssignExecutiveRequest {
  leadIds: number[];
  executiveId: number;
}

export interface AssignExecutiveResponse {
  success: boolean;
  message: string;
}

export interface DeleteLeadResponse {
  success: boolean;
  message: string;
}
