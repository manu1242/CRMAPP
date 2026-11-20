export type UnassignedSourceFilter = '' | 'facebook' | 'website' | 'manual' | 'other';

export interface UnassignedLeadItem {
  leadId: number;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  bhk?: string | null;
  preferredLocation?: string | null;
  propertyType?: string | null;
  comments?: string | null;
  handoverStatus?: string | null;
  channelPartnerId?: number | null;
  createdDate?: string;
  isFacebook?: boolean;
}

export interface UnassignedLeadStats {
  totalUnassigned: number;
  facebookCount: number;
  executivesCount: number;
}

export interface UnassignedLeadsPaginatedData {
  items: UnassignedLeadItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  stats: UnassignedLeadStats;
}

export interface GetUnassignedLeadsResponse {
  success: boolean;
  message: string;
  data: UnassignedLeadsPaginatedData;
}

export interface UnassignedExecutive {
  userId: number;
  username: string;
  role?: string;
}

export interface GetUnassignedExecutivesResponse {
  success: boolean;
  message: string;
  data: UnassignedExecutive[];
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
