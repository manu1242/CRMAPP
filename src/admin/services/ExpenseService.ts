import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { ApiResponse } from '../models/QuoatationTypes';
import {
  ExpenseListData,
  ExpenseItem,
  CreateExpenseRequest,
  UpdateExpenseRequest
} from '../models/ExpenseTypes';

/**
 * Get Expenses list with pagination, search, category, and date range filters
 */
export async function getExpenses(
  page: number = 1,
  pageSize: number = 10,
  type?: string,
  search?: string,
  fromDate?: string,
  toDate?: string
): Promise<ApiResponse<ExpenseListData>> {
  try {
    let url = `${API_ENDPOINTS.EXPENSES.BASE}?page=${page}&pageSize=${pageSize}`;
    if (type && type !== 'All') url += `&type=${encodeURIComponent(type)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;

    const response = await apiClient.get<ApiResponse<ExpenseListData>>(url);
    return response;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
}

/**
 * Record a new expense
 */
export async function recordExpense(
  expenseData: CreateExpenseRequest
): Promise<ApiResponse<ExpenseItem>> {
  try {
    const response = await apiClient.post<ApiResponse<ExpenseItem>>(
      API_ENDPOINTS.EXPENSES.BASE,
      expenseData
    );
    return response;
  } catch (error) {
    console.error('Error recording expense:', error);
    throw error;
  }
}

/**
 * Get details of a single expense record by ID
 */
export async function getExpenseDetails(
  id: number | string
): Promise<ApiResponse<ExpenseItem>> {
  try {
    const response = await apiClient.get<ApiResponse<ExpenseItem>>(
      API_ENDPOINTS.EXPENSES.BY_ID(id)
    );
    return response;
  } catch (error) {
    console.error(`Error fetching details for expense ${id}:`, error);
    throw error;
  }
}

/**
 * Update an existing expense record by ID
 */
export async function updateExpense(
  id: number | string,
  expenseData: UpdateExpenseRequest
): Promise<ApiResponse<ExpenseItem>> {
  try {
    const response = await apiClient.put<ApiResponse<ExpenseItem>>(
      API_ENDPOINTS.EXPENSES.BY_ID(id),
      expenseData
    );
    return response;
  } catch (error) {
    console.error(`Error updating expense ${id}:`, error);
    throw error;
  }
}

/**
 * Delete an expense record by ID
 */
export async function deleteExpense(
  id: number | string
): Promise<ApiResponse<any>> {
  try {
    const response = await apiClient.delete<ApiResponse<any>>(
      API_ENDPOINTS.EXPENSES.BY_ID(id)
    );
    return response;
  } catch (error) {
    console.error(`Error deleting expense ${id}:`, error);
    throw error;
  }
}
