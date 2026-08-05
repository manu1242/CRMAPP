import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "../services/InvoiceService";
import { InvoiceGenerateInput } from "../models/InvoiceTypes";

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
