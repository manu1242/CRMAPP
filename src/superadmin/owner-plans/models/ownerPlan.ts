export interface OwnerPlan {
  planId: number;
  planName: string;
  price: number;
  validityDays: number;
  maxLeadsUnlock: number; // positive number for limits, or -1 for unlimited
  description?: string;
  isActive: boolean;
}

export interface CreateOwnerPlanRequest {
  planName: string;
  price: number;
  validityDays: number;
  maxLeadsUnlock: number;
  description?: string;
  isActive: boolean;
}

export interface UpdateOwnerPlanRequest {
  planName: string;
  price: number;
  validityDays: number;
  maxLeadsUnlock: number;
  description?: string;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
