export interface RevenueItem {
  revenueId: number;
  type: string; // Sale, Booking, Rental, Service, Collection, Subscription, Partner Commission, Other
  description: string;
  amount: number;
  date: string; // ISO string e.g. "2026-07-23T12:00:00"
  isSystem: boolean; // System entries like Collection, Subscription, Partner Commission
  channelPartnerId?: number | string | null;
}

export interface RevenueSummary {
  totalEntries: number;
  totalRevenue: number;
  salesAndBookings: number;
  collections: number;
}

export interface RevenueListData {
  items: RevenueItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  summary: RevenueSummary;
}

export interface CreateRevenueRequest {
  type: string;
  description: string;
  amount: number;
  date?: string;
}

export interface UpdateRevenueRequest {
  revenueId: number;
  type: string;
  description: string;
  amount: number;
  date?: string;
}
