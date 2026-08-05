export interface SubscriptionPlan {
  planId: number;
  planName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxAgents: number;
  maxLeadsPerMonth: number;
  maxStorageGB: number;
  hasWhatsAppIntegration: boolean;
  hasFacebookIntegration: boolean;
  hasEmailIntegration: boolean;
  hasCustomAPIAccess: boolean;
  hasAdvancedReports: boolean;
}

export interface ActiveSubscription {
  subscriptionId: number;
  planId: number;
  planName: string;
  billingCycle: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface PartnerDocument {
  documentId: number;
  fileName: string;
  documentName: string;
  documentType: string;
  fileSize: number;
  contentType: string;
  uploadedOn: string;
  verificationStatus: string;
  rejectionReason: string | null;
}

export interface ChannelPartner {
  partnerId: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string | null;
  commissionScheme: string;
  status: string;
  createdOn: string;
  approvedBy: number | null;
  approvedOn: string | null;
  userId: number;
  commissionPercentage: number;
  subscriptionPlan: string | null;
  subdomain: string | null;
  totalLeads?: number;
  closedLeads?: number;
  activeSubscription: ActiveSubscription | null;
  documents: PartnerDocument[];
}
