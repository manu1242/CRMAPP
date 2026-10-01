export interface OwnerSubscriptionItem {
  subscriptionId: number;
  ownerPhone: string;
  isActive: boolean;
  startDate: string;
  expiryDate: string;
  razorpayPaymentId?: string | null;
  amountPaid: number;
  createdOn?: string;
  status?: string;
  notes?: string | null;
}

export interface OwnerSubscriptionsPaginatedData {
  items: OwnerSubscriptionItem[];
  page: number;
  pageSize: number;
  totalRecords: number;
}

export interface AssignOwnerSubscriptionRequest {
  ownerPhone: string;
  months: number;
  amountPaid: number;
  notes?: string;
}

export interface OwnerSubscriptionApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface OwnerSubscriptionsFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'active' | 'expired' | 'all' | string;
}
