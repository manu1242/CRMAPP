import { useInfiniteQuery, QueryKey, InfiniteData } from '@tanstack/react-query';

export interface PaginatedResponse<T> {
  data: {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
  };
  success: boolean;
  message?: string;
}

export interface UsePaginatedQueryOptions<T> {
  /** TanStack Query cache key (excluding page) */
  queryKey: QueryKey;
  /** Service function that accepts page + pageSize and returns a PaginatedResponse */
  queryFn: (page: number, pageSize: number, signal: AbortSignal) => Promise<PaginatedResponse<T>>;
  /** Items per page (default: 20, max recommended: 50) */
  pageSize?: number;
  /** staleTime in ms (default: 3 minutes) */
  staleTime?: number;
  /** gcTime in ms (default: 8 minutes) */
  gcTime?: number;
  /** Whether the query should run (default: true) */
  enabled?: boolean;
}

/**
 * Generic cursor/offset paginated query hook built on TanStack's `useInfiniteQuery`.
 *
 * Enforces limit/offset pagination so the app never fetches unbounded rows.
 * Each "page" maps to a `page` + `pageSize` pair forwarded to the API.
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePaginatedQuery({
 *   queryKey: ['agents', params],
 *   queryFn: (page, pageSize, signal) => AgentsService.getAgents({ ...params, page, pageSize }, signal),
 *   pageSize: 20,
 * });
 *
 * // Flatten all pages into a single array:
 * const allItems = data?.pages.flatMap(p => p.data.items) ?? [];
 */
export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  pageSize = 20,
  staleTime = 3 * 60 * 1000,
  gcTime = 8 * 60 * 1000,
  enabled = true,
}: UsePaginatedQueryOptions<T>) {
  return useInfiniteQuery<
    PaginatedResponse<T>,
    Error,
    InfiniteData<PaginatedResponse<T>>,
    QueryKey,
    number
  >({
    queryKey,
    queryFn: ({ pageParam = 1, signal }) => queryFn(pageParam, pageSize, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pageNumber, totalPages } = lastPage.data;
      return pageNumber < totalPages ? pageNumber + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      const { pageNumber } = firstPage.data;
      return pageNumber > 1 ? pageNumber - 1 : undefined;
    },
    staleTime,
    gcTime,
    enabled,
  });
}
