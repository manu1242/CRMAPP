export interface PaymentItem {
  paymentId: number;
  receiptNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  bookingId: number;
  bookingNumber: string;
  leadName: string;
  leadContact?: string | null;
  leadEmail?: string | null;
  propertyName: string;
  flatName: string;
  installmentId?: number | null;
  milestoneName?: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string | null;
  bankName?: string | null;
  chequeNumber?: string | null;
  chequeDate?: string | null;
  notes?: string | null;
  receivedBy: number;
  receivedByName: string;
  createdOn: string;
}

export interface PaymentSummary {
  totalPayments: number;
  totalReceived: number;
  thisMonthCount: number;
  monthRevenue: number;
}

export interface PaymentListData {
  items: PaymentItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  summary: PaymentSummary;
}

export interface RecordPaymentRequest {
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionReference?: string | null;
  bankName?: string | null;
  chequeNumber?: string | null;
  chequeDate?: string | null;
  notes?: string | null;
}

export interface BankAccount {
  id: number;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  accountType: string;
}

export interface CompanyDetails {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyGST: string;
  bankAccount: BankAccount;
}

export interface PaymentReceiptData {
  payment: PaymentItem;
  company: CompanyDetails;
}
