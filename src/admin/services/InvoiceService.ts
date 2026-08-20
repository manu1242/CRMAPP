import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { getApiUrl } from '../../api/remoteConfig';
import { ApiResponse } from '../models/QuoatationTypes';
import {
  InvoiceListData,
  Invoice,
  InvoiceGenerateInput
} from '../models/InvoiceTypes';
import { RecordPaymentRequest, PaymentItem } from '../models/PaymentTypes';

/**
 * Get Invoices list with pagination, status, and search filters
 */
export async function getInvoices(
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  search?: string
): Promise<ApiResponse<InvoiceListData>> {
  try {
    const url = `${API_ENDPOINTS.INVOICES.GET_INVOICE}?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
    const response = await apiClient.get<ApiResponse<InvoiceListData>>(url);
    return response;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}

/**
 * Get a single invoice by ID
 */
export async function getInvoiceById(
  invoiceId: number
): Promise<ApiResponse<Invoice>> {
  try {
    const response = await apiClient.get<ApiResponse<Invoice>>(
      API_ENDPOINTS.INVOICES.BY_ID(invoiceId)
    );
    return response;
  } catch (error) {
    console.error('Error fetching invoice detail:', error);
    throw error;
  }
}

/**
 * Delete an invoice by ID
 */
export async function deleteInvoice(
  invoiceId: number
): Promise<ApiResponse<null>> {
  try {
    const response = await apiClient.delete<ApiResponse<null>>(
      API_ENDPOINTS.INVOICES.DELETE(invoiceId)
    );
    return response;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
}

/**
 * Returns the full PDF download URL for opening in the browser.
 * Uses the live API base URL from remote config.
 */
export function getInvoicePdfUrl(invoiceId: number): string {
  const base = getApiUrl().replace(/\/$/, '');
  return `${base}${API_ENDPOINTS.INVOICES.DOWNLOAD_PDF(invoiceId)}`;
}

/**
 * Send an invoice to a customer via WhatsApp and/or Email
 */
export async function sendInvoice(
  invoiceId: number,
  sendWhatsApp: boolean = true,
  sendEmail: boolean = false
): Promise<ApiResponse<{ invoiceId: number; invoiceNumber: string; status: string; whatsAppSent: boolean; emailSent: boolean }>> {
  try {
    const url = API_ENDPOINTS.INVOICES.SEND(invoiceId, sendWhatsApp, sendEmail);
    const response = await apiClient.post<ApiResponse<any>>(url);
    return response;
  } catch (error) {
    console.error('Error sending invoice:', error);
    throw error;
  }
}

/**
 * Record a payment against a specific invoice
 */
export async function recordInvoicePayment(
  invoiceId: number,
  paymentData: Omit<RecordPaymentRequest, 'invoiceId'>
): Promise<ApiResponse<PaymentItem>> {
  try {
    const url = API_ENDPOINTS.INVOICES.RECORD_PAYMENT(invoiceId);
    const response = await apiClient.post<ApiResponse<PaymentItem>>(url, paymentData);
    return response;
  } catch (error) {
    console.error('Error recording invoice payment:', error);
    throw error;
  }
}

/**
 * Generate a new invoice (Milestone or custom/manual)
 */
export async function generateInvoice(
  invoiceData: InvoiceGenerateInput
): Promise<ApiResponse<Invoice>> {
  try {
    const response = await apiClient.post<ApiResponse<Invoice>>(
      API_ENDPOINTS.INVOICES.GENERATE,
      invoiceData
    );
    return response;
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
}


