import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  InfiniteData,
} from '@tanstack/react-query';
import { UnassignedLeadService } from '../services/UnassignedLeadService';
import {
  GetUnassignedLeadsResponse,
  UnassignedSourceFilter,
} from '../models/UnassignedLeadTypes';

const PAGE_SIZE = 20;

export const unassignedKeys = {
  all: ['unassignedLeads'] as const,
  list: (search: string, source: UnassignedSourceFilter) =>
    ['unassignedLeads', 'list', { search, source }] as const,
  executives: ['unassignedLeads', 'executives'] as const,
};

/**
 * Infinite, cached list. Cached data is shown instantly when the screen is revisited;
 * a background refetch only happens once the data is stale (2 min).
 */
export function useUnassignedLeadsQuery(search: string, source: UnassignedSourceFilter) {
  return useInfiniteQuery<
    GetUnassignedLeadsResponse,
    Error,
    InfiniteData<GetUnassignedLeadsResponse>,
    ReturnType<typeof unassignedKeys.list>,
    number
  >({
    queryKey: unassignedKeys.list(search, source),
    queryFn: ({ pageParam, signal }) =>
      UnassignedLeadService.getUnassignedLeads(pageParam, PAGE_SIZE, search, source, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const d = last?.data;
      if (!d) return undefined;
      return d.pageNumber < d.totalPages ? d.pageNumber + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/** Executives rarely change — cache for 30 min. */
export function useUnassignedExecutivesQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: unassignedKeys.executives,
    queryFn: () => UnassignedLeadService.getExecutives(),
    select: (res) => (res?.success && Array.isArray(res.data) ? res.data : []),
    staleTime: 30 * 60 * 1000,
    enabled,
  });
}

/** Removes the given lead ids from every cached unassigned list (optimistic, no refetch flash). */
function removeFromCache(qc: ReturnType<typeof useQueryClient>, ids: number[]) {
  const idSet = new Set(ids);
  qc.setQueriesData<InfiniteData<GetUnassignedLeadsResponse>>(
    { queryKey: [...unassignedKeys.all, 'list'] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((p) => {
          if (!p?.data) return p;
          const before = p.data.items.length;
          const items = p.data.items.filter((i) => !idSet.has(i.leadId));
          const removed = before - items.length;
          return {
            ...p,
            data: {
              ...p.data,
              items,
              totalCount: Math.max(0, p.data.totalCount - removed),
              stats: p.data.stats
                ? { ...p.data.stats, totalUnassigned: Math.max(0, p.data.stats.totalUnassigned - removed) }
                : p.data.stats,
            },
          };
        }),
      };
    }
  );
}

function useAfterChange() {
  const qc = useQueryClient();
  return (ids: number[]) => {
    removeFromCache(qc, ids);
    // Mark stale in background so totals re-sync, without blanking the list
    qc.invalidateQueries({ queryKey: [...unassignedKeys.all, 'list'], refetchType: 'none' });
    qc.invalidateQueries({ queryKey: ['leads'] });
  };
}

export function useAssignUnassignedMutation() {
  const after = useAfterChange();
  return useMutation({
    mutationFn: (payload: { leadIds: number[]; executiveId: number }) =>
      UnassignedLeadService.assignExecutive(payload),
    onSuccess: (res, vars) => {
      if (res?.success) after(vars.leadIds);
    },
  });
}

export function useDeleteUnassignedMutation() {
  const after = useAfterChange();
  return useMutation({
    mutationFn: (leadId: number) => UnassignedLeadService.deleteLead(leadId),
    onSuccess: (res, leadId) => {
      if (res?.success) after([leadId]);
    },
  });
}
