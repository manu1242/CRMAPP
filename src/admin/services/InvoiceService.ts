import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { ApiResponse } from '../models/QuoatationTypes';
import {
  InvoiceListData,
  Invoice,
  InvoiceGenerateInput
} from '../models/InvoiceTypes';

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
