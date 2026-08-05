import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface BankAccount {
  id?: number;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  accountType: string; // "Savings" | "Current" | etc.
  isActive: boolean;
  createdOn?: string;
  updatedOn?: string | null;
}

export interface BankAccountListResponse {
  success: boolean;
  message?: string;
  data: BankAccount[];
}

export interface BankAccountDetailResponse {
  success: boolean;
  message?: string;
  data: BankAccount;
}

export interface BankAccountSaveResponse {
  success: boolean;
  message: string;
  data?: BankAccount;
}

export interface BankAccountDeleteResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const bankAccountService = {
  /**
   * Get all bank accounts
   */
  getBankAccounts: async (): Promise<BankAccountListResponse> => {
    return await apiClient.get<BankAccountListResponse>(
      API_ENDPOINTS.BANK_ACCOUNT_API.LIST
    );
  },

  /**
   * Get detail of a specific bank account by ID
   */
  getBankAccountById: async (id: number | string): Promise<BankAccountDetailResponse> => {
    return await apiClient.get<BankAccountDetailResponse>(
      API_ENDPOINTS.BANK_ACCOUNT_API.GET_BY_ID(id)
    );
  },

  /**
   * Create or update a bank account
   */
  saveBankAccount: async (payload: BankAccount): Promise<BankAccountSaveResponse> => {
    return await apiClient.post<BankAccountSaveResponse>(
      API_ENDPOINTS.BANK_ACCOUNT_API.SAVE,
      payload
    );
  },

  /**
   * Delete a bank account
   */
  deleteBankAccount: async (id: number | string): Promise<BankAccountDeleteResponse> => {
    return await apiClient.delete<BankAccountDeleteResponse>(
      API_ENDPOINTS.BANK_ACCOUNT_API.DELETE(id)
    );
  },
};
