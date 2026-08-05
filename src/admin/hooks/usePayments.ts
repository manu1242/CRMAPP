import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as service from "../services/PaymentService";
import { RecordPaymentRequest } from "../models/PaymentTypes";

// ─── Stale / GC times ────────────────────────────────────────────────────────
// Payments are financial records — refresh after 2 min for accuracy.
// Detail/receipt views kept longer in cache for navigation.
const PAYMENTS_STALE_MS = 2 * 60 * 1000;  // 2 minutes
const PAYMENTS_GC_MS    = 8 * 60 * 1000;  // 8 minutes
const PAYMENT_STALE_MS  = 5 * 60 * 1000;
const PAYMENT_GC_MS     = 15 * 60 * 1000;

/**
 * Hook to retrieve payments list with filters.
 * keepPreviousData ensures smooth pagination transitions.
 */
export const usePayments = (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  fromDate?: string,
  toDate?: string
) => {
  return useQuery({
    queryKey: ["payments", page, pageSize, search, fromDate, toDate],
    queryFn: () => service.getPayments(page, pageSize, search, fromDate, toDate),
    staleTime: PAYMENTS_STALE_MS,
    gcTime: PAYMENTS_GC_MS,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to record a new payment.
 */
export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordPaymentRequest) => service.recordPayment(data),
    onSuccess: () => {
      // Invalidate related lists & details to ensure real-time balance updates
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
  });
};

/**
 * Hook to fetch single payment details.
 */
export const usePaymentDetails = (id: number | string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["paymentDetails", id],
    queryFn: () => service.getPaymentDetails(id),
    enabled: !!id && enabled,
    staleTime: PAYMENT_STALE_MS,
    gcTime: PAYMENT_GC_MS,
  });
};

/**
 * Hook to fetch payment receipt details.
 */
export const usePaymentReceipt = (id: number | string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["paymentReceipt", id],
    queryFn: () => service.getPaymentReceipt(id),
    enabled: !!id && enabled,
    staleTime: PAYMENT_STALE_MS,
    gcTime: PAYMENT_GC_MS,
  });
};

/**
 * Hook to fetch linked invoice details.
 */
export const useLinkedInvoice = (id: number | string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["paymentInvoice", id],
    queryFn: () => service.getLinkedInvoice(id),
    enabled: !!id && enabled,
    staleTime: PAYMENT_STALE_MS,
    gcTime: PAYMENT_GC_MS,
  });
};

/**
 * Hook to delete a payment record.
 */
export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => service.deletePayment(id),
    onSuccess: () => {
      // Invalidate related cache keys
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
  });
};
