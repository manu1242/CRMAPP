import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "../services/RevenueService";
import { CreateRevenueRequest, UpdateRevenueRequest } from "../models/RevenueTypes";

// ─── Stale / GC times ────────────────────────────────────────────────────────
// Revenue fetches the entire server-rendered HTML page and regex-parses it —
// this is an expensive operation. Cache aggressively to minimise repeat scrapes.
// 5 min stale keeps data fresh enough for financial review while avoiding
// redundant full-page HTML parses on every focus/mount.
const REVENUES_STALE_MS  = 5 * 60 * 1000;   // 5 minutes — expensive HTML parse
const REVENUES_GC_MS     = 15 * 60 * 1000;  // 15 minutes
const REVENUE_STALE_MS   = 5 * 60 * 1000;
const REVENUE_GC_MS      = 10 * 60 * 1000;

/**
 * Hook to retrieve the complete list of revenues (manually created + system generated).
 * NOTE: The underlying service scrapes an HTML endpoint — staleTime is set high
 * to avoid redundant parses. A proper JSON API endpoint would be preferable long-term.
 */
export const useRevenues = () => {
  return useQuery({
    queryKey: ["revenues"],
    queryFn: () => service.getRevenues(),
    staleTime: REVENUES_STALE_MS,
    gcTime: REVENUES_GC_MS,
  });
};

/**
 * Hook to retrieve detailed info for a single revenue record.
 */
export const useRevenueDetails = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["revenueDetails", id],
    queryFn: () => service.getRevenueDetails(id),
    enabled: !!id && enabled,
    staleTime: REVENUE_STALE_MS,
    gcTime: REVENUE_GC_MS,
  });
};

/**
 * Hook to record a new revenue entry.
 */
export const useRecordRevenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRevenueRequest) => service.createRevenue(data),
    onSuccess: () => {
      // Invalidate the revenue query to refresh list immediately
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
    },
  });
};

/**
 * Hook to update an existing revenue entry.
 */
export const useUpdateRevenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRevenueRequest) => service.updateRevenue(data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      queryClient.invalidateQueries({ queryKey: ["revenueDetails", variables.revenueId] });
    },
  });
};

/**
 * Hook to delete a revenue entry.
 */
export const useDeleteRevenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => service.deleteRevenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
    },
  });
};
