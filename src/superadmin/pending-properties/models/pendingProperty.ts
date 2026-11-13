export interface PropertyOwnerInfo {
  ownerId: number;
  fullName: string;
  phone: string;
  userType?: string;
  isVerified?: boolean;
}

export interface PendingPropertyItem {
  propertyId: number;
  ownerId: number;
  listingCategory: 'Rent' | 'Sell' | string;
  propertyType: 'Apartment' | 'Villa' | 'Plot' | 'Commercial' | string;
  propertyName: string;
  location: string;
  city: string;
  price: number;
  areaSqft: number;
  bhk?: string | null;
  description?: string | null;
  imagePath?: string | null;
  propertyStatus: 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | string;
  rejectReason?: string | null;
  createdOn: string;
  owner?: PropertyOwnerInfo | null;
}

export interface PendingPropertiesStats {
  totalPending: number;
  totalActive: number;
  totalRejected: number;
  totalProperties: number;
  todaySubmitted: number;
}

export interface PendingPropertiesFilterParams {
  page?: number;
  pageSize?: number;
  status?: 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'ALL' | string;
  search?: string;
  category?: 'Rent' | 'Sell' | 'ALL' | string;
  propertyType?: string;
}

export interface PendingPropertiesPaginatedData {
  items: PendingPropertyItem[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PendingPropertyApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

