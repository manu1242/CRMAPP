import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { ApiResponse } from '../models/QuoatationTypes';
import {
  RevenueListData,
  RevenueItem,
  CreateRevenueRequest,
  UpdateRevenueRequest
} from '../models/RevenueTypes';

/**
 * Fallback to /api/v1/profit to ensure realized collections and system revenues 
 * are always dynamically available even across different backend deployment stages.
 */
async function fetchRevenuesFromProfit(
  page: number = 1,
  pageSize: number = 10,
  type?: string,
  search?: string,
  fromDate?: string,
  toDate?: string,
  sort?: string
): Promise<ApiResponse<RevenueListData>> {
  let profitUrl = '/api/v1/profit';
  const params: Record<string, string> = {};
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  const queryString = new URLSearchParams(params).toString();
  if (queryString) profitUrl += `?${queryString}`;

  const profitRes = await apiClient.get<ApiResponse<any>>(profitUrl);
  const rawRevenues = profitRes?.data?.revenues || [];

  let items: RevenueItem[] = rawRevenues.map((r: any) => {
    const isSys = r.revenueId === 0 || 
                  r.type === 'Collection' || 
                  r.type === 'Subscription' || 
                  r.type === 'Partner Commission' ||
                  (r.description || '').toLowerCase().includes('realized') ||
                  (r.description || '').toLowerCase().includes('auto-realized');
    return {
      revenueId: r.revenueId ?? 0,
      type: r.type || 'Other',
      description: r.description || '',
      amount: Number(r.amount || 0),
      date: r.date || new Date().toISOString(),
      isSystem: isSys,
      channelPartnerId: r.channelPartnerId ?? null,
    };
  });

  // Calculate full metrics
  const totalEntries = items.length;
  const totalRevenue = items.reduce((sum, item) => sum + item.amount, 0);
  const salesAndBookings = items.filter(i => 
    i.type.toLowerCase() === 'sale' || i.type.toLowerCase() === 'booking'
  ).length;
  const collections = items.filter(i => 
    i.type.toLowerCase() === 'collection' || i.description.toLowerCase().includes('realized')
  ).length;

  // Apply search filter
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(i => 
      i.description.toLowerCase().includes(s) || 
      i.type.toLowerCase().includes(s)
    );
  }

  // Apply type filter
  if (type && type !== 'All') {
    items = items.filter(i => i.type.toLowerCase() === type.toLowerCase());
  }

  // Apply sorting
  if (sort === 'oldest') {
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else if (sort === 'highest') {
    items.sort((a, b) => b.amount - a.amount);
  } else if (sort === 'lowest') {
    items.sort((a, b) => a.amount - b.amount);
  } else {
    // newest default
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

  return {
    success: true,
    message: 'Revenues retrieved successfully',
    data: {
      items: pagedItems,
      totalCount,
      pageNumber: page,
      pageSize,
      totalPages,
      summary: {
        totalEntries,
        totalRevenue,
        salesAndBookings,
        collections,
      },
    },
  };
}

/**
 * Get Revenues list with pagination, search, type, and date range filters
 */
export async function getRevenues(
  page: number = 1,
  pageSize: number = 10,
  type?: string,
  search?: string,
  fromDate?: string,
  toDate?: string,
  sort?: string
): Promise<ApiResponse<RevenueListData>> {
  try {
    let url = `${API_ENDPOINTS.REVENUE.BASE}?page=${page}&pageSize=${pageSize}`;
    if (type && type !== 'All') url += `&type=${encodeURIComponent(type)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;
    if (sort) url += `&sort=${encodeURIComponent(sort)}`;

    const response = await apiClient.get<ApiResponse<RevenueListData>>(url);

    // If response was successful and has items
    if (response?.success && response.data && Array.isArray(response.data.items)) {
      // Check if realized collections exist in the items or summary
      const hasCollection = response.data.items.some(
        i => i.type?.toLowerCase() === 'collection' || i.description?.toLowerCase().includes('realized')
      );

      // If realized collection already present in items, return response directly
      if (hasCollection) {
        return response;
      }

      // If no collection is present, check profit API to see if collections exist
      try {
        const profitFallback = await fetchRevenuesFromProfit(page, pageSize, type, search, fromDate, toDate, sort);
        const profitCollections = profitFallback.data.items.filter(
          i => i.type?.toLowerCase() === 'collection' || i.description?.toLowerCase().includes('realized')
        );

        if (profitCollections.length > 0) {
          // Merge profit collections into the revenue response
          const mergedItems = [...profitCollections, ...response.data.items];
          return {
            ...response,
            data: {
              ...response.data,
              items: mergedItems,
              totalCount: response.data.totalCount + profitCollections.length,
              summary: {
                ...response.data.summary,
                totalEntries: response.data.summary.totalEntries + profitCollections.length,
                totalRevenue: response.data.summary.totalRevenue + profitCollections.reduce((s, c) => s + c.amount, 0),
                collections: response.data.summary.collections + profitCollections.length,
              },
            },
          };
        }
      } catch (fallbackErr) {
        console.warn('Profit fallback check failed, returning base response:', fallbackErr);
      }

      return response;
    }

    // If items empty or missing, fallback to profit API
    return await fetchRevenuesFromProfit(page, pageSize, type, search, fromDate, toDate, sort);
  } catch (error) {
    console.warn('Revenue API error, falling back to Profit endpoint:', error);
    try {
      return await fetchRevenuesFromProfit(page, pageSize, type, search, fromDate, toDate, sort);
    } catch (profitErr) {
      console.error('Profit fallback also failed:', profitErr);
      throw error;
    }
  }
}

/**
 * Record a new manual revenue entry
 */
export async function createRevenue(
  data: CreateRevenueRequest
): Promise<ApiResponse<RevenueItem>> {
  try {
    const response = await apiClient.post<ApiResponse<RevenueItem>>(
      API_ENDPOINTS.REVENUE.BASE,
      data
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
  id: number | string
): Promise<ApiResponse<RevenueItem>> {
  try {
    const response = await apiClient.get<ApiResponse<RevenueItem>>(
      API_ENDPOINTS.REVENUE.BY_ID(id)
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
): Promise<ApiResponse<RevenueItem>> {
  try {
    const response = await apiClient.put<ApiResponse<RevenueItem>>(
      API_ENDPOINTS.REVENUE.BY_ID(data.revenueId),
      data
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
  revenueId: number | string
): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.delete<ApiResponse<any>>(
      API_ENDPOINTS.REVENUE.BY_ID(revenueId)
    );
    return response;
  } catch (error) {
    console.error('Error deleting revenue:', error);
    throw error;
  }
}
