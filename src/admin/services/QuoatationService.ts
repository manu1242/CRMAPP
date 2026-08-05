import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { 
  ApiResponse, 
  QuotationListData, 
  Quoatations,
  QuotationDetail,
  QuotationCreateData,
  QuotationUpdateData,
  QuotationTemplate,
  QuotationTemplateCreateData,
  QuotationVersion,
  PropertyFloor,
  PropertyFlat,
  QuotationApprovalSendResponse,
  QuotationApprovalRespondData
} from '../models/QuoatationTypes';

/**
 * Get Quotations with pagination, status and search
 */
export async function getQuotations(
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  search?: string
): Promise<ApiResponse<QuotationListData>> {
  try {
    const url = `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`;
    const response = await apiClient.get<ApiResponse<QuotationListData>>(url);
    return response;
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }
}

/**
 * Get quotation by ID (including items)
 */
export async function getQuotationById(id: number): Promise<ApiResponse<QuotationDetail>> {
  try {
    const response = await apiClient.get<ApiResponse<QuotationDetail>>(`${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/${id}`);
    return response;
  } catch (error) {
    console.error(`Error fetching quotation ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new quotation
 */
export async function createQuotation(quotationData: QuotationCreateData): Promise<ApiResponse<{ quotationId: number; quotationNumber: string; encodedId: string }>> {
  try {
    const response = await apiClient.post<ApiResponse<{ quotationId: number; quotationNumber: string; encodedId: string }>>(
      `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}`,
      quotationData
    );
    return response;
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
}

/**
 * Update quotation
 */
export async function updateQuotation(id: number, quotationData: QuotationUpdateData): Promise<ApiResponse<{ quotationId: number; version: number }>> {
  try {
    const response = await apiClient.put<ApiResponse<{ quotationId: number; version: number }>>(
      `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/${id}`,
      quotationData
    );
    return response;
  } catch (error) {
    console.error(`Error updating quotation ${id}:`, error);
    throw error;
  }
}

/**
 * Delete quotation (soft delete/remove)
 */
export async function deleteQuotation(id: number): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(`${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/${id}`);
    return response;
  } catch (error) {
    console.error(`Error deleting quotation ${id}:`, error);
    throw error;
  }
}

/**
 * Update quotation status
 */
export async function updateQuotationStatus(id: number, status: string): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.post<ApiResponse<void>>(
      `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/${id}/status`,
      { status }
    );
    return response;
  } catch (error) {
    console.error(`Error updating status for quotation ${id}:`, error);
    throw error;
  }
}

/**
 * Get Property Floors
 */
export async function getPropertyFloors(propertyId: number): Promise<ApiResponse<PropertyFloor[]>> {
  try {
    const response = await apiClient.get<ApiResponse<PropertyFloor[]>>(
      `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/property/${propertyId}/floors`
    );
    return response;
  } catch (error) {
    console.error(`Error fetching floors for property ${propertyId}:`, error);
    throw error;
  }
}

/**
 * Get Property Flats
 */
export async function getPropertyFlats(
  propertyId: number,
  floorNumber?: string,
  selectedFlatId?: number
): Promise<ApiResponse<PropertyFlat[]>> {
  try {
    const url = `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/property/${propertyId}/flats?` +
      [
        floorNumber ? `floorNumber=${encodeURIComponent(floorNumber)}` : '',
        selectedFlatId ? `selectedFlatId=${selectedFlatId}` : ''
      ].filter(Boolean).join('&');
    const response = await apiClient.get<ApiResponse<PropertyFlat[]>>(url);
    return response;
  } catch (error) {
    console.error(`Error fetching flats for property ${propertyId}:`, error);
    throw error;
  }
}

/**
 * Get Quotation Templates
 */
export async function getQuotationTemplates(): Promise<ApiResponse<QuotationTemplate[]>> {
  try {
    const response = await apiClient.get<ApiResponse<QuotationTemplate[]>>(
      `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/templates`
    );
    return response;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

/**
 * Get Template by ID
 */
export async function getQuotationTemplateById(id: number): Promise<ApiResponse<QuotationTemplate>> {
  try {
    const response = await apiClient.get<ApiResponse<QuotationTemplate>>(
      `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/templates/${id}`
    );
    return response;
  } catch (error) {
    console.error(`Error fetching template ${id}:`, error);
    throw error;
  }
}

/**
 * Create Quotation Template
 */
export async function createQuotationTemplate(templateData: QuotationTemplateCreateData): Promise<ApiResponse<{ templateId: number }>> {
  try {
    const response = await apiClient.post<ApiResponse<{ templateId: number }>>(
      `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/templates`,
      templateData
    );
    return response;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

/**
 * Get Quotation Version History
 */
export async function getQuotationVersions(id: number): Promise<ApiResponse<QuotationVersion[]>> {
  try {
    const response = await apiClient.get<ApiResponse<QuotationVersion[]>>(
      `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/${id}/versions`
    );
    return response;
  } catch (error) {
    console.error(`Error fetching versions for quotation ${id}:`, error);
    throw error;
  }
}

/**
 * Send Quotation Approval Request
 */
export async function sendQuotationApproval(
  id: number,
  approvalData: { clientEmail: string; validityDays: number }
): Promise<ApiResponse<QuotationApprovalSendResponse>> {
  try {
    const response = await apiClient.post<ApiResponse<QuotationApprovalSendResponse>>(
      `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/${id}/approval/send`,
      approvalData
    );
    return response;
  } catch (error) {
    console.error(`Error sending approval for quotation ${id}:`, error);
    throw error;
  }
}

/**
 * Respond to Quotation Approval Request
 */
export async function respondToQuotationApproval(
  token: string,
  respondData: QuotationApprovalRespondData
): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.post<ApiResponse<void>>(
      `${API_ENDPOINTS.QUOTATIONS.GET_QUOATATIONS}/approval/${token}/respond`,
      respondData
    );
    return response;
  } catch (error) {
    console.error(`Error responding to approval for token ${token}:`, error);
    throw error;
  }
}
