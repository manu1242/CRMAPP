export interface Quoatations {
    quotationId: number;
    quotationNumber: string;
    leadId: number;
    leadName: string;
    propertyId: number;
    propertyName: string;
    floorId: number;
    flatId: number;
    flatNumber: string;
    quotationDate: string;
    validUntil: string;
    basePrice: number;
    totalAmount: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
    status: string;
    notes: string;
    createdBy: number;
    createdOn: string;
    modifiedOn: string | null;
    channelPartnerId: number | null;
    encodedId: string;
}

export interface QuotationItem {
  itemId: number;
  quotationId: number;
  itemType: string;
  description: string;
  amount: number;
  quantity: number;
  total: number;
}

export interface QuotationDetail extends Quoatations {
  items: QuotationItem[];
}

export interface QuotationItemCreateData {
  itemType: string;
  description: string;
  amount: number;
  quantity: number;
  total: number;
}

export interface QuotationCreateData {
  leadId: number;
  propertyId: number;
  floorId?: number | null;
  flatId?: number | null;
  validUntil?: string | null;
  basePrice: number;
  discountAmount: number;
  notes?: string | null;
  items: QuotationItemCreateData[];
}

export interface QuotationUpdateData extends QuotationCreateData {
  changeReason?: string | null;
}

export interface QuotationTemplate {
  templateId: number;
  templateName: string;
  description?: string;
  itemsJson?: string;
  termsAndConditions?: string;
  discountPercentage: number;
  taxPercentage: number;
  validityDays: number;
  isActive: boolean;
  createdOn: string;
  createdBy?: number;
  modifiedOn?: string | null;
}

export interface QuotationTemplateCreateData {
  templateName: string;
  description?: string;
  itemsJson?: string;
  termsAndConditions?: string;
  discountPercentage: number;
  taxPercentage: number;
  validityDays: number;
  isActive: boolean;
}

export interface QuotationVersion {
  versionId: number;
  quotationId: number;
  versionNumber: number;
  totalAmount: number;
  itemsJson: string;
  notesJson: string;
  changeReason?: string;
  createdOn: string;
  createdBy?: number;
}

export interface PropertyFloor {
  floorId: number;
  floorNumber: string;
  floorName: string;
}

export interface PropertyFlat {
  flatId: number;
  flatName: string;
  bhk: string;
  area: string;
  floorNumber: string;
  price: number;
  status: string;
}

// Pagination Data
export interface QuotationListData {
  items: Quoatations[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Generic API Response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Quotation Approval Types
export interface QuotationApprovalSendResponse {
  approvalId: number;
  token: string;
  expiresOn: string;
  clientPortalUrl: string;
}

export interface QuotationApprovalRespondData {
  action: 'Approve' | 'Reject' | string;
  comments?: string | null;
  signatureBase64?: string | null;
}