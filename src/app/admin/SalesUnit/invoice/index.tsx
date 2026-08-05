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
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  Mail
} from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
  Invoice,
  InvoiceItem,
  InvoiceItemCreateInput
} from '../../../../admin/models/InvoiceTypes';
import {
  useInvoices,
  useGenerateInvoice
} from '../../../../admin/hooks/useInvoices';
import {
  BookingItem,
  Installment
} from '../../../../admin/models/BookingTypes';
import {
  useBookings,
  useBookingDetail
} from '../../../../admin/hooks/useBookings';

const STATUS_OPTIONS = ['All', 'Generated', 'Sent', 'Paid', 'Partial', 'Overdue', 'Cancelled'];

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

// Searchable Select Modal Component for Booking Selection
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
    const val = String(item[searchKey] || '').toLowerCase();
    return val.includes(searchText.toLowerCase());
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

          <View style={[styles.modalSearchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Search size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.modalSearchInput, { color: theme.textPrimary }]}
              placeholder={placeholder}
              placeholderTextColor={theme.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const label = String(item[labelKey] || '');
                const secLabel = secondaryLabelKey ? String(item[secondaryLabelKey] || '') : '';
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      onSelect(item);
                      setSearchText('');
                      onClose();
                    }}
                    style={[styles.selectOption, { borderBottomColor: theme.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.selectOptionText, { color: theme.textPrimary }]}>{label}</Text>
                      {secLabel ? (
                        <Text style={[styles.selectOptionSubText, { color: theme.textSecondary }]}>{secLabel}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary }}>No records found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);

  const params = useLocalSearchParams<{ search?: string }>();

  useEffect(() => {
    if (params.search) {
      setSearchInput(params.search);
      setSearchQuery(params.search);
    }
  }, [params.search]);

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Invoices list query hook
  const {
    data: invoicesResponse,
    isLoading: isListLoading,
    isRefetching: isListRefetching,
    refetch: refetchList
  } = useInvoices(page, pageSize, statusFilter === 'All' ? undefined : statusFilter, searchQuery);

  const invoices = invoicesResponse?.data?.items ?? [];
  const totalPages = invoicesResponse?.data?.totalPages ?? 1;
  const totalCount = invoicesResponse?.data?.totalCount ?? 0;
  const summary = invoicesResponse?.data?.summary;

  // Selected invoice state for details
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);

  // Generate Invoice Form Modal State
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customAmount, setCustomAmount] = useState('0.00');
  const [taxAmount, setTaxAmount] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Generated');
  const [notes, setNotes] = useState('');

  // Selection list query hook
  const { data: bookingsRes, isLoading: isBookingsLoading } = useBookings(1, 100);
  const bookingsList = bookingsRes?.data?.items ?? [];

  // Search models visibility states
  const [isBookingSelectOpen, setBookingSelectOpen] = useState(false);
  const [isStatusSelectOpen, setStatusSelectOpen] = useState(false);

  // Mutation Hook
  const generateInvoiceMutation = useGenerateInvoice();

  // Reset form inputs
  const resetForm = () => {
    setSelectedBooking(null);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setCustomAmount('0.00');
    setTaxAmount('0');
    setDueDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    });
    setStatus('Generated');
    setNotes('');
  };

  useEffect(() => {
    if (isFormModalOpen) {
      resetForm();
    }
  }, [isFormModalOpen]);

  // Handle Search Input submit
  const handleSearchSubmit = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  // Auto-set fields when Booking is selected
  const handleBookingSelect = (booking: BookingItem) => {
    setSelectedBooking(booking);
    setCustomAmount(booking.totalAmount.toString());
  };

  // Handle invoice generation form submit
  const handleGenerateInvoiceSubmit = () => {
    if (!selectedBooking) {
      Alert.alert('Validation Error', 'Please select a Booking to generate invoice.');
      return;
    }
    if (!invoiceDate) {
      Alert.alert('Validation Error', 'Please enter Invoice Date.');
      return;
    }
    if (!dueDate) {
      Alert.alert('Validation Error', 'Please enter Due Date.');
      return;
    }
    const amt = parseFloat(customAmount);
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Validation Error', 'Please enter a valid Amount.');
      return;
    }

    const payload = {
      bookingId: selectedBooking.bookingId,
      amount: amt,
      taxAmount: parseFloat(taxAmount) || 0,
      totalAmount: amt + (parseFloat(taxAmount) || 0),
      invoiceDate: `${invoiceDate}T00:00:00`,
      dueDate: `${dueDate}T00:00:00`,
      status: status,
      notes: notes.trim() || null,
      installmentId: null,
      items: null
    };

    generateInvoiceMutation.mutate(payload, {
      onSuccess: (res) => {
        Alert.alert('Success', res.message || 'Invoice generated successfully!');
        setFormModalOpen(false);
        refetchList();
      },
      onError: (err: any) => {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to generate invoice.';
        Alert.alert('Error', errorMsg);
      }
    });
  };

  function getStatusColor(status: string) {
    switch (status) {
      case 'Paid':
        return { bg: '#10b98120', text: '#10b981' };
      case 'Partial':
        return { bg: '#06b6d420', text: '#06b6d4' };
      case 'Overdue':
        return { bg: '#ef444420', text: '#ef4444' };
      case 'Cancelled':
        return { bg: '#6b728020', text: '#6b7280' };
      case 'Generated':
      case 'Sent':
      default:
        return { bg: '#3b82f620', text: '#3b82f6' };
    }
  }

  // Visual summary cards
  const summaryCards = [
    {
      title: 'Total Invoices',
      value: summary?.totalInvoices ?? 0,
      icon: FileText,
      color: theme.brand,
      bg: `${theme.brand}15`
    },
    {
      title: 'Paid',
      value: summary?.paid ?? 0,
      icon: CheckCircle,
      color: '#10b981',
      bg: '#10b98115'
    },
    {
      title: 'Overdue',
      value: summary?.overdue ?? 0,
      icon: AlertCircle,
      color: '#ef4444',
      bg: '#ef444415'
    },
    {
      title: 'Outstanding',
      value: formatCurrency(summary?.outstanding ?? 0),
      icon: DollarSign,
      color: '#f59e0b',
      bg: '#f59e0b15'
    }
  ];

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
          {summaryCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <View
                key={i}
                style={[
                  styles.metricCard,
                  { backgroundColor: theme.secondaryBg, borderColor: theme.border }
                ]}
              >
                <View style={[styles.metricIconBox, { backgroundColor: card.bg }]}>
                  <Icon size={20} color={card.color} />
                </View>
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{card.title}</Text>
                  <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{card.value}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Search & Action Row */}
      <View style={{ paddingHorizontal: 16, paddingTop:4, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={[styles.searchBox, { flex: 1, backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Search size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search invoices, bookings, clients..."
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

        {/* Status Horizontal Pill Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {STATUS_OPTIONS.map((status) => {
            const isSelected = statusFilter === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? theme.brand : theme.secondaryBg,
                    borderColor: isSelected ? theme.brand : theme.border,
                  },
                ]}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#ffffff' : theme.textSecondary }]}>
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isListLoading && isListRefetching} onRefresh={refetchList} />}
      >
        {isListLoading && !isListRefetching ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.brand} />
            <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Fetching invoices...</Text>
          </View>
        ) : invoices.length > 0 ? (
          <View style={{ gap: 12 }}>
            {invoices.map((inv) => {
              const badgeColors = getStatusColor(inv.status);
              return (
                <TouchableOpacity
                  key={inv.invoiceId}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedInvoice(inv);
                    setDetailModalOpen(true);
                  }}
                  style={[styles.quoteCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color={theme.brand} />
                      <Text style={[styles.quoteNumberText, { color: theme.textPrimary }]}>{inv.invoiceNumber}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                      <Text style={[styles.statusText, { color: badgeColors.text }]}>{inv.status}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={{ gap: 8 }}>
                    <View style={styles.gridRow}>
                      <User size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary }]}>
                        <Text style={{ color: theme.textSecondary }}>Client: </Text>
                        {inv.leadName}
                      </Text>
                    </View>

                    <View style={styles.gridRow}>
                      <Building size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary }]} numberOfLines={1}>
                        <Text style={{ color: theme.textSecondary }}>Property: </Text>
                        {inv.propertyName} {inv.flatName ? `· Unit ${inv.flatName}` : ''}
                      </Text>
                    </View>

                    {inv.milestoneName ? (
                      <View style={styles.gridRow}>
                        <Info size={14} color={theme.textMuted} />
                        <Text style={[styles.gridText, { color: theme.textPrimary }]} numberOfLines={1}>
                          <Text style={{ color: theme.textSecondary }}>Milestone: </Text>
                          {inv.milestoneName} (Installment {inv.installmentNumber})
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.gridRow}>
                      <DollarSign size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary, fontWeight: '600' }]}>
                        <Text style={{ color: theme.textSecondary, fontWeight: '400' }}>Outstanding / Total: </Text>
                        {formatCurrency(inv.outstandingAmount)} / {formatCurrency(inv.totalAmount)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      Due Date: {formatDate(inv.dueDate)}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      Booking: {inv.bookingNumber}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Invoices Found</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              There are no invoices matching your filters.
            </Text>
          </View>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={[styles.paginationRow, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
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

      {/* DETAIL MODAL */}
      <Modal visible={isDetailModalOpen} transparent animationType="fade" onRequestClose={() => setDetailModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FileText size={20} color={theme.brand} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Tax Invoice View</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedInvoice ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Information: GSTIN, Tax Invoice, Number & Status */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.inputBg, padding: 12, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary }}>GSTIN: <Text style={{ fontWeight: '500', color: theme.textMuted }}>Not Available</Text></Text>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 2 }}>
                      <Phone size={12} color={theme.textSecondary} />
                      <Text style={{ fontSize: 11, color: theme.textSecondary }}>{selectedInvoice.leadContact || '—'}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View style={{ backgroundColor: theme.brand, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>TAX INVOICE</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedInvoice.status).bg, paddingVertical: 1, paddingHorizontal: 6 }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(selectedInvoice.status).text, textTransform: 'uppercase', fontSize: 9 }]}>{selectedInvoice.status}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginTop: 2 }}>{selectedInvoice.invoiceNumber}</Text>
                  </View>
                </View>

                {/* Info Cards Side-by-Side */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  {/* BILL TO */}
                  <View style={[styles.detailCard, { flex: 1, backgroundColor: theme.secondaryBg, borderColor: theme.border, padding: 12, marginBottom: 0 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 4 }}>
                      <User size={13} color="#b45309" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#b45309', letterSpacing: 0.5 }}>BILL TO</Text>
                    </View>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: theme.textPrimary, marginBottom: 4 }}>{selectedInvoice.leadName}</Text>
                    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                      <Phone size={10} color={theme.textSecondary} />
                      <Text style={{ fontSize: 10, color: theme.textSecondary }} numberOfLines={1}>{selectedInvoice.leadContact || '—'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                      <Mail size={10} color={theme.textSecondary} />
                      <Text style={{ fontSize: 10, color: theme.textSecondary }} numberOfLines={1}>{selectedInvoice.leadEmail || '—'}</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textPrimary }}><Text style={{ color: theme.textSecondary, fontWeight: '400' }}>Booking: </Text>{selectedInvoice.bookingNumber}</Text>
                  </View>
                  
                  {/* INVOICE DETAILS */}
                  <View style={[styles.detailCard, { flex: 1, backgroundColor: theme.secondaryBg, borderColor: theme.border, padding: 12, marginBottom: 0 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 4 }}>
                      <FileText size={13} color="#b45309" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#b45309', letterSpacing: 0.5 }}>INVOICE DETAILS</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 4 }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Invoice Date: </Text>{formatDate(selectedInvoice.invoiceDate)}</Text>
                    <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 4 }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Due Date: </Text>{formatDate(selectedInvoice.dueDate)}</Text>
                    <Text style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 4 }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Property: </Text>{selectedInvoice.propertyName}</Text>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}><Text style={{ fontWeight: '600', color: theme.textPrimary }}>Unit: </Text>{selectedInvoice.flatName || '—'}</Text>
                  </View>
                </View>

                {/* Items Table */}
                <View style={{ marginBottom: 14 }}>
                  <View style={[styles.itemsTable, { borderColor: theme.border }]}>
                    <View style={[styles.tableHeader, { backgroundColor: theme.brand, borderBottomColor: theme.border }]}>
                      <Text style={[styles.thText, { flex: 0.3, color: '#ffffff' }]}>#</Text>
                      <Text style={[styles.thText, { flex: 2, color: '#ffffff' }]}>DESCRIPTION</Text>
                      <Text style={[styles.thText, { flex: 0.5, textAlign: 'center', color: '#ffffff' }]}>QTY</Text>
                      <Text style={[styles.thText, { flex: 1, textAlign: 'right', color: '#ffffff' }]}>RATE</Text>
                      <Text style={[styles.thText, { flex: 1, textAlign: 'right', color: '#ffffff' }]}>AMOUNT</Text>
                    </View>
                    
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item, idx) => (
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
                          {selectedInvoice.milestoneName 
                            ? `${selectedInvoice.milestoneName} Payment` 
                            : "Property Booking Invoice"}
                        </Text>
                        <Text style={{ flex: 0.5, textAlign: 'center', fontSize: 11, color: theme.textPrimary }}>1</Text>
                        <Text style={{ flex: 1, textAlign: 'right', fontSize: 11, color: theme.textPrimary }}>{formatCurrency(selectedInvoice.amount)}</Text>
                        <Text style={{ flex: 1, textAlign: 'right', fontSize: 11, color: theme.textPrimary, fontWeight: '500' }}>{formatCurrency(selectedInvoice.amount)}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Table Summary details right-aligned */}
                <View style={{ alignItems: 'flex-end', marginBottom: 14 }}>
                  <View style={[styles.pricingSummary, { width: '70%', backgroundColor: theme.secondaryBg, borderColor: theme.border, padding: 10, marginTop: 0 }]}>
                    <View style={styles.summaryRow}>
                      <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Subtotal</Text>
                      <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: '600' }}>{formatCurrency(selectedInvoice.amount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={{ color: theme.textSecondary, fontSize: 11 }}>GST (5%)</Text>
                      <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: '600' }}>{formatCurrency(selectedInvoice.taxAmount)}</Text>
                    </View>
                    
                    {/* Total Amount in bold white on dark blue background */}
                    <View style={[styles.summaryRow, { backgroundColor: theme.brand, padding: 6, borderRadius: 6, marginVertical: 4 }]}>
                      <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>Total Amount</Text>
                      <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>{formatCurrency(selectedInvoice.totalAmount)}</Text>
                    </View>

                    {/* Amount Paid in light orange background */}
                    <View style={[styles.summaryRow, { backgroundColor: '#fef3c7', padding: 6, borderRadius: 6, marginVertical: 2 }]}>
                      <Text style={{ color: '#d97706', fontWeight: '600', fontSize: 11 }}>Amount Paid</Text>
                      <Text style={{ color: '#d97706', fontWeight: '700', fontSize: 11 }}>{formatCurrency(selectedInvoice.paidAmount)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Balance Due</Text>
                      <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 11 }}>{formatCurrency(selectedInvoice.outstandingAmount)}</Text>
                    </View>
                  </View>
                </View>

                {/* PAYMENT HISTORY */}
                {selectedInvoice.paidAmount > 0 ? (
                  <View style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Clock size={14} color="#b45309" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#b45309', letterSpacing: 0.5 }}>PAYMENT HISTORY</Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: theme.inputBg,
                      borderLeftWidth: 3,
                      borderLeftColor: theme.brand,
                      borderColor: theme.border,
                      borderWidth: 1,
                    }}>
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary }}>REC-2026-{selectedInvoice.invoiceNumber.split('-').pop()}</Text>
                        <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>{formatDate(selectedInvoice.invoiceDate)} · Cash</Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#10b981' }}>{formatCurrency(selectedInvoice.paidAmount)}</Text>
                    </View>
                  </View>
                ) : null}

                {/* PAYMENT TERMS */}
                <View style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <FileText size={14} color={theme.brand} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textPrimary, letterSpacing: 0.5 }}>PAYMENT TERMS</Text>
                  </View>
                  <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border, padding: 12, marginBottom: 0 }]}>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 4 }}>• Payment due by the date mentioned above.</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 4 }}>• Late payments may incur additional charges.</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 4 }}>• All amounts are in Indian Rupees (INR).</Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>• This is a computer-generated invoice.</Text>
                  </View>
                </View>

                {/* Notes Container */}
                {selectedInvoice.notes ? (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Notes</Text>
                    <View style={[styles.notesContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                      <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>{selectedInvoice.notes}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Footer centered text */}
                <View style={{ marginTop: 12, marginBottom: 24, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: theme.textMuted, fontStyle: 'italic' }}>
                    Thank you for your business!
                  </Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* GENERATE / CREATE INVOICE FORM MODAL */}
      <Modal visible={isFormModalOpen} transparent animationType="slide" onRequestClose={() => setFormModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.formModalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Generate Invoice</Text>
              <TouchableOpacity onPress={() => setFormModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ gap: 14, paddingBottom: 24 }}>
                
                {/* Select Booking Section */}
                <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border, padding: 12, marginBottom: 4 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Building size={16} color={theme.brand} />
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, fontSize: 13, fontWeight: '700' }]}>Select Booking</Text>
                  </View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Booking *</Text>
                  <TouchableOpacity
                    onPress={() => setBookingSelectOpen(true)}
                    style={[styles.selectBox, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                  >
                    <Text style={{ color: selectedBooking ? theme.textPrimary : theme.textMuted, fontSize: 13 }}>
                      {selectedBooking
                        ? `${selectedBooking.bookingNumber} (${selectedBooking.leadName})`
                        : 'Search bookings...'}
                    </Text>
                    <ChevronDown size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Invoice Details Section */}
                <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border, padding: 12, marginBottom: 4 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <FileText size={16} color={theme.brand} />
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, fontSize: 13, fontWeight: '700' }]}>Invoice Details</Text>
                  </View>

                  {/* Row 1: InvoiceNumber & Invoice Date */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>InvoiceNumber</Text>
                      <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, opacity: 0.6, marginTop: 6 }]}>
                        <TextInput
                          style={[styles.formTextInput, { color: theme.textSecondary }]}
                          value="INV-2026-0002"
                          editable={false}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Invoice Date *</Text>
                      <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                        <TextInput
                          style={[styles.formTextInput, { color: theme.textPrimary }]}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={theme.textMuted}
                          value={invoiceDate}
                          onChangeText={setInvoiceDate}
                        />
                        <Calendar size={14} color={theme.textSecondary} />
                      </View>
                    </View>
                  </View>

                  {/* Row 2: Amount & TaxAmount */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Amount *</Text>
                      <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                        <Text style={{ color: theme.textPrimary, fontSize: 13, marginRight: 4 }}>₹</Text>
                        <TextInput
                          style={[styles.formTextInput, { color: theme.textPrimary }]}
                          placeholder="0.00"
                          placeholderTextColor={theme.textMuted}
                          keyboardType="numeric"
                          value={customAmount}
                          onChangeText={setCustomAmount}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>TaxAmount</Text>
                      <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, opacity: 0.6, marginTop: 6 }]}>
                        <Text style={{ color: theme.textSecondary, fontSize: 13, marginRight: 4 }}>₹</Text>
                        <TextInput
                          style={[styles.formTextInput, { color: theme.textSecondary }]}
                          value={taxAmount}
                          editable={false}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Row 3: TotalAmount & Due Date */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>TotalAmount</Text>
                      <View style={[
                        styles.formInputContainer, 
                        { 
                          backgroundColor: '#fef3c7', 
                          borderColor: '#f59e0b', 
                          opacity: 0.8,
                          marginTop: 6
                        }
                      ]}>
                        <Text style={{ color: '#d97706', fontSize: 13, fontWeight: '700', marginRight: 4 }}>₹</Text>
                        <TextInput
                          style={[styles.formTextInput, { color: '#d97706', fontWeight: '700' }]}
                          value={(parseFloat(customAmount) + parseFloat(taxAmount) || 0).toString()}
                          editable={false}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Due Date *</Text>
                      <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                        <TextInput
                          style={[styles.formTextInput, { color: theme.textPrimary }]}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={theme.textMuted}
                          value={dueDate}
                          onChangeText={setDueDate}
                        />
                        <Calendar size={14} color={theme.textSecondary} />
                      </View>
                    </View>
                  </View>

                  {/* Row 4: Status */}
                  <View style={{ marginBottom: 4 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Status *</Text>
                    <TouchableOpacity
                      onPress={() => setStatusSelectOpen(true)}
                      style={[styles.selectBox, { backgroundColor: theme.secondaryBg, borderColor: theme.border, height: 48 }]}
                    >
                      <Text style={{ color: theme.textPrimary, fontSize: 13 }}>
                        {status}
                      </Text>
                      <ChevronDown size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Notes Section */}
                <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border, padding: 12, marginBottom: 14 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <FileText size={16} color={theme.brand} />
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, fontSize: 13, fontWeight: '700' }]}>Notes</Text>
                  </View>
                  <TextInput
                    style={[styles.notesTextArea, { backgroundColor: theme.secondaryBg, borderColor: theme.border, color: theme.textPrimary, marginTop: 6 }]}
                    multiline
                    numberOfLines={4}
                    placeholder="Additional invoice notes..."
                    placeholderTextColor={theme.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                {/* Submit Action */}
                <TouchableOpacity
                  onPress={handleGenerateInvoiceSubmit}
                  disabled={generateInvoiceMutation.isPending}
                  style={[styles.submitBtn, { backgroundColor: theme.brand }]}
                >
                  {generateInvoiceMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Generate Invoice</Text>
                  )}
                </TouchableOpacity>

              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Booking Search Modal */}
      <SearchableSelectModal
        visible={isBookingSelectOpen}
        title="Select Booking"
        items={bookingsList}
        searchKey="bookingNumber"
        labelKey="bookingNumber"
        secondaryLabelKey="leadName"
        onSelect={handleBookingSelect}
        onClose={() => setBookingSelectOpen(false)}
        placeholder="Search booking number..."
      />

      {/* Status Search Modal */}
      <SearchableSelectModal
        visible={isStatusSelectOpen}
        title="Select Status"
        items={STATUS_OPTIONS.filter(s => s !== 'All').map(s => ({ statusName: s }))}
        searchKey="statusName"
        labelKey="statusName"
        onSelect={(item) => setStatus(item.statusName)}
        onClose={() => setStatusSelectOpen(false)}
        placeholder="Search status..."
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  metricCard: {
    width: 120,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginRight: 4,
  },
  metricIconBox: {
    width: 26,
    height: 26,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  metricVal: {
    fontSize: 15,
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
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quoteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteNumberText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
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
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  formModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    height: '90%',
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
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  pricingSummary: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  itemsTable: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  notesContainer: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectBox: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  formInputContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  formTextInput: {
    flex: 1,
    fontSize: 13,
  },
  notesTextArea: {
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 13,
    marginTop: 6,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  selectModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    maxHeight: '75%',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
  },
  selectOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectOptionSubText: {
    fontSize: 11,
    marginTop: 2,
  }
});
