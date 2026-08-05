export interface Plan {
  planId: number;
  planName: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  maxUsers: number;
  maxAgents: number;
  maxLeadsPerMonth: number;
  maxPartners: number;
  maxStorageGB: number;
  hasWhatsAppIntegration: boolean;
  hasFacebookIntegration: boolean;
  hasEmailIntegration: boolean;
  hasCustomAPIAccess: boolean;
  hasAdvancedReports: boolean;
  hasCustomBranding: boolean;
  hasPrioritySupport: boolean;
  hasImpersonation: boolean;
  supportLevel: string;
  planType: string;
  isActive: boolean;
  sortOrder: number;
  showOnLandingPage: boolean | null;
  createdOn: string;
  updatedOn: string | null;
}

export interface PlanCreateRequest {
  planName: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxUsers: number;
  maxAgents: number;
  maxLeadsPerMonth: number;
  maxPartners: number;
  maxStorageGB: number;
  hasWhatsAppIntegration: boolean;
  hasFacebookIntegration: boolean;
  hasEmailIntegration: boolean;
  hasCustomAPIAccess: boolean;
  hasAdvancedReports: boolean;
  hasCustomBranding: boolean;
  hasPrioritySupport: boolean;
  hasImpersonation: boolean;
  supportLevel: string;
  planType: string;
  isActive: boolean;
  sortOrder: number;
  showOnLandingPage: boolean;
}

export type PlanUpdateRequest = PlanCreateRequest;
