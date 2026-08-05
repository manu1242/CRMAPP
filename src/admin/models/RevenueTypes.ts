export interface RevenueItem {
  revenueId: number;
  type: string; // Sale, Booking, Rental, Service, Collection, Subscription, Partner Commission, Other
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  dateFormatted?: string;
  isSystem: boolean; // System entries like Collection, Subscription, Partner Commission
}

export interface CreateRevenueRequest {
  type: string;
  description: string;
  amount: number;
}

export interface UpdateRevenueRequest {
  revenueId: number;
  type: string;
  description: string;
  amount: number;
}
