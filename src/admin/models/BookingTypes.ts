export interface BookingItem {
  bookingId: number;
  bookingNumber: string;
  leadId: number;
  leadName: string;
  propertyId: number;
  propertyName: string;
  flatId: number;
  flatNumber: string;
  bookingDate: string;
  bookingAmount: number;
  totalAmount: number;
  totalCommitment: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentType: string;
  status: string;
}

export interface PaymentPlan {
  planId: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  planType: string;
  planStructure: string;
}

export interface Installment {
  installmentId: number;
  installmentNumber: number;
  milestoneName: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  paidDate: string | null;
}

export interface BookingDocument {
  documentId: number;
  documentType: string;
  documentName: string;
  filePath: string;
  uploadedOn: string;
}

export interface BookingDetail extends BookingItem {
  leadEmail: string;
  Contact: string;
  quotationId: number | null;
  quotationNumber: string | null;
  agreementDate: string | null;
  agreementPath: string | null;
  possessionDate: string | null;
  notes: string | null;
  createdBy: number;
  createdOn: string;
  modifiedOn: string | null;
  paymentPlan: PaymentPlan | null;
  installments: Installment[] | null;
  documents: BookingDocument[] | null;
}

export interface BookingCreateData {
  quotationId: number;
  bookingAmount: number;
  paymentType: string;
  agreementDate?: string | null;
  possessionDate?: string | null;
  notes?: string | null;
  documents?: {
    documentType: string;
    documentName: string;
    filePath: string;
  }[];
}

export interface BookingListData {
  items: BookingItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
