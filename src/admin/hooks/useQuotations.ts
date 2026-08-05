import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as service from "../services/QuoatationService";
import { 
  QuotationCreateData, 
  QuotationUpdateData,
  QuotationTemplateCreateData,
  QuotationApprovalRespondData
} from "../models/QuoatationTypes";

// ─── Stale / GC times ────────────────────────────────────────────────────────
// Quotations — moderately dynamic, refresh after 3 min.
// Templates change rarely — cache aggressively.
const QUOTATIONS_STALE_MS  = 3 * 60 * 1000;   // 3 minutes
const QUOTATIONS_GC_MS     = 8 * 60 * 1000;   // 8 minutes
const QUOTATION_STALE_MS   = 5 * 60 * 1000;
const QUOTATION_GC_MS      = 12 * 60 * 1000;
const TEMPLATES_STALE_MS   = 15 * 60 * 1000;  // 15 minutes — rarely changed
const TEMPLATES_GC_MS      = 30 * 60 * 1000;

export const useQuotations = (page: number = 1, pageSize: number = 10, status?: string, search?: string) => {
  return useQuery({
    queryKey: ["quotations", page, pageSize, status, search],
    queryFn: () => service.getQuotations(page, pageSize, status, search),
    staleTime: QUOTATIONS_STALE_MS,
    gcTime: QUOTATIONS_GC_MS,
    placeholderData: keepPreviousData,
  });
};

export const useQuotationDetail = (id: number) => {
  return useQuery({
    queryKey: ["quotation", id],
    queryFn: () => service.getQuotationById(id),
    enabled: !!id && id > 0,
    staleTime: QUOTATION_STALE_MS,
    gcTime: QUOTATION_GC_MS,
  });
};

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: QuotationCreateData) => service.createQuotation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
};

export const useUpdateQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: QuotationUpdateData }) => 
      service.updateQuotation(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["quotation-versions", variables.id] });
    },
  });
};

export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => service.deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
};

export const useUpdateQuotationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      service.updateQuotationStatus(id, status),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", variables.id] });
    },
  });
};

export const usePropertyFloors = (propertyId: number) => {
  return useQuery({
    queryKey: ["property-floors", propertyId],
    queryFn: () => service.getPropertyFloors(propertyId),
    enabled: !!propertyId && propertyId > 0,
    // Property floor data is static — cache for a long time
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const usePropertyFlats = (
  propertyId: number, 
  floorNumber?: string, 
  selectedFlatId?: number
) => {
  return useQuery({
    queryKey: ["property-flats", propertyId, floorNumber, selectedFlatId],
    queryFn: () => service.getPropertyFlats(propertyId, floorNumber, selectedFlatId),
    enabled: !!propertyId && propertyId > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

export const useQuotationTemplates = () => {
  return useQuery({
    queryKey: ["quotation-templates"],
    queryFn: () => service.getQuotationTemplates(),
    staleTime: TEMPLATES_STALE_MS,
    gcTime: TEMPLATES_GC_MS,
  });
};

export const useQuotationTemplateDetail = (id: number) => {
  return useQuery({
    queryKey: ["quotation-template", id],
    queryFn: () => service.getQuotationTemplateById(id),
    enabled: !!id && id > 0,
    staleTime: TEMPLATES_STALE_MS,
    gcTime: TEMPLATES_GC_MS,
  });
};

export const useCreateQuotationTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: QuotationTemplateCreateData) => service.createQuotationTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-templates"] });
    },
  });
};

export const useQuotationVersions = (id: number) => {
  return useQuery({
    queryKey: ["quotation-versions", id],
    queryFn: () => service.getQuotationVersions(id),
    enabled: !!id && id > 0,
    staleTime: QUOTATION_STALE_MS,
    gcTime: QUOTATION_GC_MS,
  });
};

export const useSendQuotationApproval = () => {
  return useMutation({
    mutationFn: ({ id, clientEmail, validityDays }: { id: number; clientEmail: string; validityDays: number }) => 
      service.sendQuotationApproval(id, { clientEmail, validityDays }),
  });
};

export const useRespondQuotationApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, data }: { token: string; data: QuotationApprovalRespondData }) => 
      service.respondToQuotationApproval(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
};