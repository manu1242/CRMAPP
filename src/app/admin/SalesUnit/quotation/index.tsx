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
import { useRouter } from 'expo-router';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  X,
  Building,
  User,
  DollarSign
} from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useQuotations } from '../../../../admin/hooks/useQuotations';

const STATUS_OPTIONS = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];


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



export default function QuotationsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);

  // Ref for auto-scrolling the main list
  const scrollViewRef = useRef<ScrollView>(null);

  // Filter and pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Main React Query hook for quotations list
  const {
    data: listResponse,
    isLoading: isListLoading,
    isRefetching: isListRefetching,
    refetch: refetchList,
  } = useQuotations(page, pageSize, statusFilter === 'All' ? undefined : statusFilter, searchQuery);

  const quotations = listResponse?.data?.items ?? [];
  const totalCount = listResponse?.data?.totalCount ?? 0;
  const totalPages = listResponse?.data?.totalPages ?? 1;

  // Auto-scroll to bottom when a new quotation is added
  const prevCountRef = useRef(quotations.length);
  useEffect(() => {
    if (quotations.length > prevCountRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300); // small delay lets the list render first
    }
    prevCountRef.current = quotations.length;
  }, [quotations.length]);

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return { bg: isDark ? '#064e3b' : '#d1fae5', text: isDark ? '#34d399' : '#059669' };
      case 'Rejected':
        return { bg: isDark ? '#7f1d1d' : '#fee2e2', text: isDark ? '#f87171' : '#dc2626' };
      case 'Sent':
        return { bg: isDark ? '#1e3a8a' : '#dbeafe', text: isDark ? '#60a5fa' : '#2563eb' };
      case 'Expired':
        return { bg: isDark ? '#3f3f46' : '#f4f4f5', text: isDark ? '#a1a1aa' : '#71717a' };
      case 'Draft':
      default:
        return { bg: isDark ? '#27272a' : '#f3f4f6', text: isDark ? '#d4d4d8' : '#4b5563' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.primaryBg, borderBottomColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Quotations</Text>
        </View>

      </View>

      {/* Filters & Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={[styles.searchBox, { flex: 1, backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Search size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search quotations, leads, or notes..."
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
            onPress={() => {
              router.push('/admin/SalesUnit/quotation/CreateQuotation');
            }}
            style={[styles.createBtn, { backgroundColor: theme.brand }]}
          >
            <Plus size={20} color="#ffffff" />
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
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isListLoading && isListRefetching} onRefresh={refetchList} />}
      >
        {isListLoading && !isListRefetching ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.brand} />
            <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Fetching quotations...</Text>
          </View>
        ) : quotations.length > 0 ? (
          <View style={{ gap: 12 }}>
            {quotations.map((q) => {
              const badgeColors = getStatusColor(q.status);
              return (
                <TouchableOpacity
                  key={q.quotationId}
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push(`/admin/SalesUnit/quotation/${q.quotationId}` as any);
                  }}
                  style={[styles.quoteCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color={theme.brand} />
                      <Text style={[styles.quoteNumberText, { color: theme.textPrimary }]}>{q.quotationNumber}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                      <Text style={[styles.statusText, { color: badgeColors.text }]}>{q.status}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={{ gap: 8 }}>
                    <View style={styles.gridRow}>
                      <User size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary }]}>
                        <Text style={{ color: theme.textSecondary }}>Lead: </Text>
                        {q.leadName}
                      </Text>
                    </View>

                    <View style={styles.gridRow}>
                      <Building size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary }]} numberOfLines={1}>
                        <Text style={{ color: theme.textSecondary }}>Property: </Text>
                        {q.propertyName} {q.flatNumber ? `· Unit ${q.flatNumber}` : ''}
                      </Text>
                    </View>

                    <View style={styles.gridRow}>
                      <DollarSign size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary, fontWeight: '600' }]}>
                        <Text style={{ color: theme.textSecondary, fontWeight: '400' }}>Grand Total: </Text>
                        {formatCurrency(q.grandTotal)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      Created: {formatDate(q.createdOn)}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      Valid: {formatDate(q.validUntil)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Quotations Found</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              There are no quotations matching your current filters.
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

      {/* Creation and editing modals removed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,

  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  createBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 12,
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
    flex: 1,
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
  },
  pageBtn: {
    padding: 8,
    borderRadius: 10,
  },
});