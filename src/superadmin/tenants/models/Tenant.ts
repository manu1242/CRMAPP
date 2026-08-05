export interface Tenant {
  tenantId: number;
  companyName: string;
  email: string;
  contactPerson: string;
  phone: string;
  subdomain: string;
  connectionString: string;
  plan: string;
  maxUsers: number;
  isActive: boolean;
  isSuspended: boolean;
  suspendedReason: string | null;
  createdOn: string;
  updatedOn: string | null;
  referral: string;
}

export interface TenantCreateRequest {
  companyName: string;
  subdomain: string;
  plan: string;
  planId: number;
  contactPerson: string;
  email: string;
  phone: string;
  referralCode?: string;
}

export interface TenantUpdateRequest {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  plan: string;
  maxUsers: number;
}

export interface PaginatedTenantsResponse {
  items: Tenant[];
  page: number;
  pageSize: number;
  totalRecords: number;
}


export interface SaaSSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  copyrightText: string;
  referralReferrerAmount: string;
  referralJoinerAmount: string;
  companyLogo: string;
  companyMapUrl: string;
}