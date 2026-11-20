import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
  CreditCard,
  ChevronLeft,
  ChevronDown,
  Search,
  X,
  Download,
  RotateCw,
  Calendar,
  Building2,
  Layers,
  Hash,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
} from 'lucide-react-native';
import {
  subscriptionService,
  CrmTransactionItem,
  CrmTxStats,
} from '../../../../admin/services/subscriptionService';
import { useBottomNavSpacing } from '../../../../hooks/useBottomNavSpacing';
import { getApiUrl } from '../../../../api/remoteConfig';

// Status options matching web
const STATUS_OPTIONS = [
  'All Status',
  'Success',
  'Pending',
  'Failed',
  'Cancelled',
  'Refunded',
  'Expired',
];

// Type options matching web
const TYPE_OPTIONS = [
  'All Types',
  'Payment',
  'Upgrade',
  'Scheduled Payment',
  'Downgrade',
  'Renewal',
  'Admin Assignment',
  'Failed Payment',
  'Refund',
  'Cancellation',
];

// Sort options matching web
const SORT_OPTIONS = [
  { label: 'Newest first', value: 'date-desc' },
  { label: 'Amount: high to low', value: 'amount-desc' },
  { label: 'Amount: low to high', value: 'amount-asc' },
];

export default function CrmTransactionsScreen() {
  const router = useRouter();
  const { bottomSpacing } = useBottomNavSpacing();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CrmTransactionItem[]>([]);
  const [stats, setStats] = useState<CrmTxStats>({
    totalTransactions: 0,
    successfulTransactions: 0,
    netRevenue: 0,
    pendingTransactions: 0,
    totalPayments: 0,
    totalRefunds: 0,
    totalPaidAmount: 0,
  });

  // Filter & Search states (matching web)
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedType, setSelectedType] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('date-desc');

  // Modal Picker States
  const [pickerModalType, setPickerModalType] = useState<'status' | 'type' | 'sort' | 'export' | 'date' | null>(null);
  const [dateFieldTarget, setDateFieldTarget] = useState<'from' | 'to'>('from');
  const [tempDateInput, setTempDateInput] = useState('');

  // Fetch transactions from backend API
  const fetchCrmTransactions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const params: any = {
        page: 1,
        pageSize: 50,
      };

      if (selectedStatus && selectedStatus !== 'All Status') {
        params.status = selectedStatus;
      }
      if (selectedType && selectedType !== 'All Types') {
        params.type = selectedType;
      }
      if (fromDate) {
        params.fromDate = fromDate;
      }
      if (toDate) {
        params.toDate = toDate;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (selectedSort) {
        params.sortBy = selectedSort;
      }

      const res = await subscriptionService.getCrmTransactions(params);
      if (res && res.success && res.data) {
        setTransactions(res.data.transactions || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err: any) {
      console.warn('Error fetching CRM transactions:', err?.message);
      Toast.show({
        type: 'error',
        text1: 'Failed to load transactions',
        text2: err?.message || 'Please check your connection and try again',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus, selectedType, fromDate, toDate, searchQuery, selectedSort]);

  useEffect(() => {
    fetchCrmTransactions();
  }, [fetchCrmTransactions]);

  // Clear filters
  const handleClearFilters = () => {
    setSelectedStatus('All Status');
    setSelectedType('All Types');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setSelectedSort('date-desc');
  };

  const hasActiveFilters =
    selectedStatus !== 'All Status' ||
    selectedType !== 'All Types' ||
    !!fromDate ||
    !!toDate ||
    !!searchQuery.trim() ||
    selectedSort !== 'date-desc';

  // Invoice Download
  const handleDownloadInvoice = (tx: CrmTransactionItem) => {
    try {
      const baseUrl = getApiUrl().replace(/\/$/, '');
      const downloadUrl = `${baseUrl}/SaasSubscription/DownloadInvoice?transactionId=${tx.transactionId}`;
      Linking.openURL(downloadUrl);
      Toast.show({
        type: 'info',
        text1: 'Downloading Invoice / Receipt',
        text2: `Invoice #${tx.invoiceNumber} requested`,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: 'Could not open invoice download link',
      });
    }
  };

  // Retry Payment
  const handleRetryPayment = async (tx: CrmTransactionItem) => {
    try {
      setActionLoadingId(tx.transactionId);
      const res = await subscriptionService.retryCrmTransaction(tx.transactionId);
      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Retry Payment Initiated',
          text2: 'Redirecting to payment checkout...',
        });
        const baseUrl = getApiUrl().replace(/\/$/, '');
        const payUrl = `${baseUrl}/SaasSubscription/Pay?orderId=${tx.razorpayOrderId || tx.transactionReference}`;
        Linking.openURL(payUrl);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Retry Unavailable',
          text2: res?.message || 'Payment retry failed',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Retry Failed',
        text2: err?.message || 'Could not retry payment',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cancel Transaction
  const handleCancelPayment = (tx: CrmTransactionItem) => {
    Alert.alert(
      'Cancel this payment?',
      'The pending payment link will no longer be available.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel payment',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(tx.transactionId);
              const res = await subscriptionService.cancelCrmTransaction(tx.transactionId);
              if (res && res.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Payment Cancelled',
                  text2: 'Transaction marked as Cancelled',
                });
                fetchCrmTransactions(true);
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Cancellation Failed',
                  text2: res?.message || 'Could not cancel transaction',
                });
              }
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err?.message || 'Failed to cancel transaction',
              });
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // Export handlers
  const handleExport = (format: 'excel' | 'csv') => {
    setPickerModalType(null);
    const baseUrl = getApiUrl().replace(/\/$/, '');
    const statusParam = selectedStatus !== 'All Status' ? selectedStatus : '';
    const typeParam = selectedType !== 'All Types' ? selectedType : '';
    const exportUrl = `${baseUrl}/SaasSubscription/ExportTransactions?format=${format}&status=${encodeURIComponent(statusParam)}&type=${encodeURIComponent(typeParam)}&fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
    Linking.openURL(exportUrl);
    Toast.show({
      type: 'info',
      text1: `Exporting as ${format.toUpperCase()}`,
      text2: 'Download started in browser',
    });
  };

  // Date formatter matching web format: Nov 11, 2026 08:41
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${month} ${day}, ${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  // Status Badge Helper matching web classes
  const getStatusBadgeStyle = (statusStr?: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'SUCCESS' || s === 'COMPLETED') {
      return {
        bg: '#dcfce7',
        text: '#166534',
        label: 'SUCCESS',
      };
    }
    if (s === 'EXPIRED') {
      return {
        bg: '#e2e8f0',
        text: '#334155',
        label: 'EXPIRED',
      };
    }
    if (s === 'CANCELLED') {
      return {
        bg: '#f1f5f9',
        text: '#475569',
        label: 'CANCELLED',
      };
    }
    if (s === 'PENDING') {
      return {
        bg: '#fef3c7',
        text: '#92400e',
        label: 'PENDING',
      };
    }
    if (s === 'REFUNDED') {
      return {
        bg: '#e0e7ff',
        text: '#3730a3',
        label: 'REFUNDED',
      };
    }
    return {
      bg: '#fee2e2',
      text: '#991b1b',
      label: s || 'FAILED',
    };
  };

  // Type Badge Helper matching web classes
  const getTypeBadgeStyle = (typeStr?: string) => {
    const t = (typeStr || '').toLowerCase();
    if (t.includes('upgrade')) {
      return { bg: '#dbeafe', text: '#1e40af' };
    }
    if (t.includes('refund')) {
      return { bg: '#fee2e2', text: '#991b1b' };
    }
    if (t.includes('downgrade')) {
      return { bg: '#fef3c7', text: '#92400e' };
    }
    return { bg: '#dcfce7', text: '#166534' };
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Header Navigation */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: bgColor,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: borderCol,
          }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={textColor} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: textColor }}>CRM Transactions</Text>
          <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>
            Subscriptions / Transactions
          </Text>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          onPress={() => setPickerModalType('export')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: '#e3b063',
          }}
          activeOpacity={0.8}
        >
          <Download size={14} color="#0f223a" />
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#0f223a' }}>Export</Text>
          <ChevronDown size={12} color="#0f223a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: Math.max(bottomSpacing, 110) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchCrmTransactions(true)} />
        }
      >
        {/* Navy Header Card Banner with Stats (Matching Web UI) */}
        <View
          style={{
            backgroundColor: '#0a2542',
            borderRadius: 14,
            padding: 16,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            shadowColor: '#0a2542',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          {/* Header Title Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: 'rgba(212, 164, 90, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <CreditCard size={22} color="#d4a45a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff' }}>CRM Transactions</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                Monitor all CRM subscription payments and transactions
              </Text>
            </View>
          </View>

          {/* 4 Stats KPI Cards in 2x2 Grid (Matching Web) */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {/* Card 1: Total Transactions */}
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#ffffff' }}>
                {stats.totalTransactions}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: 'rgba(255,255,255,0.68)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop: 3,
                }}
              >
                TOTAL TRANSACTIONS
              </Text>
            </View>

            {/* Card 2: Successful */}
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#ffffff' }}>
                {stats.successfulTransactions ?? 0}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: 'rgba(255,255,255,0.68)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop: 3,
                }}
              >
                SUCCESSFUL
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Card 3: Net Revenue */}
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#ffffff' }}>
                ₹{Number(stats.netRevenue ?? 0).toFixed(2)}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: 'rgba(255,255,255,0.68)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop: 3,
                }}
              >
                NET REVENUE
              </Text>
            </View>

            {/* Card 4: Pending */}
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#ffffff' }}>
                {stats.pendingTransactions ?? 0}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: 'rgba(255,255,255,0.68)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop: 3,
                }}
              >
                PENDING
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Section (Matching Web Filters) */}
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: borderCol,
            padding: 12,
            marginBottom: 16,
            gap: 10,
          }}
        >
          {/* Row 1: STATUS & TYPE */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Status Dropdown */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: textColor, textTransform: 'uppercase', marginBottom: 4 }}>
                STATUS
              </Text>
              <TouchableOpacity
                onPress={() => setPickerModalType('status')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: inputBg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 10,
                  paddingVertical: 9,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }} numberOfLines={1}>
                  {selectedStatus}
                </Text>
                <ChevronDown size={14} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* Type Dropdown */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: textColor, textTransform: 'uppercase', marginBottom: 4 }}>
                TYPE
              </Text>
              <TouchableOpacity
                onPress={() => setPickerModalType('type')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: inputBg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 10,
                  paddingVertical: 9,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }} numberOfLines={1}>
                  {selectedType}
                </Text>
                <ChevronDown size={14} color={subTextColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: FROM DATE & TO DATE */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* From Date */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: textColor, textTransform: 'uppercase', marginBottom: 4 }}>
                FROM DATE
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setDateFieldTarget('from');
                  setTempDateInput(fromDate);
                  setPickerModalType('date');
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: inputBg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 10,
                  paddingVertical: 9,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, color: fromDate ? textColor : subTextColor }}>
                  {fromDate || 'mm/dd/yyyy'}
                </Text>
                <Calendar size={13} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* To Date */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: textColor, textTransform: 'uppercase', marginBottom: 4 }}>
                TO DATE
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setDateFieldTarget('to');
                  setTempDateInput(toDate);
                  setPickerModalType('date');
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: inputBg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 10,
                  paddingVertical: 9,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, color: toDate ? textColor : subTextColor }}>
                  {toDate || 'mm/dd/yyyy'}
                </Text>
                <Calendar size={13} color={subTextColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 3: SEARCH TRANSACTIONS */}
          <View>
            <Text style={{ fontSize: 10, fontWeight: '800', color: textColor, textTransform: 'uppercase', marginBottom: 4 }}>
              SEARCH TRANSACTIONS
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: inputBg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: borderCol,
                paddingHorizontal: 10,
                paddingVertical: Platform.OS === 'ios' ? 8 : 4,
                gap: 8,
              }}
            >
              <Search size={14} color={subTextColor} />
              <TextInput
                placeholder="Order, payment ID, amount"
                placeholderTextColor={subTextColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ flex: 1, fontSize: 12, color: textColor, padding: 0 }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color={subTextColor} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Row 4: SORT BY & CLEAR BUTTON */}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: textColor, textTransform: 'uppercase', marginBottom: 4 }}>
                SORT BY
              </Text>
              <TouchableOpacity
                onPress={() => setPickerModalType('sort')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: inputBg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 10,
                  paddingVertical: 9,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }} numberOfLines={1}>
                  {SORT_OPTIONS.find((s) => s.value === selectedSort)?.label || 'Newest first'}
                </Text>
                <ChevronDown size={14} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* Clear Button */}
            <TouchableOpacity
              onPress={handleClearFilters}
              disabled={!hasActiveFilters}
              style={{
                height: 38,
                paddingHorizontal: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: hasActiveFilters ? '#94a3b8' : borderCol,
                backgroundColor: hasActiveFilters ? bgColor : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                opacity: hasActiveFilters ? 1 : 0.5,
              }}
              activeOpacity={0.7}
            >
              <X size={14} color={hasActiveFilters ? textColor : subTextColor} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: hasActiveFilters ? textColor : subTextColor }}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Heading: Transaction History */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color={textColor} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: textColor }}>Transaction History</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor }}>
            {transactions.length} transaction{transactions.length === 1 ? '' : 's'}
          </Text>
        </View>

        {/* Transactions List */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#166299" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading transactions...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View
            style={{
              paddingVertical: 40,
              alignItems: 'center',
              backgroundColor: cardBg,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 24,
            }}
          >
            <CreditCard size={40} color={subTextColor} />
            <Text style={{ marginTop: 12, color: textColor, fontSize: 15, fontWeight: '800' }}>
              No Transactions Found
            </Text>
            <Text style={{ marginTop: 4, color: subTextColor, fontSize: 12, textAlign: 'center' }}>
              {hasActiveFilters
                ? 'No records match your selected filter criteria. Try clearing filters.'
                : 'No CRM subscription transactions found.'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity
                onPress={handleClearFilters}
                style={{
                  marginTop: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: '#166299',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {transactions.map((tx) => {
              const statusBadge = getStatusBadgeStyle(tx.status);
              const typeBadge = getTypeBadgeStyle(tx.transactionType);
              const isActionLoading = actionLoadingId === tx.transactionId;

              return (
                <View
                  key={tx.transactionId}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: borderCol,
                    padding: 14,
                    shadowColor: '#0f223a',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 2,
                    gap: 10,
                  }}
                >
                  {/* Row 1: Reference ID & Amount (Matching Web) */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: '800', color: textColor }}
                        numberOfLines={1}
                        selectable
                      >
                        {tx.transactionReference}
                      </Text>

                      {/* Badges: Type and Status */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 12,
                            backgroundColor: typeBadge.bg,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '700', color: typeBadge.text }}>
                            {tx.transactionType}
                          </Text>
                        </View>

                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 20,
                            backgroundColor: statusBadge.bg,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '800', color: statusBadge.text, letterSpacing: 0.5 }}>
                            {statusBadge.label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Amount */}
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#166299' }}>
                        ₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '600' }}>
                        {tx.currency || 'INR'}
                      </Text>
                    </View>
                  </View>

                  {/* 2x2 Details Grid (Matching Web chips) */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {/* Company Name */}
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: inputBg,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: borderCol,
                        }}
                      >
                        <Building2 size={13} color={subTextColor} />
                        <Text style={{ fontSize: 11, color: textColor, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                          {tx.companyName || 'Hirise Enterprises'}
                        </Text>
                      </View>

                      {/* Date */}
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: inputBg,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: borderCol,
                        }}
                      >
                        <Calendar size={13} color={subTextColor} />
                        <Text style={{ fontSize: 11, color: textColor, flex: 1 }} numberOfLines={1}>
                          {formatDateTime(tx.transactionDate)}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {/* Plan Name & Cycle */}
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: inputBg,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: borderCol,
                        }}
                      >
                        <Layers size={13} color={subTextColor} />
                        <Text style={{ fontSize: 11, color: textColor, flex: 1 }} numberOfLines={1}>
                          {tx.planName} {tx.billingCycle ? `(${tx.billingCycle.toLowerCase()})` : ''}
                        </Text>
                      </View>

                      {/* Payment Method / Gateway */}
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: inputBg,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: borderCol,
                        }}
                      >
                        <CreditCard size={13} color={subTextColor} />
                        <Text style={{ fontSize: 11, color: textColor, flex: 1 }} numberOfLines={1}>
                          {tx.cardNetwork && tx.cardLast4
                            ? `${tx.cardNetwork} **** ${tx.cardLast4}`
                            : tx.paymentMethod || 'Razorpay'}
                        </Text>
                      </View>
                    </View>

                    {/* Success Details: Payment ID and Completed Date */}
                    {statusBadge.label === 'SUCCESS' && (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                        {tx.razorpayPaymentId && (
                          <View
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              backgroundColor: inputBg,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: borderCol,
                            }}
                          >
                            <Hash size={13} color={subTextColor} />
                            <Text style={{ fontSize: 11, color: textColor, flex: 1 }} numberOfLines={1} selectable>
                              {tx.razorpayPaymentId}
                            </Text>
                          </View>
                        )}

                        <View
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: inputBg,
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: borderCol,
                          }}
                        >
                          <CheckCircle2 size={13} color="#166534" />
                          <Text style={{ fontSize: 11, color: textColor, flex: 1 }} numberOfLines={1}>
                            Completed: {formatDateTime(tx.completedDate || tx.transactionDate)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Description / Subtext */}
                  {tx.description && (
                    <Text style={{ fontSize: 11, color: subTextColor, fontStyle: 'italic', marginTop: 2 }}>
                      {tx.description}
                    </Text>
                  )}

                  {/* Failure reason if any */}
                  {tx.failureReason && (
                    <View
                      style={{
                        backgroundColor: '#fee2e2',
                        borderRadius: 8,
                        padding: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <AlertCircle size={13} color="#991b1b" />
                      <Text style={{ fontSize: 11, color: '#991b1b', flex: 1 }}>{tx.failureReason}</Text>
                    </View>
                  )}

                  {/* Actions (Matching Web actions exactly) */}
                  {statusBadge.label === 'SUCCESS' && (
                    <TouchableOpacity
                      onPress={() => handleDownloadInvoice(tx)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderColor: '#166299',
                        borderRadius: 8,
                        paddingVertical: 9,
                        marginTop: 4,
                      }}
                      activeOpacity={0.7}
                    >
                      <Download size={14} color="#166299" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#166299' }}>
                        Download invoice / receipt
                      </Text>
                    </TouchableOpacity>
                  )}

                  {(statusBadge.label === 'PENDING' || statusBadge.label === 'EXPIRED') &&
                    tx.transactionType !== 'Refund' &&
                    tx.transactionType !== 'Cancellation' && (
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        {/* Retry Payment Button */}
                        <TouchableOpacity
                          onPress={() => handleRetryPayment(tx)}
                          disabled={isActionLoading}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            backgroundColor: '#166299',
                            borderRadius: 8,
                            paddingVertical: 9,
                          }}
                          activeOpacity={0.8}
                        >
                          {isActionLoading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <>
                              <RotateCw size={14} color="#ffffff" />
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>
                                Retry Payment
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        {/* Cancel Button */}
                        <TouchableOpacity
                          onPress={() => handleCancelPayment(tx)}
                          disabled={isActionLoading}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            backgroundColor: 'transparent',
                            borderWidth: 1.5,
                            borderColor: '#dc2626',
                            borderRadius: 8,
                            paddingVertical: 9,
                          }}
                          activeOpacity={0.7}
                        >
                          <X size={14} color="#dc2626" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#dc2626' }}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FILTER / SELECTION MODAL */}
      <Modal
        visible={pickerModalType !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setPickerModalType(null)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={() => setPickerModalType(null)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 18,
              width: '100%',
              maxWidth: 380,
              gap: 12,
            }}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                {pickerModalType === 'status' && 'Select Status'}
                {pickerModalType === 'type' && 'Select Type'}
                {pickerModalType === 'sort' && 'Sort Transactions'}
                {pickerModalType === 'export' && 'Export Transactions'}
                {pickerModalType === 'date' && `Select ${dateFieldTarget === 'from' ? 'From' : 'To'} Date`}
              </Text>
              <TouchableOpacity onPress={() => setPickerModalType(null)}>
                <X size={18} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* STATUS PICKER */}
            {pickerModalType === 'status' && (
              <ScrollView style={{ maxHeight: 300 }}>
                {STATUS_OPTIONS.map((item) => {
                  const isSelected = selectedStatus === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setSelectedStatus(item);
                        setPickerModalType(null);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: borderCol,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#166299' : textColor }}>
                        {item}
                      </Text>
                      {isSelected && <CheckCircle2 size={16} color="#166299" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* TYPE PICKER */}
            {pickerModalType === 'type' && (
              <ScrollView style={{ maxHeight: 320 }}>
                {TYPE_OPTIONS.map((item) => {
                  const isSelected = selectedType === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setSelectedType(item);
                        setPickerModalType(null);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: borderCol,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#166299' : textColor }}>
                        {item}
                      </Text>
                      {isSelected && <CheckCircle2 size={16} color="#166299" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* SORT PICKER */}
            {pickerModalType === 'sort' && (
              <View>
                {SORT_OPTIONS.map((item) => {
                  const isSelected = selectedSort === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => {
                        setSelectedSort(item.value);
                        setPickerModalType(null);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: borderCol,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#166299' : textColor }}>
                        {item.label}
                      </Text>
                      {isSelected && <CheckCircle2 size={16} color="#166299" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* EXPORT PICKER */}
            {pickerModalType === 'export' && (
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={() => handleExport('excel')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: inputBg,
                    borderWidth: 1,
                    borderColor: borderCol,
                  }}
                >
                  <FileSpreadsheet size={20} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>Excel (.xlsx)</Text>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Download complete spreadsheet</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleExport('csv')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: inputBg,
                    borderWidth: 1,
                    borderColor: borderCol,
                  }}
                >
                  <FileText size={20} color="#475569" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>CSV (.csv)</Text>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Comma separated values file</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* DATE PICKER MODAL */}
            {pickerModalType === 'date' && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 12, color: subTextColor }}>
                  Enter date in YYYY-MM-DD format (e.g. 2026-11-18) or use quick presets below:
                </Text>

                <TextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={subTextColor}
                  value={tempDateInput}
                  onChangeText={setTempDateInput}
                  style={{
                    backgroundColor: inputBg,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: textColor,
                  }}
                />

                {/* Quick Presets */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setTempDateInput(today);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 6,
                      backgroundColor: inputBg,
                      borderWidth: 1,
                      borderColor: borderCol,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: textColor, fontWeight: '600' }}>Today</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 7);
                      setTempDateInput(d.toISOString().split('T')[0]);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 6,
                      backgroundColor: inputBg,
                      borderWidth: 1,
                      borderColor: borderCol,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: textColor, fontWeight: '600' }}>7 Days Ago</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 30);
                      setTempDateInput(d.toISOString().split('T')[0]);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 6,
                      backgroundColor: inputBg,
                      borderWidth: 1,
                      borderColor: borderCol,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: textColor, fontWeight: '600' }}>30 Days Ago</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setTempDateInput('')}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 6,
                      backgroundColor: inputBg,
                      borderWidth: 1,
                      borderColor: borderCol,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '600' }}>Clear</Text>
                  </TouchableOpacity>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  onPress={() => {
                    if (dateFieldTarget === 'from') {
                      setFromDate(tempDateInput.trim());
                    } else {
                      setToDate(tempDateInput.trim());
                    }
                    setPickerModalType(null);
                  }}
                  style={{
                    backgroundColor: '#166299',
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                    marginTop: 6,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Apply Date</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
