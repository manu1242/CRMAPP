import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as service from "../services/RevenueService";
import { CreateRevenueRequest, UpdateRevenueRequest } from "../models/RevenueTypes";

const REVENUES_STALE_MS = 3 * 60 * 1000;
const REVENUES_GC_MS    = 8 * 60 * 1000;
const REVENUE_STALE_MS  = 5 * 60 * 1000;
const REVENUE_GC_MS     = 12 * 60 * 1000;

/**
 * Hook to retrieve the list of revenues with pagination, filters, sorting, and summary metrics.
 */
export const useRevenues = (
  page: number = 1,
  pageSize: number = 10,
  type?: string,
  search?: string,
  fromDate?: string,
  toDate?: string,
  sort?: string
) => {
  return useQuery({
    queryKey: ["revenues", page, pageSize, type, search, fromDate, toDate, sort],
    queryFn: () => service.getRevenues(page, pageSize, type, search, fromDate, toDate, sort),
    staleTime: REVENUES_STALE_MS,
    gcTime: REVENUES_GC_MS,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to retrieve detailed info for a single revenue record.
 */
export const useRevenueDetails = (id: number | string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["revenueDetails", id],
    queryFn: () => service.getRevenueDetails(id),
    enabled: !!id && enabled,
    staleTime: REVENUE_STALE_MS,
    gcTime: REVENUE_GC_MS,
  });
};

/**
 * Hook to record a new manual revenue entry.
 */
export const useRecordRevenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRevenueRequest) => service.createRevenue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      queryClient.invalidateQueries({ queryKey: ["profitAnalytics"] });
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
      queryClient.invalidateQueries({ queryKey: ["profitAnalytics"] });
    },
  });
};

/**
 * Hook to delete a revenue entry.
 */
export const useDeleteRevenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => service.deleteRevenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      queryClient.invalidateQueries({ queryKey: ["profitAnalytics"] });
    },
  });
};
