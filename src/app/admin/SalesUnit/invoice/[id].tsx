import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Modal,
    TextInput,
    Switch,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';
import { ChevronLeft, FileText, Phone, Mail, Clock, Download, Trash2, Send, CreditCard, Calendar } from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useInvoiceDetail, useDeleteInvoice, useSendInvoice, useRecordInvoicePayment } from '../../../../admin/hooks/useInvoices';
import { getInvoicePdfUrl } from '../../../../admin/services/InvoiceService';

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
        return 'N/A';
    }
}

function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '₹0.00';
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Paid': return { bg: '#10b98120', text: '#10b981' };
        case 'Partial': return { bg: '#06b6d420', text: '#06b6d4' };
        case 'Overdue': return { bg: '#ef444420', text: '#ef4444' };
        case 'Cancelled': return { bg: '#6b728020', text: '#6b7280' };
        case 'Generated':
        case 'Sent':
        default: return { bg: '#3b82f620', text: '#3b82f6' };
    }
}

export default function InvoiceDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const invoiceId = id ? parseInt(id, 10) : 0;

    const { isDark } = useTheme();
    const theme = getAdminTheme(isDark);
    const insets = useSafeAreaInsets();

    const [confirmDelete, setConfirmDelete] = useState(false);

    // Send Invoice state
    const [isSendModalOpen, setSendModalOpen] = useState(false);
    const [sendWhatsApp, setSendWhatsApp] = useState(true);
    const [sendEmail, setSendEmail] = useState(false);

    // Record Payment state
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [txRef, setTxRef] = useState('');
    const [bankName, setBankName] = useState('');
    const [chequeNo, setChequeNo] = useState('');
    const [chequeDate, setChequeDate] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [isMethodDropdownOpen, setMethodDropdownOpen] = useState(false);

    const { data: detailResponse, isLoading } = useInvoiceDetail(invoiceId);
    const invoice = detailResponse?.data;

    const deleteInvoiceMutation = useDeleteInvoice();
    const sendInvoiceMutation = useSendInvoice();
    const recordPaymentMutation = useRecordInvoicePayment();

    useEffect(() => {
        if (invoice) {
            setPaymentAmount(invoice.outstandingAmount.toString());
        }
    }, [invoice]);

    const handleDownloadPdf = async () => {
        const url = getInvoicePdfUrl(invoiceId);
        try {
            await WebBrowser.openBrowserAsync(url);
        } catch {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Could not open PDF.' });
        }
    };

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            Toast.show({
                type: 'error',
                text1: 'Confirm Delete',
                text2: 'Tap Delete again to permanently remove this invoice.',
                visibilityTime: 3500,
                onHide: () => setConfirmDelete(false),
            });
            return;
        }
        deleteInvoiceMutation.mutate(invoiceId, {
            onSuccess: () => {
                Toast.show({ type: 'success', text1: 'Deleted', text2: 'Invoice deleted successfully.' });
                router.replace('/admin/SalesUnit/invoice');
            },
            onError: (err: any) => {
                Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to delete invoice.' });
                setConfirmDelete(false);
            },
        });
    };

    const handleSendInvoice = () => {
        sendInvoiceMutation.mutate({ invoiceId, sendWhatsApp, sendEmail }, {
            onSuccess: (res: any) => {
                Toast.show({ type: 'success', text1: 'Success', text2: res.message || 'Invoice sent successfully!' });
                setSendModalOpen(false);
            },
            onError: (err: any) => {
                Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to send invoice.' });
            }
        });
    };

    const handleRecordPayment = () => {
        const amt = parseFloat(paymentAmount);
        if (isNaN(amt) || amt <= 0) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a valid amount.' });
            return;
        }
        if (!paymentDate) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a payment date.' });
            return;
        }

        const payload = {
            amount: amt,
            paymentMethod,
            paymentDate: `${paymentDate}T00:00:00`,
            transactionReference: txRef.trim() || null,
            bankName: bankName.trim() || null,
            chequeNumber: chequeNo.trim() || null,
            chequeDate: chequeDate.trim() ? `${chequeDate}T00:00:00` : null,
            notes: paymentNotes.trim() || null,
        };

        recordPaymentMutation.mutate({ invoiceId, paymentData: payload }, {
            onSuccess: () => {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Payment recorded successfully!' });
                setPaymentModalOpen(false);
                // Clear fields
                setTxRef('');
                setBankName('');
                setChequeNo('');
                setChequeDate('');
                setPaymentNotes('');
            },
            onError: (err: any) => {
                Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to record payment.' });
            }
        });
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.brand} />
                <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading invoice...</Text>
            </View>
        );
    }

    if (!invoice) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.primaryBg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700' }}>Invoice Not Found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: theme.brand, fontWeight: '600' }}>← Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusColors = getStatusColor(invoice.status);

    return (
        <View style={{ flex: 1, backgroundColor: theme.primaryBg }}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: 12 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    Tax Invoice
                </Text>
                <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.badgeText, { color: statusColors.text }]}>{invoice.status}</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom + 100, 120) }}
                showsVerticalScrollIndicator={false}
            >

                {/* ── Invoice Header Card ─────────────────────────── */}
                <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary }}>
                            GSTIN: <Text style={{ fontWeight: '500', color: theme.textMuted }}>Not Available</Text>
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            <Phone size={12} color={theme.textSecondary} />
                            <Text style={{ fontSize: 11, color: theme.textSecondary }}>{invoice.leadContact || '—'}</Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            <View style={{ backgroundColor: theme.brand, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>TAX INVOICE</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: statusColors.bg, paddingVertical: 1, paddingHorizontal: 6 }]}>
                                <Text style={[styles.badgeText, { color: statusColors.text, textTransform: 'uppercase', fontSize: 9 }]}>{invoice.status}</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>{invoice.invoiceNumber}</Text>
                    </View>
                </View>

                {/* ── Bill To / Invoice Details Side-by-Side ─────── */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    {/* Bill To */}
                    <View style={[styles.card, { flex: 1, padding: 12, backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#b45309', letterSpacing: 0.5 }}>BILL TO</Text>
                        </View>
                        <Text style={{ fontWeight: '700', fontSize: 13, color: theme.textPrimary, marginBottom: 4 }}>{invoice.leadName}</Text>
                        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                            <Phone size={10} color={theme.textSecondary} />
                            <Text style={{ fontSize: 10, color: theme.textSecondary }} numberOfLines={1}>{invoice.leadContact || '—'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                            <Mail size={10} color={theme.textSecondary} />
                            <Text style={{ fontSize: 10, color: theme.textSecondary }} numberOfLines={1}>{invoice.leadEmail || '—'}</Text>
                        </View>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textPrimary }}>
                            <Text style={{ color: theme.textSecondary, fontWeight: '400' }}>Booking: </Text>
                            {invoice.bookingNumber}
                        </Text>
                    </View>

                    {/* Invoice Details */}
                    <View style={[styles.card, { flex: 1, padding: 12, backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 4 }}>
                            <FileText size={12} color="#b45309" />
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#b45309', letterSpacing: 0.5 }}>INVOICE DETAILS</Text>
                        </View>
                        <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 4 }}>
                            <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Invoice Date: </Text>{formatDate(invoice.invoiceDate)}
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 4 }}>
                            <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Due Date: </Text>{formatDate(invoice.dueDate)}
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 4 }}>
                            <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Property: </Text>{invoice.propertyName}
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                            <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Unit: </Text>{invoice.flatName || '—'}
                        </Text>
                    </View>
                </View>

                {/* ── Items Table ─────────────────────────────────── */}
                <View style={[styles.table, { borderColor: theme.border, marginTop: 12 }]}>
                    <View style={[styles.tableHeader, { backgroundColor: theme.brand }]}>
                        <Text style={[styles.thText, { flex: 0.3, color: '#fff' }]}>#</Text>
                        <Text style={[styles.thText, { flex: 2, color: '#fff' }]}>DESCRIPTION</Text>
                        <Text style={[styles.thText, { flex: 0.5, textAlign: 'center', color: '#fff' }]}>QTY</Text>
                        <Text style={[styles.thText, { flex: 1, textAlign: 'right', color: '#fff' }]}>RATE</Text>
                        <Text style={[styles.thText, { flex: 1, textAlign: 'right', color: '#fff' }]}>AMOUNT</Text>
                    </View>

                    {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item: any, idx: number) => (
                            <View key={item.itemId || idx} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                                <Text style={{ flex: 0.3, fontSize: 11, color: theme.textPrimary }}>{idx + 1}</Text>
                                <Text style={{ flex: 2, fontSize: 11, color: theme.textPrimary }}>{item.description}</Text>
                                <Text style={{ flex: 0.5, textAlign: 'center', fontSize: 11, color: theme.textPrimary }}>{item.quantity}</Text>
                                <Text style={{ flex: 1, textAlign: 'right', fontSize: 11, color: theme.textPrimary }}>{formatCurrency(item.rate)}</Text>
                                <Text style={{ flex: 1, textAlign: 'right', fontSize: 11, color: theme.textPrimary, fontWeight: '500' }}>{formatCurrency(item.amount)}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                            <Text style={{ flex: 0.3, fontSize: 11, color: theme.textPrimary }}>1</Text>
                            <Text style={{ flex: 2, fontSize: 11, color: theme.textPrimary }}>
                                {invoice.milestoneName ? `${invoice.milestoneName} Payment` : 'Property Booking Invoice'}
                            </Text>
                            <Text style={{ flex: 0.5, textAlign: 'center', fontSize: 11, color: theme.textPrimary }}>1</Text>
                            <Text style={{ flex: 1, textAlign: 'right', fontSize: 11, color: theme.textPrimary }}>{formatCurrency(invoice.amount)}</Text>
                            <Text style={{ flex: 1, textAlign: 'right', fontSize: 11, color: theme.textPrimary, fontWeight: '500' }}>{formatCurrency(invoice.amount)}</Text>
                        </View>
                    )}
                </View>

                {/* ── Financial Summary ─────────────────────────── */}
                <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
                    <View style={[styles.card, { width: '68%', padding: 12, backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={styles.summaryRow}>
                            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Subtotal</Text>
                            <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: '600' }}>{formatCurrency(invoice.amount)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>GST (5%)</Text>
                            <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: '600' }}>{formatCurrency(invoice.taxAmount)}</Text>
                        </View>
                        <View style={[styles.summaryRow, { backgroundColor: theme.brand, padding: 6, borderRadius: 6, marginTop: 6 }]}>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Total Amount</Text>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{formatCurrency(invoice.totalAmount)}</Text>
                        </View>
                        <View style={[styles.summaryRow, { backgroundColor: '#fef3c7', padding: 6, borderRadius: 6, marginTop: 4 }]}>
                            <Text style={{ color: '#d97706', fontWeight: '600', fontSize: 11 }}>Amount Paid</Text>
                            <Text style={{ color: '#d97706', fontWeight: '700', fontSize: 11 }}>{formatCurrency(invoice.paidAmount)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Balance Due</Text>
                            <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 11 }}>{formatCurrency(invoice.outstandingAmount)}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Payment History ───────────────────────────── */}
                {invoice.paidAmount > 0 && (
                    <View style={{ marginTop: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Clock size={14} color="#b45309" />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#b45309', letterSpacing: 0.5 }}>PAYMENT HISTORY</Text>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 12,
                            borderRadius: 10,
                            backgroundColor: theme.inputBg,
                            borderLeftWidth: 3,
                            borderLeftColor: theme.brand,
                            borderColor: theme.border,
                            borderWidth: 1,
                        }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary }}>
                                    REC-2026-{invoice.invoiceNumber.split('-').pop()}
                                </Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                                    {formatDate(invoice.invoiceDate)} · Cash
                                </Text>
                            </View>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#10b981' }}>{formatCurrency(invoice.paidAmount)}</Text>
                        </View>
                    </View>
                )}

                {/* ── Payment Terms ─────────────────────────────── */}
                <View style={{ marginTop: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <FileText size={14} color={theme.brand} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textPrimary, letterSpacing: 0.5 }}>PAYMENT TERMS</Text>
                    </View>
                    <View style={[styles.card, { padding: 12, backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        {[
                            '• Payment due by the date mentioned above.',
                            '• Late payments may incur additional charges.',
                            '• All amounts are in Indian Rupees (INR).',
                            '• This is a computer-generated invoice.',
                        ].map((t, i) => (
                            <Text key={i} style={{ fontSize: 11, color: theme.textSecondary, marginBottom: i < 3 ? 4 : 0 }}>{t}</Text>
                        ))}
                    </View>
                </View>

                {/* ── Notes ─────────────────────────────────────── */}
                {invoice.notes ? (
                    <View style={{ marginTop: 16 }}>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Notes</Text>
                        <View style={[styles.card, { padding: 12, backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                            <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>{invoice.notes}</Text>
                        </View>
                    </View>
                ) : null}

                {/* ── Action Buttons ────────────────────────────── */}
                <View style={{ gap: 10, marginTop: 24 }}>
                    {invoice.status === 'Paid' ? (
                        <TouchableOpacity
                            onPress={handleDownloadPdf}
                            style={[styles.actionBtn, { backgroundColor: theme.brand }]}
                        >
                            <Download size={16} color="#ffffff" />
                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Download PDF</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    onPress={handleDownloadPdf}
                                    style={[styles.actionBtn, { backgroundColor: theme.brand, flex: 1 }]}
                                >
                                    <Download size={16} color="#ffffff" />
                                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Download PDF</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setSendModalOpen(true)}
                                    style={[styles.actionBtn, { backgroundColor: '#4f46e5', flex: 1 }]}
                                >
                                    <Send size={16} color="#ffffff" />
                                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Send Invoice</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    onPress={() => setPaymentModalOpen(true)}
                                    style={[styles.actionBtn, { backgroundColor: '#10b981', flex: 1 }]}
                                >
                                    <CreditCard size={16} color="#ffffff" />
                                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Record Payment</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleDelete}
                                    disabled={deleteInvoiceMutation.isPending}
                                    style={[
                                        styles.actionBtn,
                                        { backgroundColor: confirmDelete ? '#dc2626' : '#fee2e2', flex: 1 },
                                    ]}
                                >
                                    {deleteInvoiceMutation.isPending ? (
                                        <ActivityIndicator size="small" color="#dc2626" />
                                    ) : (
                                        <>
                                            <Trash2 size={16} color={confirmDelete ? '#ffffff' : '#dc2626'} />
                                            <Text style={{ color: confirmDelete ? '#ffffff' : '#dc2626', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                                                {confirmDelete ? 'Confirm Delete' : 'Delete'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                {/* ── Footer ────────────────────────────────────── */}
                <View style={{ marginTop: 20, marginBottom: 16, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: theme.textMuted, fontStyle: 'italic' }}>Thank you for your business!</Text>
                </View>
            </ScrollView>

            {/* Send Invoice Modal */}
            <Modal
                visible={isSendModalOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setSendModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Send Invoice Notification</Text>
                            <TouchableOpacity onPress={() => setSendModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                                <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 16, marginVertical: 16 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1, paddingRight: 10 }}>
                                    <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14 }}>Send via WhatsApp</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Send invoice details automatically to WhatsApp number</Text>
                                </View>
                                <Switch
                                    value={sendWhatsApp}
                                    onValueChange={setSendWhatsApp}
                                    trackColor={{ false: theme.border, true: '#10b981' }}
                                    thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1, paddingRight: 10 }}>
                                    <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14 }}>Send via Email</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Send copy of invoice PDF to client's email</Text>
                                </View>
                                <Switch
                                    value={sendEmail}
                                    onValueChange={setSendEmail}
                                    trackColor={{ false: theme.border, true: '#10b981' }}
                                    thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSendInvoice}
                            disabled={sendInvoiceMutation.isPending}
                            style={[styles.submitBtn, { backgroundColor: theme.brand }]}
                        >
                            {sendInvoiceMutation.isPending ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Send Notification</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Record Payment Modal */}
            <Modal
                visible={isPaymentModalOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setPaymentModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.formModalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Record Payment</Text>
                            <TouchableOpacity onPress={() => setPaymentModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                                <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                            <View style={{ gap: 14, paddingBottom: 24 }}>

                                {/* Amount */}
                                <View>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Payment Amount (₹) *</Text>
                                    <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                        <Text style={{ color: theme.textPrimary, marginRight: 4 }}>₹</Text>
                                        <TextInput
                                            style={[styles.formTextInput, { color: theme.textPrimary }]}
                                            keyboardType="numeric"
                                            value={paymentAmount}
                                            onChangeText={setPaymentAmount}
                                            placeholder="0.00"
                                            placeholderTextColor={theme.textMuted}
                                        />
                                    </View>
                                </View>

                                {/* Payment Method Dropdown/Selector */}
                                <View>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Payment Method *</Text>
                                    <TouchableOpacity
                                        onPress={() => setMethodDropdownOpen(!isMethodDropdownOpen)}
                                        style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border, height: 48, marginTop: 6 }]}
                                    >
                                        <Text style={{ color: theme.textPrimary, fontSize: 13 }}>{paymentMethod}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 10 }}>▼</Text>
                                    </TouchableOpacity>

                                    {isMethodDropdownOpen && (
                                        <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, backgroundColor: theme.inputBg, marginTop: 4, padding: 8 }}>
                                            {['Cash', 'Cheque', 'UPI', 'NEFT', 'RTGS', 'Card'].map((m) => (
                                                <TouchableOpacity
                                                    key={m}
                                                    onPress={() => {
                                                        setPaymentMethod(m);
                                                        setMethodDropdownOpen(false);
                                                    }}
                                                    style={{ paddingVertical: 10, paddingHorizontal: 8 }}
                                                >
                                                    <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: paymentMethod === m ? '700' : '400' }}>{m}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Payment Date */}
                                <View>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Payment Date *</Text>
                                    <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                        <TextInput
                                            style={[styles.formTextInput, { color: theme.textPrimary }]}
                                            value={paymentDate}
                                            onChangeText={setPaymentDate}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={theme.textMuted}
                                        />
                                        <Calendar size={14} color={theme.textSecondary} />
                                    </View>
                                </View>

                                {/* Transaction Reference (UPI / NEFT etc) */}
                                {paymentMethod !== 'Cash' && (
                                    <View>
                                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Transaction Reference / ID</Text>
                                        <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                            <TextInput
                                                style={[styles.formTextInput, { color: theme.textPrimary }]}
                                                value={txRef}
                                                onChangeText={setTxRef}
                                                placeholder="e.g. TXN12345678"
                                                placeholderTextColor={theme.textMuted}
                                            />
                                        </View>
                                    </View>
                                )}

                                {/* Bank Name (Optional) */}
                                {['UPI', 'NEFT', 'RTGS', 'Cheque', 'Card'].includes(paymentMethod) && (
                                    <View>
                                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Bank Name</Text>
                                        <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                            <TextInput
                                                style={[styles.formTextInput, { color: theme.textPrimary }]}
                                                value={bankName}
                                                onChangeText={setBankName}
                                                placeholder="e.g. HDFC Bank"
                                                placeholderTextColor={theme.textMuted}
                                            />
                                        </View>
                                    </View>
                                )}

                                {/* Cheque details */}
                                {paymentMethod === 'Cheque' && (
                                    <>
                                        <View>
                                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Cheque Number</Text>
                                            <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                                <TextInput
                                                    style={[styles.formTextInput, { color: theme.textPrimary }]}
                                                    value={chequeNo}
                                                    onChangeText={setChequeNo}
                                                    placeholder="e.g. 054124"
                                                    placeholderTextColor={theme.textMuted}
                                                />
                                            </View>
                                        </View>
                                        <View>
                                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Cheque Date (YYYY-MM-DD)</Text>
                                            <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                                <TextInput
                                                    style={[styles.formTextInput, { color: theme.textPrimary }]}
                                                    value={chequeDate}
                                                    onChangeText={setChequeDate}
                                                    placeholder="YYYY-MM-DD"
                                                    placeholderTextColor={theme.textMuted}
                                                />
                                                <Calendar size={14} color={theme.textSecondary} />
                                            </View>
                                        </View>
                                    </>
                                )}

                                {/* Notes */}
                                <View>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Notes</Text>
                                    <TextInput
                                        style={[styles.notesTextArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                                        multiline
                                        numberOfLines={3}
                                        value={paymentNotes}
                                        onChangeText={setPaymentNotes}
                                        placeholder="Add payment notes..."
                                        placeholderTextColor={theme.textMuted}
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            onPress={handleRecordPayment}
                            disabled={recordPaymentMutation.isPending}
                            style={[styles.submitBtn, { backgroundColor: '#10b981' }]}
                        >
                            {recordPaymentMutation.isPending ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Record Payment</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        gap: 8,
    },
    backBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    card: { borderRadius: 14, borderWidth: 1, padding: 16 },
    table: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1 },
    thText: { fontSize: 11, fontWeight: '700' },
    tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, alignItems: 'center' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
    actionBtn: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderBottomWidth: 0,
    },
    formModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderBottomWidth: 0,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtn: {
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    formInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        marginTop: 4,
    },
    formTextInput: {
        flex: 1,
        fontSize: 13,
        paddingVertical: 8,
    },
    selectBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    notesTextArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        height: 80,
        textAlignVertical: 'top',
        fontSize: 13,
        marginTop: 4,
    },
});
