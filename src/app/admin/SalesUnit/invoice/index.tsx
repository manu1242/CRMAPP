import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  X,
  Building,
  User,
  DollarSign,
  Info,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useInvoices } from '../../../../admin/hooks/useInvoices';

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

export default function InvoicesPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);
  const params = useLocalSearchParams<{ search?: string }>();

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Apply deep-link search param
  useEffect(() => {
    if (params.search) {
      setSearchInput(params.search);
      setSearchQuery(params.search);
    }
  }, [params.search]);

  const {
    data: invoicesResponse,
    isLoading: isListLoading,
    isRefetching: isListRefetching,
    refetch: refetchList,
  } = useInvoices(page, pageSize, statusFilter === 'All' ? undefined : statusFilter, searchQuery);

  const invoices = invoicesResponse?.data?.items ?? [];
  const totalPages = invoicesResponse?.data?.totalPages ?? 1;
  const summary = invoicesResponse?.data?.summary;

  // Auto-scroll to bottom when new invoice appears
  const scrollViewRef = useRef<ScrollView>(null);
  const prevCountRef = useRef(invoices.length);
  useEffect(() => {
    if (invoices.length > prevCountRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
    }
    prevCountRef.current = invoices.length;
  }, [invoices.length]);

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  // Summary cards
  const summaryCards = [
    { title: 'Total', value: summary?.totalInvoices ?? 0, icon: FileText, color: theme.brand, bg: `${theme.brand}15` },
    { title: 'Paid', value: summary?.paid ?? 0, icon: CheckCircle, color: '#10b981', bg: '#10b98115' },
    { title: 'Overdue', value: summary?.overdue ?? 0, icon: AlertCircle, color: '#ef4444', bg: '#ef444415' },
    { title: 'Outstanding', value: formatCurrency(summary?.outstanding ?? 0), icon: DollarSign, color: '#f59e0b', bg: '#f59e0b15' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>

      {/* Summary Metric Strip */}
      {summary ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}
        >
          {summaryCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <View key={i} style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
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

      {/* Search & Create Row */}
      <View style={{ paddingHorizontal: 16, paddingTop: 4, gap: 12, flexShrink: 0 }}>
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
              <TouchableOpacity onPress={() => { setSearchInput(''); setSearchQuery(''); }}>
                <X size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/admin/SalesUnit/invoice/GenerateInvoice' as any)}
            style={[styles.createBtn, { backgroundColor: theme.brand }]}
          >
            <Plus size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Status Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {STATUS_OPTIONS.map((s) => {
            const isSelected = statusFilter === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => { setStatusFilter(s); setPage(1); }}
                style={[styles.pill, { backgroundColor: isSelected ? theme.brand : theme.secondaryBg, borderColor: isSelected ? theme.brand : theme.border }]}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#ffffff' : theme.textSecondary }]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 16 }}
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
              const badge = getStatusColor(inv.status);
              return (
                <TouchableOpacity
                  key={inv.invoiceId}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/admin/SalesUnit/invoice/${inv.invoiceId}` as any)}
                  style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color={theme.brand} />
                      <Text style={[styles.cardNumber, { color: theme.textPrimary }]}>{inv.invoiceNumber}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>{inv.status}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={{ gap: 8 }}>
                    <View style={styles.gridRow}>
                      <User size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary }]}>
                        <Text style={{ color: theme.textSecondary }}>Client: </Text>{inv.leadName}
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

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>Due: {formatDate(inv.dueDate)}</Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>Booking: {inv.bookingNumber}</Text>
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
            <Text style={{ color: theme.textPrimary, fontSize: 13 }}>Page {page} of {totalPages}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  metricCard: { width: 120, height: 100, borderRadius: 16, borderWidth: 1, padding: 12, marginRight: 4 },
  metricIconBox: { width: 26, height: 26, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  metricLabel: { fontSize: 11, fontWeight: '500' },
  metricVal: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  createBtn: { justifyContent: 'center', alignItems: 'center', width: 44, height: 44, borderRadius: 12 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { fontSize: 15, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, marginVertical: 12 },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gridText: { fontSize: 13, flex: 1 },
  emptyContainer: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 13, textAlign: 'center' },
  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: 8, borderRadius: 12, borderWidth: 1 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
