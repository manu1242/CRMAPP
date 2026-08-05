export interface InvoiceItem {
  itemId: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
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
  installmentNumber?: number | null;
  milestoneName?: string | null;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  notes?: string | null;
  createdOn: string;
  items: InvoiceItem[];
}

export interface InvoiceSummary {
  totalInvoices: number;
  paid: number;
  overdue: number;
  outstanding: number;
}

export interface InvoiceListData {
  items: Invoice[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  summary: InvoiceSummary;
}

export interface InvoiceItemCreateInput {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceGenerateInput {
  bookingId: number;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  amount: number;
  taxAmount?: number | null;
  totalAmount?: number | null;
  dueDate: string;
  status: string;
  notes?: string | null;
  installmentId?: number | null;
  items?: InvoiceItemCreateInput[] | null;
}