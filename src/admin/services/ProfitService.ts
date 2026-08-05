import { apiClient } from '../../api/apiClient';
import { ApiResponse } from '../models/QuoatationTypes';
import { ProfitAnalyticsData } from '../models/ProfitTypes';

/**
 * Fetch profit analytics data including net profit, revenues list, and expenses list.
 * Optionally filtered by fromDate and toDate.
 */
export async function getProfitAnalytics(
  fromDate?: string,
  toDate?: string
): Promise<ApiResponse<ProfitAnalyticsData>> {
  try {
    let url = '/api/v1/profit';
    const params: Record<string, string> = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    // Build URL query parameters
    const queryString = new URLSearchParams(params).toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await apiClient.get<ApiResponse<ProfitAnalyticsData>>(url);
    return response;
  } catch (error) {
    console.error('Error fetching profit analytics:', error);
    throw error;
  }
}
