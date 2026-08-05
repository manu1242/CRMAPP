import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ChannelPartnerService } from '../services/ChannelPartnerService';

// ─── Stale / GC times ────────────────────────────────────────────────────────
// Partner lists are moderately stable — 5 min stale, 10 min in GC memory.
// Individual partner detail pages stay cached for 15 min after navigation.
const PARTNERS_STALE_MS = 5 * 60 * 1000;   //  5 minutes
const PARTNERS_GC_MS    = 10 * 60 * 1000;  // 10 minutes
const PARTNER_STALE_MS  = 5 * 60 * 1000;
const PARTNER_GC_MS     = 15 * 60 * 1000;

/**
 * Hook to query paginated & filtered channel partners.
 * AbortSignal is forwarded so in-flight requests cancel on unmount or key change.
 */
export const useChannelPartners = (params?: {
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ['channelPartners', params],
    queryFn: ({ signal }) => ChannelPartnerService.getPartners(params, signal),
    staleTime: PARTNERS_STALE_MS,
    gcTime: PARTNERS_GC_MS,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to query detailed info of a single channel partner by ID.
 * Disabled when id is falsy to prevent erroneous fetches.
 */
export const useChannelPartner = (id: number | string | undefined) => {
  return useQuery({
    queryKey: ['channelPartner', id],
    queryFn: () => ChannelPartnerService.getPartnerById(id!),
    enabled: !!id,
    staleTime: PARTNER_STALE_MS,
    gcTime: PARTNER_GC_MS,
  });
};

/**
 * Hook to create/onboard a new channel partner.
 */
export const useCreateChannelPartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => ChannelPartnerService.createPartner(formData),
    onSuccess: () => {
      // Invalidate channel partners query to reload list automatically
      queryClient.invalidateQueries({ queryKey: ['channelPartners'] });
    },
  });
};

/**
 * Hook to query subscription plans.
 * Plans change very rarely — cache aggressively.
 */
export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => ChannelPartnerService.getPlans(),
    staleTime: 30 * 60 * 1000, // 30 minutes — plan structures rarely change
    gcTime: 60 * 60 * 1000,    // 1 hour
  });
};

/**
 * Hook to update an existing channel partner.
 */
export const useUpdateChannelPartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: any }) =>
      ChannelPartnerService.updatePartner(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['channelPartner', String(id)] });
      queryClient.invalidateQueries({ queryKey: ['channelPartner', Number(id)] });
      queryClient.invalidateQueries({ queryKey: ['channelPartners'] });
    },
  });
};

/**
 * Hook to delete an existing channel partner.
 */
export const useDeleteChannelPartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => ChannelPartnerService.deletePartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channelPartners'] });
    },
  });
};

/**
 * Hook to upload a document for a channel partner.
 */
export const useUploadPartnerDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      partnerId,
      fileUri,
      fileName,
      fileType,
      docName,
      docType,
    }: {
      partnerId: number | string;
      fileUri: string;
      fileName: string;
      fileType: string;
      docName: string;
      docType: string;
    }) =>
      ChannelPartnerService.uploadDocument(partnerId, fileUri, fileName, fileType, docName, docType),
    onSuccess: (_, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: ['channelPartner', String(partnerId)] });
      queryClient.invalidateQueries({ queryKey: ['channelPartner', Number(partnerId)] });
      queryClient.invalidateQueries({ queryKey: ['channelPartners'] });
    },
  });
};

/**
 * Hook to delete a document for a channel partner.
 */
export const useDeletePartnerDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ partnerId, documentId }: { partnerId: number | string; documentId: number | string }) =>
      ChannelPartnerService.deleteDocument(documentId),
    onSuccess: (_, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: ['channelPartner', String(partnerId)] });
      queryClient.invalidateQueries({ queryKey: ['channelPartner', Number(partnerId)] });
      queryClient.invalidateQueries({ queryKey: ['channelPartners'] });
    },
  });
};
