import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "../services/InvoiceService";
import { InvoiceGenerateInput } from "../models/InvoiceTypes";
import { RecordPaymentRequest } from "../models/PaymentTypes";

/**
 * Hook to retrieve invoices list with filters
 */
export const useInvoices = (
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  search?: string
) => {
  return useQuery({
    queryKey: ["invoices", page, pageSize, status, search],
    queryFn: () => service.getInvoices(page, pageSize, status, search),
  });
};

/**
 * Hook to fetch a single invoice by ID
 */
export const useInvoiceDetail = (invoiceId: number) => {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => service.getInvoiceById(invoiceId),
    enabled: !!invoiceId && invoiceId > 0,
  });
};

/**
 * Hook to delete an invoice by ID
 */
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => service.deleteInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

/**
 * Hook to generate a new invoice
 */
export const useGenerateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InvoiceGenerateInput) => service.generateInvoice(data),
    onSuccess: () => {
      // Invalidate queries to refresh the list view
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      // Invalidate bookings/booking details as well, since creating an invoice impacts outstanding balances
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
  });
};

/**
 * Hook to send invoice notifications via WhatsApp/Email
 */
export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, sendWhatsApp, sendEmail }: { invoiceId: number; sendWhatsApp: boolean; sendEmail: boolean }) =>
      service.sendInvoice(invoiceId, sendWhatsApp, sendEmail),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.invoiceId] });
    },
  });
};

/**
 * Hook to record payment against an invoice
 */
export const useRecordInvoicePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, paymentData }: { invoiceId: number; paymentData: Omit<RecordPaymentRequest, 'invoiceId'> }) =>
      service.recordInvoicePayment(invoiceId, paymentData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
  });
};

