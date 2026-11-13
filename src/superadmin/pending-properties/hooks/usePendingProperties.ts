import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pendingPropertiesApi } from '../api/pendingProperties.api';
import { PendingPropertiesFilterParams } from '../models/pendingProperty';

export const PENDING_PROPERTIES_KEYS = {
  all: ['superadmin-pending-properties'] as const,
  lists: () => [...PENDING_PROPERTIES_KEYS.all, 'list'] as const,
  list: (params?: PendingPropertiesFilterParams) =>
    [...PENDING_PROPERTIES_KEYS.lists(), params] as const,
  stats: () => [...PENDING_PROPERTIES_KEYS.all, 'stats'] as const,
  detail: (id: string | number) =>
    [...PENDING_PROPERTIES_KEYS.all, 'detail', String(id)] as const,
};

export const usePendingPropertiesQuery = (params?: PendingPropertiesFilterParams) => {
  return useQuery({
    queryKey: PENDING_PROPERTIES_KEYS.list(params),
    queryFn: () => pendingPropertiesApi.getProperties(params),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const usePendingPropertiesStatsQuery = () => {
  return useQuery({
    queryKey: PENDING_PROPERTIES_KEYS.stats(),
    queryFn: () => pendingPropertiesApi.getStats(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const usePendingPropertyDetailQuery = (id: number | string | null | undefined) => {
  return useQuery({
    queryKey: PENDING_PROPERTIES_KEYS.detail(id || ''),
    queryFn: () => pendingPropertiesApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useModeratePropertyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      rejectReason,
    }: {
      id: number | string;
      status: 'ACTIVE' | 'REJECTED';
      rejectReason?: string;
    }) => pendingPropertiesApi.moderateProperty(id, status, rejectReason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PENDING_PROPERTIES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PENDING_PROPERTIES_KEYS.detail(id) });
    },
  });
};

