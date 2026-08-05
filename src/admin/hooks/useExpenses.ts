import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as service from "../services/ExpenseService";
import { CreateExpenseRequest, UpdateExpenseRequest } from "../models/ExpenseTypes";

// ─── Stale / GC times ────────────────────────────────────────────────────────
// Expenses list — 3 min stale (may be updated by other users), 8 min gc.
// Detail views kept longer since they're opened for review before editing.
const EXPENSES_STALE_MS = 3 * 60 * 1000;  // 3 minutes
const EXPENSES_GC_MS    = 8 * 60 * 1000;  // 8 minutes
const EXPENSE_STALE_MS  = 5 * 60 * 1000;
const EXPENSE_GC_MS     = 12 * 60 * 1000;

/**
 * Hook to fetch expenses list with pagination, search, category, and date range filters.
 * keepPreviousData ensures smooth pagination — old data shows while next page loads.
 */
export const useExpenses = (
  page: number = 1,
  pageSize: number = 10,
  type?: string,
  search?: string,
  fromDate?: string,
  toDate?: string
) => {
  return useQuery({
    queryKey: ["expenses", page, pageSize, type, search, fromDate, toDate],
    queryFn: () => service.getExpenses(page, pageSize, type, search, fromDate, toDate),
    staleTime: EXPENSES_STALE_MS,
    gcTime: EXPENSES_GC_MS,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to retrieve detailed info for a single expense record.
 */
export const useExpenseDetails = (id: number | string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["expenseDetails", id],
    queryFn: () => service.getExpenseDetails(id),
    enabled: !!id && enabled,
    staleTime: EXPENSE_STALE_MS,
    gcTime: EXPENSE_GC_MS,
  });
};

/**
 * Hook to record a new expense record.
 */
export const useRecordExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => service.recordExpense(data),
    onSuccess: () => {
      // Invalidate the list of expenses so the list refreshes immediately
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};

/**
 * Hook to update an existing expense record by ID.
 */
export const useUpdateExpense = (id: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateExpenseRequest) => service.updateExpense(id, data),
    onSuccess: () => {
      // Invalidate both lists and specific record cache key
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseDetails", id] });
    },
  });
};

/**
 * Hook to delete an expense record by ID.
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => service.deleteExpense(id),
    onSuccess: () => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
};
