import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  Platform,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  RefreshCw,
  Trash2,
  Inbox,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Filter,
  Plus,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import {
  usePublicLeadsQuery,
  usePublicLeadStatsQuery,
  useDeletePublicLeadMutation,
  useBulkDeletePublicLeadsMutation,
} from '../hooks/usePublicLeads';
import { PublicLeadItem, PublicLeadType } from '../models/publicLead';
import { PublicLeadCard } from './PublicLeadCard';
import { PublicLeadStatsRow } from './PublicLeadStatsRow';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';

const PAGE_SIZE = 15;

const TYPE_PILLS = [
  { key: 'All', label: 'All' },
  { key: 'Enquiry', label: 'Enquiries' },
  { key: 'Callback', label: 'Callbacks' },
  { key: 'SiteVisit', label: 'Site Visits' },
  { key: 'Support', label: 'Support' },
];

export const PublicLeadsContent: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  // State
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  // Queries
  const {
    data: leadsData,
    isLoading,
    isError,
    refetch: refetchLeads,
    isRefetching,
  } = usePublicLeadsQuery({
    page,
    pageSize: PAGE_SIZE,
    type: selectedType !== 'All' ? (selectedType as PublicLeadType) : undefined,
    search: searchQuery,
  });

  const { data: statsData, refetch: refetchStats } = usePublicLeadStatsQuery();
  const deleteMutation = useDeletePublicLeadMutation();
  const bulkDeleteMutation = useBulkDeletePublicLeadsMutation();

  const paginatedData = leadsData?.data;
  const items: PublicLeadItem[] = Array.isArray(paginatedData?.items) ? paginatedData.items : [];
  const totalRecords = paginatedData?.totalRecords || items.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const stats = statsData?.data;

  // Handlers
  const handleRefresh = async () => {
    await Promise.all([refetchLeads(), refetchStats()]);
  };

  const handleToggleSelect = (leadId: number) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === items.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(items.map((i) => i.leadId));
    }
  };

  const handleSingleDelete = (lead: PublicLeadItem) => {
    Alert.alert(
      'Delete Public Lead',
      `Are you sure you want to delete lead #${lead.leadId} for "${lead.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(lead.leadId),
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.length === 0) return;
    Alert.alert(
      'Bulk Delete Leads',
      `Are you sure you want to permanently delete ${selectedLeadIds.length} public lead(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await bulkDeleteMutation.mutateAsync(selectedLeadIds);
            setSelectedLeadIds([]);
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>
      {/* Top Header Row with Back Button */}
      <View
        style={[
          styles.headerRow,
          {
            borderBottomColor: theme.border,
            paddingTop: Platform.OS === 'android' ? Math.max(14, insets.top) : Math.max(10, insets.top),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.navigate('/superadmin/dashboard');
          }}
          style={[styles.backBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[styles.pageTitle, { color: theme.textPrimary }]}>
            Public Leads
          </Text>
          <Text numberOfLines={1} style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
            Central website inquiries, callbacks & site visits
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Refresh Button */}
          <TouchableOpacity
            onPress={handleRefresh}
            style={[styles.headerActionBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Add Lead Button */}
          <TouchableOpacity
            onPress={() => router.push('/superadmin/create-tenant')}
            style={[
              styles.selectToggleBtn,
              {
                backgroundColor: theme.brand,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              },
            ]}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.selectToggleText}>Add Lead</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpacing + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[theme.brand]}
            tintColor={theme.brand}
          />
        }
      >
        {/* KPI Stats Row (Web replica) */}
        <View style={styles.statsSection}>
          <PublicLeadStatsRow
            stats={stats}
            totalFallback={totalRecords}
            selectedType={selectedType}
            onSelectType={(type) => {
              setSelectedType(type);
              setPage(1);
            }}
          />
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.filterSection}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Search size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search by name, phone, message, company..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                setPage(1);
              }}
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
              >
                <X size={16} color={theme.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Quick Action Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScroll}
          >
            {TYPE_PILLS.map((pill) => {
              const isActive = selectedType === pill.key;
              return (
                <TouchableOpacity
                  key={pill.key}
                  onPress={() => {
                    setSelectedType(pill.key);
                    setPage(1);
                  }}
                  style={[
                    styles.pillChip,
                    isActive
                      ? { backgroundColor: theme.brand, borderColor: theme.brand }
                      : { backgroundColor: theme.cardBg, borderColor: theme.border },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: isActive ? '#ffffff' : theme.textSecondary },
                    ]}
                  >
                    {pill.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Multi-Selection Toolbar */}
        {isSelectionMode && (
          <View style={[styles.bulkToolbar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllBtn}>
              {selectedLeadIds.length === items.length && items.length > 0 ? (
                <CheckSquare size={18} color={theme.brand} />
              ) : (
                <Square size={18} color={theme.textSecondary} />
              )}
              <Text style={[styles.selectAllText, { color: theme.textPrimary }]}>
                {selectedLeadIds.length === items.length && items.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.selectedCount, { color: theme.textSecondary }]}>
              {selectedLeadIds.length} Selected
            </Text>

            <TouchableOpacity
              onPress={handleBulkDelete}
              disabled={selectedLeadIds.length === 0 || bulkDeleteMutation.isPending}
              style={[
                styles.bulkDeleteBtn,
                { opacity: selectedLeadIds.length === 0 ? 0.4 : 1 },
              ]}
              activeOpacity={0.8}
            >
              {bulkDeleteMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Trash2 size={13} color="#ffffff" />
                  <Text style={styles.bulkDeleteText}>Delete ({selectedLeadIds.length})</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Lead List Section */}
        {(isLoading && !leadsData) ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.brand} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading public leads...
            </Text>
          </View>
        ) : isError ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2',
                borderColor: isDark ? '#7f1d1d' : '#fecaca',
              },
            ]}
          >
            <AlertCircle size={36} color="#ef4444" />
            <Text style={styles.errorTitle}>Failed to load leads</Text>
            <Text style={[styles.errorDesc, { color: theme.textSecondary }]}>
              An error occurred while fetching public leads from the server.
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.brand }]}
              onPress={handleRefresh}
            >
              <RefreshCw size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Inbox size={42} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {searchQuery || selectedType !== 'All'
                ? 'No matching leads'
                : 'No Public Leads Yet'}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {searchQuery || selectedType !== 'All'
                ? 'Try adjusting your search query or switching the type filter.'
                : 'Public inquiries submitted on the portal, callback requests, and site visits will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {items.map((lead) => (
              <PublicLeadCard
                key={lead.leadId}
                lead={lead}
                isSelected={selectedLeadIds.includes(lead.leadId)}
                onToggleSelect={handleToggleSelect}
                isSelectionMode={isSelectionMode}
                onDelete={handleSingleDelete}
              />
            ))}

            {/* Pagination Row */}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={[
                    styles.pageBtn,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      opacity: page <= 1 ? 0.35 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={16} color={theme.textPrimary} />
                  <Text style={[styles.pageBtnText, { color: theme.textPrimary }]}>Prev</Text>
                </TouchableOpacity>

                <Text style={[styles.pageIndicator, { color: theme.textSecondary }]}>
                  Page <Text style={{ fontWeight: '800', color: theme.textPrimary }}>{page}</Text> of{' '}
                  <Text style={{ fontWeight: '800', color: theme.textPrimary }}>{totalPages}</Text>
                </Text>

                <TouchableOpacity
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={[
                    styles.pageBtn,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      opacity: page >= totalPages ? 0.35 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pageBtnText, { color: theme.textPrimary }]}>Next</Text>
                  <ChevronRight size={16} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 10,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectToggleBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 8,
  },
  selectToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollContent: {
    paddingTop: 12,
  },
  statsSection: {
    marginBottom: 12,
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  pillsScroll: {
    gap: 8,
  },
  pillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bulkToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  selectedCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  bulkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bulkDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  listContainer: {
    paddingTop: 2,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  errorBox: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 10,
  },
  errorDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 14,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyBox: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  pageBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  pageIndicator: {
    fontSize: 12.5,
  },
});
