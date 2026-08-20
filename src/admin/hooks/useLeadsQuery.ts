import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { LeadService } from '../services/LeadService';
import { LeadQueryParams, ApiResponse, LeadListResponseData, AddLeadPayload } from '../models/LeadTypes';

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

export function useLeadFormOptionsQuery() {
  return useQuery({
    queryKey: ['leadFormOptions'],
    queryFn: () => LeadService.getFormOptions(),
    staleTime: 30 * 60 * 1000, // 30 minutes stale time
  });
}

export function useAddLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddLeadPayload) => LeadService.addLead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: AddLeadPayload }) =>
      LeadService.updateLead(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadDetails', id] });
    },
  });
}
