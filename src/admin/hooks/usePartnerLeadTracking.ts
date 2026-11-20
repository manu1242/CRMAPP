import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { useAuthStore } from '../../auth/store/authStore';

/* ── Types (backend: Controllers/Api/PartnerTrackingApiController.cs) ── */
export interface PartnerCommissionSummary {
  totalCommissions: number;
  pendingCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
  totalCommissionAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  commissionPercentage: number;
  partnersCount?: number;
}

export interface PartnerPipelineCounts {
  totalLeads: number;
  activeLeads: number;
  handedOverLeads: number;
}

export interface PartnerTrackedLead {
  leadId: number;
  name: string;
  contact?: string | null;
  handoverDate?: string | null;
  handoverStatus?: string | null;
  adminAgent?: string | null;
  partnerName?: string | null;
  bookingStatus?: string | null;
  bookingAmount?: number | null;
  commissionStatus: string;
  commissionAmount: number;
  commissionCalculation: string;
}

export interface PartnerLeadTrackingData {
  scope?: 'all' | 'partner';
  summary: PartnerCommissionSummary;
  pipeline: PartnerPipelineCounts;
  leads: PartnerTrackedLead[];
}

export interface PartnerLeadTrackingDetails {
  lead: {
    leadId: number;
    name: string;
    contact?: string | null;
    handoverStatus?: string | null;
    handoverDate?: string | null;
    adminAgent?: string | null;
  };
  booking: { bookingId: number; status?: string; bookingAmount?: number; createdOn?: string } | null;
  payments: { paymentId: number; amount: number; paymentDate: string; paymentMethod?: string; receiptNumber?: string }[];
  commission: { commissionId: number; status: string; commissionAmount: number; commissionPercentage: number } | null;
  auditTrail: {
    fromStatus?: string;
    toStatus?: string;
    handoverDate?: string;
    handedOverBy?: string | null;
    assignedTo?: string | null;
    notes?: string | null;
  }[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

const canTrack = (role?: string | null) => ['partner', 'admin'].includes(role?.trim()?.toLowerCase() || '');

/**
 * Cached per partner. Short staleTime keeps it in step with the web (bookings / payouts change
 * on the admin side), without refetching on every tab switch.
 */
export function usePartnerLeadTrackingQuery() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['partnerLeadTracking', user?.userId, user?.tenantId],
    queryFn: ({ signal }) =>
      apiClient
        .get<ApiEnvelope<PartnerLeadTrackingData>>(API_ENDPOINTS.DASHBOARD.PARTNER_LEAD_TRACKING, undefined, { signal })
        .then((r) => r.data),
    enabled: !!user && canTrack(user?.role),
    staleTime: 60 * 1000,
  });
}

export function usePartnerLeadTrackingDetailsQuery(leadId: number | null) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['partnerLeadTrackingDetails', user?.userId, leadId],
    queryFn: ({ signal }) =>
      apiClient
        .get<ApiEnvelope<PartnerLeadTrackingDetails>>(
          API_ENDPOINTS.DASHBOARD.PARTNER_LEAD_TRACKING_DETAILS(leadId as number),
          undefined,
          { signal }
        )
        .then((r) => r.data),
    enabled: !!user && leadId != null,
    staleTime: 60 * 1000,
  });
}
