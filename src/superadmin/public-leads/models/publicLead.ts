export type PublicLeadType = 'Enquiry' | 'Callback' | 'SiteVisit' | 'Support' | string;

export interface PublicLeadItem {
  leadId: number;
  tenantId?: number | null;
  propertyId?: number | null;
  agentId?: number | null;
  name: string;
  phone: string;
  type: PublicLeadType;
  latestAction?: string | null;
  message?: string | null;
  callbackRequested?: boolean;
  siteVisitDate?: string | null;
  createdOn?: string | null;
  tenantName?: string | null;
  propertyName?: string | null;
  agentName?: string | null;
  support?: string | null;
  status?: string | null;
}

export interface PublicLeadStats {
  totalLeads: number;
  totalEnquiries: number;
  totalCallbacks: number;
  totalSiteVisits: number;
  totalSupport: number;
}

export interface PublicLeadsPaginatedData {
  page: number;
  pageSize: number;
  totalRecords: number;
  items: PublicLeadItem[];
}

export interface PublicLeadsFilterParams {
  page?: number;
  pageSize?: number;
  type?: PublicLeadType;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BulkDeletePublicLeadsRequest {
  leadIds: number[];
}

export interface PublicLeadApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
