import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as service from "../services/BookingService";
import { BookingCreateData } from "../models/BookingTypes";

// ─── Stale / GC times ────────────────────────────────────────────────────────
// Bookings may change due to agent actions — refresh after 3 min.
// Detail views kept in cache for 8 min so navigating back is instant.
const BOOKINGS_STALE_MS = 3 * 60 * 1000;  // 3 minutes
const BOOKINGS_GC_MS    = 8 * 60 * 1000;  // 8 minutes
const BOOKING_STALE_MS  = 5 * 60 * 1000;
const BOOKING_GC_MS     = 10 * 60 * 1000;

/**
 * Hook to retrieve bookings list with filters.
 * keepPreviousData ensures smooth pagination — old data shows while next page loads.
 */
export const useBookings = (
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  search?: string
) => {
  return useQuery({
    queryKey: ["bookings", page, pageSize, status, search],
    queryFn: () => service.getBookings(page, pageSize, status, search),
    staleTime: BOOKINGS_STALE_MS,
    gcTime: BOOKINGS_GC_MS,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to retrieve booking details by ID.
 * Disabled when id is 0/falsy to prevent erroneous fetches.
 */
export const useBookingDetail = (id: number) => {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => service.getBookingById(id),
    enabled: !!id && id > 0,
    staleTime: BOOKING_STALE_MS,
    gcTime: BOOKING_GC_MS,
  });
};

/**
 * Hook to create a new booking.
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BookingCreateData) => service.createBooking(data),
    onSuccess: () => {
      // Invalidate queries to refresh the list view
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

/**
 * Hook to cancel an active booking.
 */
export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => service.cancelBooking(id),
    onSuccess: (res, id) => {
      // Invalidate details of this booking and the main list view
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
  });
};

/**
 * Hook to upload a file for booking attachment.
 */
export const useUploadBookingFile = () => {
  return useMutation({
    mutationFn: (formData: FormData) => service.uploadBookingFile(formData),
  });
};
