import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { 
  ApiResponse 
} from '../models/QuoatationTypes';
import {
  BookingListData,
  BookingDetail,
  BookingCreateData
} from '../models/BookingTypes';

/**
 * Get Bookings list with pagination, status and search filters
 */
export async function getBookings(
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  search?: string
): Promise<ApiResponse<BookingListData>> {
  try {
    const url = `${API_ENDPOINTS.BOOKINGS.BASE}?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`;
    const response = await apiClient.get<ApiResponse<BookingListData>>(url);
    return response;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

/**
 * Get detailed view of a booking by ID
 */
export async function getBookingById(id: number): Promise<ApiResponse<BookingDetail>> {
  try {
    const response = await apiClient.get<ApiResponse<BookingDetail>>(API_ENDPOINTS.BOOKINGS.BY_ID(id));
    return response;
  } catch (error) {
    console.error(`Error fetching booking detail for ID ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new property booking
 */
export async function createBooking(bookingData: BookingCreateData): Promise<ApiResponse<BookingDetail>> {
  try {
    const response = await apiClient.post<ApiResponse<BookingDetail>>(
      API_ENDPOINTS.BOOKINGS.BASE,
      bookingData
    );
    return response;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Cancel an active booking
 */
export async function cancelBooking(id: number): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.BOOKINGS.CANCEL(id),
      {}
    );
    return response;
  } catch (error) {
    console.error(`Error cancelling booking for ID ${id}:`, error);
    throw error;
  }
}

/**
 * Upload booking document file
 */
export async function uploadBookingFile(formData: FormData): Promise<ApiResponse<{
  fileName: string;
  storedName: string;
  urlPath: string;
  fileSize: number;
  contentType: string;
}>> {
  try {
    const response = await apiClient.postForm<ApiResponse<{
      fileName: string;
      storedName: string;
      urlPath: string;
      fileSize: number;
      contentType: string;
    }>>(`${API_ENDPOINTS.FILES.UPLOAD}?folderName=bookings`, formData);
    return response;
  } catch (error) {
    console.error('Error uploading booking file:', error);
    throw error;
  }
}
