import { apiClient } from '../../api/apiClient';
import { ApiResponse } from '../models/QuoatationTypes';
import {
  RevenueItem,
  CreateRevenueRequest,
  UpdateRevenueRequest
} from '../models/RevenueTypes';

/**
 * Get all revenues from the backend page (both manually added and system-generated items)
 * Parses the backend HTML responses dynamically using regular expressions
 */
export async function getRevenues(): Promise<ApiResponse<RevenueItem[]>> {
  try {
    // Fetch the raw HTML page
    const html = await apiClient.get<string>('/revenue');
    const items: RevenueItem[] = [];

    // Split the HTML content by the row elements to isolate each record's data
    const segments = html.split(/<div\s+class="rv-row\s+paginated-item"/g);

    // Skip the first segment as it precedes the first record row
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];

      const typeMatch = segment.match(/data-type="([^"]*)"/);
      const dateMatch = segment.match(/data-date="([^"]*)"/);
      const amountMatch = segment.match(/data-amount="([^"]*)"/);
      const descMatch = segment.match(/data-desc="([^"]*)"/);
      
      // Look for the edit or delete parameters containing the revenue entry ID
      const idMatch = segment.match(/editRevenue\((\d+)\)/) || segment.match(/deleteRevenue\((\d+)\)/);

      const type = typeMatch ? typeMatch[1] : '';
      const date = dateMatch ? dateMatch[1] : '';
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      const description = descMatch ? descMatch[1] : '';
      const revenueId = idMatch ? parseInt(idMatch[1], 10) : 0;

      if (type) {
        items.push({
          revenueId,
          type,
          description,
          amount,
          date,
          isSystem: revenueId === 0
        });
      }
    }

    // Fallback parser: if split parsing didn't find any items, parse directly from script tag data
    if (items.length === 0) {
      const jsMatch = html.match(/var\s+allRevenueData\s*=\s*(\[[\s\S]*?\])\s*;/);
      if (jsMatch && jsMatch[1]) {
        try {
          const rawData = JSON.parse(jsMatch[1]);
          if (Array.isArray(rawData)) {
            rawData.forEach((r: any) => {
              items.push({
                revenueId: 0,
                type: r.Type || r.type || 'Other',
                description: r.Description || r.description || '',
                amount: r.Amount || r.amount || 0,
                date: r.Date || r.date || '',
                dateFormatted: r.DateFormatted || r.dateFormatted || '',
                isSystem: true
              });
            });
          }
        } catch (parseError) {
          console.error('Error parsing allRevenueData fallback:', parseError);
        }
      }
    }

    return {
      success: true,
      message: 'Revenues fetched successfully',
      data: items
    };
  } catch (error) {
    console.error('Error fetching revenues:', error);
    throw error;
  }
}

/**
 * Record a new manual revenue entry
 */
export async function createRevenue(
  data: CreateRevenueRequest
): Promise<ApiResponse<any>> {
  try {
    const formData = new FormData();
    formData.append('Type', data.type);
    formData.append('Description', data.description);
    formData.append('Amount', data.amount.toString());

    const response = await apiClient.postForm<ApiResponse<any>>(
      '/Revenue/CreateModal',
      formData
    );
    return response;
  } catch (error) {
    console.error('Error recording revenue:', error);
    throw error;
  }
}

/**
 * Get details of a single revenue record by ID
 */
export async function getRevenueDetails(
  id: number
): Promise<ApiResponse<RevenueItem>> {
  try {
    const response = await apiClient.get<ApiResponse<RevenueItem>>(
      `/Revenue/GetRevenue/${id}`
    );
    return response;
  } catch (error) {
    console.error(`Error fetching revenue details for ID ${id}:`, error);
    throw error;
  }
}

/**
 * Update an existing manual revenue entry
 */
export async function updateRevenue(
  data: UpdateRevenueRequest
): Promise<ApiResponse<any>> {
  try {
    const formData = new FormData();
    formData.append('RevenueId', data.revenueId.toString());
    formData.append('Type', data.type);
    formData.append('Description', data.description);
    formData.append('Amount', data.amount.toString());

    const response = await apiClient.postForm<ApiResponse<any>>(
      '/Revenue/EditModal',
      formData
    );
    return response;
  } catch (error) {
    console.error('Error updating revenue:', error);
    throw error;
  }
}

/**
 * Delete a revenue entry by ID
 */
export async function deleteRevenue(
  revenueId: number
): Promise<ApiResponse<any>> {
  try {
    const formData = new FormData();
    formData.append('revenueId', revenueId.toString());

    const response = await apiClient.postForm<ApiResponse<any>>(
      '/Revenue/DeleteRevenue',
      formData
    );
    return response;
  } catch (error) {
    console.error('Error deleting revenue:', error);
    throw error;
  }
}
