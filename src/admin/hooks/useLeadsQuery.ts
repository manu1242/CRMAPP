import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { LeadService } from '../services/LeadService';
import { LeadQueryParams, ApiResponse, LeadListResponseData } from '../models/LeadTypes';

export function useLeadsQuery(params?: LeadQueryParams) {
  return useQuery<ApiResponse<LeadListResponseData>, Error>({
    queryKey: ['leads', params],
    queryFn: ({ signal }) => LeadService.getLeads(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000, // 3 minutes stale time for leads
  });
}

export function useLeadDetailsQuery(id: number | string | undefined) {
  return useQuery({
    queryKey: ['leadDetails', id],
    queryFn: ({ signal }) => (id ? LeadService.getLeadDetails(id, signal) : Promise.reject('No lead ID provided')),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
