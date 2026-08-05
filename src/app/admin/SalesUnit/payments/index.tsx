import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  Filter,
  Plus,
  Trash2,
  Info,
  X,
  Building,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Phone,
  Mail,
  Download,
  Link as LinkIcon
} from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
  PaymentItem,
  RecordPaymentRequest
} from '../../../../admin/models/PaymentTypes';
import {
  usePayments,
  useRecordPayment,
  usePaymentReceipt,
  useDeletePayment
} from '../../../../admin/hooks/usePayments';
import { useInvoices } from '../../../../admin/hooks/useInvoices';
import { Invoice } from '../../../../admin/models/InvoiceTypes';

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

// Searchable Select Modal Component for Invoice Selection
interface SearchableSelectModalProps<T> {
  visible: boolean;
  title: string;
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  searchKey: keyof T;
  labelKey: keyof T;
  secondaryLabelKey?: keyof T;
  placeholder?: string;
}

function SearchableSelectModal<T>({
  visible,
  title,
  items,
  onSelect,
  onClose,
  searchKey,
  labelKey,
  secondaryLabelKey,
  placeholder = 'Search...',
}: SearchableSelectModalProps<T>) {
  const [searchText, setSearchText] = useState('');
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);

  const filteredItems = items.filter((item) => {
    const value = item[searchKey];
    if (typeof value === 'string') {
      return value.toLowerCase().includes(searchText.toLowerCase());
    }
    return false;
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.selectModalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
              <X size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.border, margin: 16, marginBottom: 8 }]}>
            <Search size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder={placeholder}
              placeholderTextColor={theme.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    onSelect(item);
                    setSearchText('');
                    onClose();
                  }}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>
                    {String(item[labelKey])}
                  </Text>
                  {secondaryLabelKey && (
                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {String(item[secondaryLabelKey])}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 24, fontSize: 13 }}>
                No items found
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function PaymentsScreen() {
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);
  const router = useRouter();

  // Search, Date and Pagination State
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Load Payments List
  const {
    data: paymentsResponse,
    isLoading: isListLoading,
    isRefetching: isListRefetching,
    refetch: refetchList
  } = usePayments(page, pageSize, searchQuery || undefined, fromDate || undefined, toDate || undefined);

  const payments = paymentsResponse?.data?.items ?? [];
  const totalPages = paymentsResponse?.data?.totalPages ?? 1;
  const totalCount = paymentsResponse?.data?.totalCount ?? 0;
  const summary = paymentsResponse?.data?.summary;

  // Selected Payment details Modal state
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);

  // Load selected receipt details (including company & bank details)
  const {
    data: receiptResponse,
    isLoading: isReceiptLoading
  } = usePaymentReceipt(selectedPayment?.paymentId ?? 0, isReceiptModalOpen);

  // Record Payment Form Modal state
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isInvoiceDropdownOpen, setInvoiceDropdownOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transactionReference, setTransactionReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [notes, setNotes] = useState('');

  const [isMethodDropdownOpen, setMethodDropdownOpen] = useState(false);

  // Fetch outstanding invoices for booking payment mapping
  const { data: invoicesRes } = useInvoices(1, 200);
  const unpaidInvoices = (invoicesRes?.data?.items ?? []).filter(
    (inv) => inv.status !== 'Paid' && inv.outstandingAmount > 0
  );

  // Mutations
  const recordPaymentMutation = useRecordPayment();
  const deletePaymentMutation = useDeletePayment();

  const handleSearchSubmit = () => {
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice) {
      Alert.alert('Validation Error', 'Please select an invoice.');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive Amount.');
      return;
    }
    if (!paymentDate) {
      Alert.alert('Validation Error', 'Please select a Payment Date.');
      return;
    }
    if (paymentMethod === 'Cheque') {
      if (!chequeNumber.trim()) {
        Alert.alert('Validation Error', 'Please enter Cheque Number.');
        return;
      }
      if (!chequeDate) {
        Alert.alert('Validation Error', 'Please enter Cheque Date.');
        return;
      }
    }

    const payload: RecordPaymentRequest = {
      invoiceId: selectedInvoice.invoiceId,
      amount: amt,
      paymentMethod,
      paymentDate: `${paymentDate}T00:00:00`,
      transactionReference: transactionReference.trim() || null,
      bankName: bankName.trim() || null,
      chequeNumber: chequeNumber.trim() || null,
      chequeDate: chequeDate ? `${chequeDate}T00:00:00` : null,
      notes: notes.trim() || null,
    };

    recordPaymentMutation.mutate(payload, {
      onSuccess: (res) => {
        Alert.alert('Success', res.message || 'Payment recorded successfully!');
        setFormModalOpen(false);
        resetForm();
        refetchList();
      },
      onError: (err: any) => {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to record payment.';
        Alert.alert('Error', errorMsg);
      }
    });
  };

  const handleDeletePayment = (paymentId: number) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this payment record? This action will restore the outstanding balance on the linked invoice.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePaymentMutation.mutate(paymentId, {
              onSuccess: () => {
                Alert.alert('Success', 'Payment deleted successfully.');
                setDetailModalOpen(false);
                setSelectedPayment(null);
                refetchList();
              },
              onError: (err: any) => {
                Alert.alert('Error', err.message || 'Failed to delete payment.');
              }
            });
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setSelectedInvoice(null);
    setAmount('');
    setPaymentMethod('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setTransactionReference('');
    setBankName('');
    setChequeNumber('');
    setChequeDate('');
    setNotes('');
    setInvoiceDropdownOpen(false);
    setMethodDropdownOpen(false);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'Cash':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'Cheque':
        return { bg: '#ffedd5', text: '#9a3412' };
      case 'Bank Transfer':
      case 'UPI':
      case 'Card':
        return { bg: '#dbeafe', text: '#1e40af' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>
      
      {/* Overview Metric Summary Dashboard */}
      {summary ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, gap: 12 }}
        >
          <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={[styles.metricIconBox, { backgroundColor: '#10b98115' }]}>
              <CheckCircle size={20} color="#10b981" />
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Receipts</Text>
              <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{summary.totalPayments}</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={[styles.metricIconBox, { backgroundColor: '#6366f115' }]}>
              <DollarSign size={20} color="#6366f1" />
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Received</Text>
              <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{formatCurrency(summary.totalReceived)}</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={[styles.metricIconBox, { backgroundColor: '#f59e0b15' }]}>
              <Clock size={20} color="#f59e0b" />
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>This Month</Text>
              <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{summary.thisMonthCount} payments</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={[styles.metricIconBox, { backgroundColor: '#3b82f615' }]}>
              <Building size={20} color="#3b82f6" />
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Month Revenue</Text>
              <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{formatCurrency(summary.monthRevenue)}</Text>
            </View>
          </View>
        </ScrollView>
      ) : null}

      {/* Filter & Search Panel */}
      <View style={{ paddingHorizontal: 16, paddingTop: 4, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={[styles.searchBox, { flex: 1, backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Search size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search receipt, transaction, notes..."
              placeholderTextColor={theme.textMuted}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearchSubmit}
            />
            {searchInput ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchInput('');
                  setSearchQuery('');
                }}
              >
                <X size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => setFormModalOpen(true)}
            style={[styles.createBtn, { backgroundColor: theme.brand }]}
          >
            <Plus size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Date Inputs Panel */}
        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 4 }}>From Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.dateInput, { backgroundColor: theme.secondaryBg, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              value={fromDate}
              onChangeText={setFromDate}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 4 }}>To Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.dateInput, { backgroundColor: theme.secondaryBg, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              value={toDate}
              onChangeText={setToDate}
            />
          </View>
        </View>
      </View>

      {/* Payments List */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isListLoading && isListRefetching} onRefresh={refetchList} />}
      >
        {isListLoading && !isListRefetching ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.brand} />
            <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Fetching payments...</Text>
          </View>
        ) : payments.length > 0 ? (
          <View style={{ gap: 12 }}>
            {payments.map((item) => (
              <TouchableOpacity
                key={item.paymentId}
                onPress={() => {
                  setSelectedPayment(item);
                  setDetailModalOpen(true);
                }}
                style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.receiptText, { color: theme.textPrimary }]}>{item.receiptNumber}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>{formatDate(item.paymentDate)}</Text>
                  </View>
                  <View style={[styles.methodBadge, { backgroundColor: getMethodColor(item.paymentMethod).bg }]}>
                    <Text style={[styles.methodText, { color: getMethodColor(item.paymentMethod).text }]}>{item.paymentMethod}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={{ gap: 6 }}>
                  <View style={styles.gridRow}>
                    <User size={13} color={theme.textSecondary} />
                    <Text style={[styles.gridText, { color: theme.textPrimary }]}>{item.leadName}</Text>
                  </View>
                  <View style={styles.gridRow}>
                    <Building size={13} color={theme.textSecondary} />
                    <Text style={[styles.gridText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.propertyName} · {item.flatName}
                    </Text>
                  </View>
                  <View style={styles.gridRow}>
                    <FileText size={13} color={theme.textSecondary} />
                    <Text style={[styles.gridText, { color: theme.textSecondary }]}>Invoice: {item.invoiceNumber}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: theme.textMuted }}>Ref: {item.transactionReference || 'N/A'}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.brand }}>{formatCurrency(item.amount)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Info size={36} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Payments Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>There are no payments matching your search criteria.</Text>
          </View>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={[styles.paginationRow, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 16 }]}>
            <TouchableOpacity
              disabled={page <= 1}
              onPress={() => setPage(page - 1)}
              style={[styles.pageBtn, { backgroundColor: theme.inputBg, opacity: page <= 1 ? 0.4 : 1 }]}
            >
              <ChevronLeft size={16} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={{ color: theme.textPrimary, fontSize: 13 }}>
              Page {page} of {totalPages}
            </Text>
            <TouchableOpacity
              disabled={page >= totalPages}
              onPress={() => setPage(page + 1)}
              style={[styles.pageBtn, { backgroundColor: theme.inputBg, opacity: page >= totalPages ? 0.4 : 1 }]}
            >
              <ChevronRight size={16} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* PAYMENT DETAIL MODAL */}
      <Modal visible={isDetailModalOpen} transparent animationType="fade" onRequestClose={() => setDetailModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={20} color={theme.brand} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Payment Details</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedPayment ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                
                {/* Main Receipt Summary */}
                <View style={{ backgroundColor: theme.inputBg, padding: 14, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>RECEIPT NUMBER</Text>
                    <View style={[styles.methodBadge, { backgroundColor: getMethodColor(selectedPayment.paymentMethod).bg }]}>
                      <Text style={[styles.methodText, { color: getMethodColor(selectedPayment.paymentMethod).text, fontSize: 9 }]}>
                        {selectedPayment.paymentMethod.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary }}>{selectedPayment.receiptNumber}</Text>
                  <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 8 }]} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>Amount Received</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: theme.brand }}>{formatCurrency(selectedPayment.amount)}</Text>
                  </View>
                </View>

                {/* Grid Info Boxes */}
                <View style={{ gap: 12, marginBottom: 14 }}>
                  {/* Bill To Info */}
                  <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border, padding: 12, marginBottom: 0 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 4 }}>
                      <User size={13} color="#b45309" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#b45309', letterSpacing: 0.5 }}>CLIENT DETAILS</Text>
                    </View>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: theme.textPrimary, marginBottom: 4 }}>{selectedPayment.leadName}</Text>
                    {selectedPayment.leadContact && (
                      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                        <Phone size={10} color={theme.textSecondary} />
                        <Text style={{ fontSize: 10, color: theme.textSecondary }}>{selectedPayment.leadContact}</Text>
                      </View>
                    )}
                    {selectedPayment.leadEmail && (
                      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                        <Mail size={10} color={theme.textSecondary} />
                        <Text style={{ fontSize: 10, color: theme.textSecondary }}>{selectedPayment.leadEmail}</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Booking Reference: </Text>{selectedPayment.bookingNumber}</Text>
                  </View>

                  {/* Transaction Info */}
                  <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border, padding: 12, marginBottom: 0 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 4 }}>
                      <FileText size={13} color="#b45309" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#b45309', letterSpacing: 0.5 }}>TRANSACTION DETAILS</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 3 }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Payment Date: </Text>{formatDate(selectedPayment.paymentDate)}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 3 }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Linked Invoice: </Text>{selectedPayment.invoiceNumber}</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 3 }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Property / Flat: </Text>{selectedPayment.propertyName} · {selectedPayment.flatName}</Text>
                    
                    {selectedPayment.milestoneName && (
                      <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 3 }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Milestone Component: </Text>{selectedPayment.milestoneName}</Text>
                    )}
                    
                    {selectedPayment.transactionReference && (
                      <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 3 }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Transaction Reference: </Text>{selectedPayment.transactionReference}</Text>
                    )}
                    {selectedPayment.bankName && (
                      <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 3 }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Bank Name: </Text>{selectedPayment.bankName}</Text>
                    )}
                    {selectedPayment.chequeNumber && (
                      <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 3 }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Cheque Number: </Text>{selectedPayment.chequeNumber}</Text>
                    )}
                    {selectedPayment.chequeDate && (
                      <Text style={{ fontSize: 11, color: theme.textSecondary }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Cheque Date: </Text>{formatDate(selectedPayment.chequeDate)}</Text>
                    )}
                  </View>
                </View>

                {/* Notes */}
                {selectedPayment.notes && (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textPrimary, marginBottom: 6 }}>Notes</Text>
                    <View style={{ backgroundColor: theme.inputBg, padding: 10, borderRadius: 10, borderColor: theme.border, borderWidth: 1 }}>
                      <Text style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 16 }}>{selectedPayment.notes}</Text>
                    </View>
                  </View>
                )}

                {/* Meta details */}
                <View style={{ backgroundColor: theme.inputBg, padding: 10, borderRadius: 10, borderColor: theme.border, borderWidth: 1, marginBottom: 16 }}>
                  <Text style={{ fontSize: 10, color: theme.textMuted }}>Recorded By: {selectedPayment.receivedByName}</Text>
                  <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>System Timestamp: {formatDate(selectedPayment.createdOn)}</Text>
                </View>

                {/* Actions Grid */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setDetailModalOpen(false);
                      router.push(`/admin/SalesUnit/invoice?search=${selectedPayment.invoiceNumber}`);
                    }}
                    style={{
                      flex: 1.2,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.inputBg,
                      borderWidth: 1,
                      borderColor: theme.border,
                      paddingVertical: 12,
                      borderRadius: 10,
                      gap: 6
                    }}
                  >
                    <LinkIcon size={14} color={theme.textPrimary} />
                    <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 12 }}>View Invoice</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setReceiptModalOpen(true)}
                    style={{
                      flex: 1.2,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.brand,
                      paddingVertical: 12,
                      borderRadius: 10,
                      gap: 6
                    }}
                  >
                    <FileText size={14} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>View Receipt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeletePayment(selectedPayment.paymentId)}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fee2e2',
                      paddingVertical: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#fca5a5',
                      gap: 6
                    }}
                  >
                    <Trash2 size={14} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 12 }}>Delete</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* PAYMENT RECEIPT MODAL */}
      <Modal visible={isReceiptModalOpen} transparent animationType="slide" onRequestClose={() => setReceiptModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.receiptModalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Building size={20} color={theme.brand} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Payment Receipt</Text>
              </View>
              <TouchableOpacity onPress={() => setReceiptModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {isReceiptLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.brand} />
                <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading receipt template...</Text>
              </View>
            ) : receiptResponse?.data ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
                
                {/* Paper Receipt Frame */}
                <View style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                  
                  {/* Company Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: theme.brand, paddingBottom: 10, marginBottom: 12 }}>
                    <View style={{ flex: 1.2 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: theme.brand }}>{receiptResponse.data.company.companyName}</Text>
                      <Text style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>{receiptResponse.data.company.companyAddress}</Text>
                      <Text style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>Phone: {receiptResponse.data.company.companyPhone} · Email: {receiptResponse.data.company.companyEmail}</Text>
                      <Text style={{ fontSize: 9, color: '#475569', marginTop: 1, fontWeight: '700' }}>GST: {receiptResponse.data.company.companyGST}</Text>
                    </View>
                    <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                      <View style={{ backgroundColor: theme.brand, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 }}>
                        <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '700' }}>PAYMENT RECEIPT</Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1e293b' }}>{receiptResponse.data.payment.receiptNumber}</Text>
                      <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Date: {formatDate(receiptResponse.data.payment.paymentDate)}</Text>
                    </View>
                  </View>

                  {/* Bill To & Property Side-by-Side */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#b45309', marginBottom: 4 }}>RECEIVED FROM</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1e293b' }}>{receiptResponse.data.payment.leadName}</Text>
                      {receiptResponse.data.payment.leadContact && <Text style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>Mob: {receiptResponse.data.payment.leadContact}</Text>}
                      {receiptResponse.data.payment.leadEmail && <Text style={{ fontSize: 9, color: '#475569' }}>Email: {receiptResponse.data.payment.leadEmail}</Text>}
                      <Text style={{ fontSize: 9, color: '#1e293b', fontWeight: '600', marginTop: 2 }}>Booking: {receiptResponse.data.payment.bookingNumber}</Text>
                    </View>

                    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#b45309', marginBottom: 4 }}>PROPERTY DETAILS</Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#1e293b' }}>{receiptResponse.data.payment.propertyName}</Text>
                      <Text style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>Unit: {receiptResponse.data.payment.flatName}</Text>
                      {receiptResponse.data.payment.milestoneName && (
                        <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }} numberOfLines={1}>Component: {receiptResponse.data.payment.milestoneName}</Text>
                      )}
                    </View>
                  </View>

                  {/* Payment Details Table */}
                  <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#cbd5e1' }}>
                      <Text style={{ flex: 2, fontSize: 9, fontWeight: '700', color: '#475569' }}>Payment Item Description</Text>
                      <Text style={{ flex: 1, fontSize: 9, fontWeight: '700', color: '#475569', textAlign: 'right' }}>Amount Paid</Text>
                    </View>
                    <View style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                      <Text style={{ flex: 2, fontSize: 10, color: '#334155' }}>
                        Receipt against Invoice {receiptResponse.data.payment.invoiceNumber}
                        {receiptResponse.data.payment.milestoneName ? ` (${receiptResponse.data.payment.milestoneName} Milestone)` : ''}
                      </Text>
                      <Text style={{ flex: 1, fontSize: 10, color: '#334155', fontWeight: '700', textAlign: 'right' }}>
                        {formatCurrency(receiptResponse.data.payment.amount)}
                      </Text>
                    </View>
                  </View>

                  {/* Transaction Metadata & Bank Accounts */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                    <View style={{ flex: 1.1 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#475569', marginBottom: 2 }}>TRANSACTION INFO</Text>
                      <Text style={{ fontSize: 9, color: '#334155' }}>Method: <Text style={{ fontWeight: '600' }}>{receiptResponse.data.payment.paymentMethod}</Text></Text>
                      {receiptResponse.data.payment.transactionReference && (
                        <Text style={{ fontSize: 9, color: '#334155', marginTop: 1 }}>Txn Ref: <Text style={{ fontWeight: '600' }}>{receiptResponse.data.payment.transactionReference}</Text></Text>
                      )}
                      {receiptResponse.data.payment.bankName && (
                        <Text style={{ fontSize: 9, color: '#334155', marginTop: 1 }}>Bank: {receiptResponse.data.payment.bankName}</Text>
                      )}
                      {receiptResponse.data.payment.chequeNumber && (
                        <Text style={{ fontSize: 9, color: '#334155', marginTop: 1 }}>Cheque: #{receiptResponse.data.payment.chequeNumber}</Text>
                      )}
                    </View>

                    <View style={{ flex: 0.9, backgroundColor: '#f8fafc', padding: 6, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 8, fontWeight: '700', color: '#475569', marginBottom: 2 }}>COMPANY BANK ACCOUNT</Text>
                      {receiptResponse.data.company.bankAccount ? (
                        <>
                          <Text style={{ fontSize: 8, color: '#334155', fontWeight: '600' }}>{receiptResponse.data.company.bankAccount.bankName}</Text>
                          <Text style={{ fontSize: 8, color: '#475569' }}>Acc: {receiptResponse.data.company.bankAccount.accountNumber}</Text>
                          <Text style={{ fontSize: 8, color: '#475569' }}>IFSC: {receiptResponse.data.company.bankAccount.ifscCode}</Text>
                        </>
                      ) : (
                        <Text style={{ fontSize: 8, color: '#64748b' }}>No bank account details configured</Text>
                      )}
                    </View>
                  </View>

                  {/* Notes & Footer signature */}
                  {receiptResponse.data.payment.notes && (
                    <View style={{ marginBottom: 12, padding: 6, backgroundColor: '#f8fafc', borderRadius: 4 }}>
                      <Text style={{ fontSize: 8, fontWeight: '700', color: '#64748b' }}>Notes: <Text style={{ fontWeight: '400', color: '#475569' }}>{receiptResponse.data.payment.notes}</Text></Text>
                    </View>
                  )}

                  <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 4, alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: '#94a3b8', fontStyle: 'italic' }}>This is a system generated digital payment receipt.</Text>
                  </View>
                </View>

                {/* PDF Action buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, paddingHorizontal: 4 }}>
                  <TouchableOpacity
                    onPress={() => {
                      // Trigger download link alert
                      Alert.alert(
                        'PDF Download',
                        `Receipt document Receipt_${receiptResponse.data?.payment.receiptNumber}.pdf has been prepared.`,
                        [{ text: 'OK' }]
                      );
                    }}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.brand,
                      paddingVertical: 12,
                      borderRadius: 10,
                      gap: 6
                    }}
                  >
                    <Download size={16} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Download PDF</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* RECORD PAYMENT FORM MODAL */}
      <Modal visible={isFormModalOpen} transparent animationType="slide" onRequestClose={() => setFormModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.formModalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Record Payment</Text>
              <TouchableOpacity onPress={() => setFormModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ gap: 14, paddingBottom: 24 }}>
                
                {/* Select Invoice Section */}
                <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border, padding: 12, marginBottom: 4, zIndex: 20 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <LinkIcon size={16} color={theme.brand} />
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, fontSize: 13, fontWeight: '700' }]}>Linked Invoice</Text>
                  </View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Select Invoice *</Text>
                  <TouchableOpacity
                    onPress={() => setInvoiceDropdownOpen(!isInvoiceDropdownOpen)}
                    style={[styles.selectBox, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                  >
                    <Text style={{ color: selectedInvoice ? theme.textPrimary : theme.textMuted, fontSize: 13 }} numberOfLines={1}>
                      {selectedInvoice
                        ? `${selectedInvoice.invoiceNumber} (${selectedInvoice.leadName} - Out: ${formatCurrency(selectedInvoice.outstandingAmount)})`
                        : 'Select outstanding invoice...'}
                    </Text>
                    <ChevronDown size={16} color={theme.textSecondary} />
                  </TouchableOpacity>

                  {isInvoiceDropdownOpen && (
                    <View style={{
                      position: 'absolute',
                      top: 76,
                      left: 12,
                      right: 12,
                      backgroundColor: theme.secondaryBg,
                      borderColor: theme.border,
                      borderWidth: 1,
                      borderRadius: 10,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                      zIndex: 100,
                      maxHeight: 200,
                    }}>
                      <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                        {unpaidInvoices.length > 0 ? (
                          unpaidInvoices.map((inv) => (
                            <TouchableOpacity
                              key={inv.invoiceId}
                              onPress={() => {
                                setSelectedInvoice(inv);
                                setAmount(inv.outstandingAmount.toString());
                                setInvoiceDropdownOpen(false);
                              }}
                              style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.border,
                              }}
                            >
                              <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>
                                {inv.invoiceNumber}
                              </Text>
                              <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                {inv.leadName} · Outstanding: {formatCurrency(inv.outstandingAmount)}
                              </Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={{ color: theme.textMuted, textAlign: 'center', padding: 16, fontSize: 12 }}>
                            No outstanding invoices found
                          </Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Payment Fields Section */}
                <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border, padding: 12, marginBottom: 4 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <DollarSign size={16} color={theme.brand} />
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, fontSize: 13, fontWeight: '700' }]}>Payment Details</Text>
                  </View>

                  {/* Row 1: Amount & Payment Date */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Amount Received *</Text>
                      <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                        <TextInput
                          style={[styles.formTextInput, { color: theme.textPrimary }]}
                          keyboardType="numeric"
                          placeholder="0.00"
                          placeholderTextColor={theme.textMuted}
                          value={amount}
                          onChangeText={setAmount}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Payment Date *</Text>
                      <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                        <TextInput
                          style={[styles.formTextInput, { color: theme.textPrimary }]}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={theme.textMuted}
                          value={paymentDate}
                          onChangeText={setPaymentDate}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Row 2: Payment Method & Trans Ref */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                    <View style={{ flex: 1, zIndex: 10 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Payment Method *</Text>
                      <TouchableOpacity
                        onPress={() => setMethodDropdownOpen(!isMethodDropdownOpen)}
                        style={[styles.selectBox, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                      >
                        <Text style={{ color: theme.textPrimary, fontSize: 13 }}>
                          {paymentMethod}
                        </Text>
                        <ChevronDown size={16} color={theme.textSecondary} />
                      </TouchableOpacity>

                      {isMethodDropdownOpen && (
                        <View style={{
                          position: 'absolute',
                          top: 68,
                          left: 0,
                          right: 0,
                          backgroundColor: theme.secondaryBg,
                          borderColor: theme.border,
                          borderWidth: 1,
                          borderRadius: 10,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                          zIndex: 100,
                        }}>
                          {['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card', 'Other'].map((method) => (
                            <TouchableOpacity
                              key={method}
                              onPress={() => {
                                setPaymentMethod(method);
                                setMethodDropdownOpen(false);
                              }}
                              style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.border,
                              }}
                            >
                              <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: paymentMethod === method ? '700' : '400' }}>
                                {method}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Transaction Ref</Text>
                      <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                        <TextInput
                          style={[styles.formTextInput, { color: theme.textPrimary }]}
                          placeholder="Ref / UPI ID / Txn ID"
                          placeholderTextColor={theme.textMuted}
                          value={transactionReference}
                          onChangeText={setTransactionReference}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Conditional Banks Inputs */}
                  {['Bank Transfer', 'Cheque', 'Card'].includes(paymentMethod) && (
                    <View style={{ gap: 10, marginBottom: 10 }}>
                      <View>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Bank Name</Text>
                        <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                          <TextInput
                            style={[styles.formTextInput, { color: theme.textPrimary }]}
                            placeholder="E.g., HDFC Bank"
                            placeholderTextColor={theme.textMuted}
                            value={bankName}
                            onChangeText={setBankName}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Cheque Specific Fields */}
                  {paymentMethod === 'Cheque' && (
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Cheque Number *</Text>
                        <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                          <TextInput
                            style={[styles.formTextInput, { color: theme.textPrimary }]}
                            placeholder="6-digit number"
                            placeholderTextColor={theme.textMuted}
                            value={chequeNumber}
                            onChangeText={setChequeNumber}
                          />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Cheque Date *</Text>
                        <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                          <TextInput
                            style={[styles.formTextInput, { color: theme.textPrimary }]}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={theme.textMuted}
                            value={chequeDate}
                            onChangeText={setChequeDate}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                </View>

                {/* Notes Input Card */}
                <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border, padding: 12, marginBottom: 4 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <FileText size={16} color={theme.brand} />
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, fontSize: 13, fontWeight: '700' }]}>Additional Notes</Text>
                  </View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Payment Notes</Text>
                  <View style={[styles.textAreaContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                    <TextInput
                      style={[styles.textAreaInput, { color: theme.textPrimary }]}
                      multiline
                      numberOfLines={3}
                      placeholder="Add transaction remarks..."
                      placeholderTextColor={theme.textMuted}
                      value={notes}
                      onChangeText={setNotes}
                    />
                  </View>
                </View>

                {/* Form Actions */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => setFormModalOpen(false)}
                    style={[styles.formCancelBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                  >
                    <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleRecordPayment}
                    disabled={recordPaymentMutation.isPending}
                    style={[styles.formSaveBtn, { backgroundColor: theme.brand }]}
                  >
                    {recordPaymentMutation.isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={{ color: '#ffffff', fontWeight: '700' }}>Submit Payment</Text>
                    )}
                  </TouchableOpacity>
                </View>

              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  metricCard: {
    width: 140,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginRight: 4,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  createBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  dateInput: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptText: {
    fontSize: 15,
    fontWeight: '700',
  },
  methodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridText: {
    fontSize: 13,
  },
  emptyContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  pageBtn: {
    padding: 8,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    maxHeight: '90%',
  },
  receiptModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    height: '92%',
  },
  formModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    maxHeight: '94%',
  },
  selectModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingVertical: 16,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  detailCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  formInputContainer: {
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  formTextInput: {
    fontSize: 13,
    padding: 0,
  },
  textAreaContainer: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  textAreaInput: {
    fontSize: 13,
    height: 60,
    textAlignVertical: 'top',
    padding: 0,
  },
  formCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  formSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
