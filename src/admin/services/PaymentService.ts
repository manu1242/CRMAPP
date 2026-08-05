import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { ApiResponse } from '../models/QuoatationTypes';
import {
  PaymentListData,
  PaymentItem,
  RecordPaymentRequest,
  PaymentReceiptData
} from '../models/PaymentTypes';
import { Invoice } from '../models/InvoiceTypes';

/**
 * Get Payments list with pagination, search, and date filters
 */
export async function getPayments(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  fromDate?: string,
  toDate?: string
): Promise<ApiResponse<PaymentListData>> {
  try {
    let url = `${API_ENDPOINTS.PAYMENTS.BASE}?page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;
    
    const response = await apiClient.get<ApiResponse<PaymentListData>>(url);
    return response;
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
}

/**
 * Record a new payment
 */
export async function recordPayment(
  paymentData: RecordPaymentRequest
): Promise<ApiResponse<PaymentItem>> {
  try {
    const response = await apiClient.post<ApiResponse<PaymentItem>>(
      API_ENDPOINTS.PAYMENTS.BASE,
      paymentData
    );
    return response;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
}

/**
 * Get details of a single payment by ID
 */
export async function getPaymentDetails(
  id: number | string
): Promise<ApiResponse<PaymentItem>> {
  try {
    const response = await apiClient.get<ApiResponse<PaymentItem>>(
      API_ENDPOINTS.PAYMENTS.BY_ID(id)
    );
    return response;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
}

/**
 * Get payment receipt details by ID
 */
export async function getPaymentReceipt(
  id: number | string
): Promise<ApiResponse<PaymentReceiptData>> {
  try {
    const response = await apiClient.get<ApiResponse<PaymentReceiptData>>(
      API_ENDPOINTS.PAYMENTS.RECEIPT(id)
    );
    return response;
  } catch (error) {
    console.error('Error fetching payment receipt:', error);
    throw error;
  }
}

/**
 * Get linked invoice details by ID
 */
export async function getLinkedInvoice(
  id: number | string
): Promise<ApiResponse<Invoice>> {
  try {
    const response = await apiClient.get<ApiResponse<Invoice>>(
      API_ENDPOINTS.PAYMENTS.INVOICE(id)
    );
    return response;
  } catch (error) {
    console.error('Error fetching linked invoice:', error);
    throw error;
  }
}

/**
 * Delete a payment record by ID
 */
export async function deletePayment(
  id: number | string
): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.delete<ApiResponse<any>>(
      API_ENDPOINTS.PAYMENTS.BY_ID(id)
    );
    return response;
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
}
