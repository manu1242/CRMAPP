import { downloadAndShareFile } from '../Services/downloadService';
import { getApiUrl } from '../api/remoteConfig';
import { API_ENDPOINTS } from '../api/endpoints';

export function getQuotationPdfUrl(quotationId: number | string): string {
  const base = getApiUrl().replace(/\/$/, '');
  return `${base}${API_ENDPOINTS.QUOTATIONS.DOWNLOAD_PDF(quotationId)}`;
}

export function getBookingPdfUrl(bookingId: number | string): string {
  const base = getApiUrl().replace(/\/$/, '');
  return `${base}${API_ENDPOINTS.BOOKINGS.DOWNLOAD_PDF(bookingId)}`;
}

export function getInvoicePdfUrl(invoiceId: number | string): string {
  const base = getApiUrl().replace(/\/$/, '');
  return `${base}${API_ENDPOINTS.INVOICES.DOWNLOAD_PDF(invoiceId)}`;
}

export function getPaymentReceiptPdfUrl(paymentId: number | string): string {
  const base = getApiUrl().replace(/\/$/, '');
  return `${base}${API_ENDPOINTS.PAYMENTS.DOWNLOAD(paymentId)}`;
}

export async function downloadQuotationPdf(quotationId: number | string, quotationNumber?: string): Promise<boolean> {
  const fileName = `Quotation_${(quotationNumber || quotationId).toString().replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  return downloadAndShareFile({
    url: API_ENDPOINTS.QUOTATIONS.DOWNLOAD_PDF(quotationId),
    fileName,
    mimeType: 'application/pdf',
    dialogTitle: `Share Quotation ${quotationNumber || quotationId}`,
  });
}

export async function downloadBookingPdf(bookingId: number | string, bookingNumber?: string): Promise<boolean> {
  const fileName = `Booking_${(bookingNumber || bookingId).toString().replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  return downloadAndShareFile({
    url: API_ENDPOINTS.BOOKINGS.DOWNLOAD_PDF(bookingId),
    fileName,
    mimeType: 'application/pdf',
    dialogTitle: `Share Booking Confirmation ${bookingNumber || bookingId}`,
  });
}

export async function downloadInvoicePdf(invoiceId: number | string, invoiceNumber?: string): Promise<boolean> {
  const fileName = `Invoice_${(invoiceNumber || invoiceId).toString().replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  return downloadAndShareFile({
    url: API_ENDPOINTS.INVOICES.DOWNLOAD_PDF(invoiceId),
    fileName,
    mimeType: 'application/pdf',
    dialogTitle: `Share Invoice ${invoiceNumber || invoiceId}`,
  });
}

export async function downloadPaymentReceiptPdf(paymentId: number | string, receiptNumber?: string): Promise<boolean> {
  const fileName = `Receipt_${(receiptNumber || paymentId).toString().replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  return downloadAndShareFile({
    url: API_ENDPOINTS.PAYMENTS.DOWNLOAD(paymentId),
    fileName,
    mimeType: 'application/pdf',
    dialogTitle: `Share Receipt ${receiptNumber || paymentId}`,
  });
}

