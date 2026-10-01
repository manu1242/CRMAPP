import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  usePublicLeadsQuery,
  usePublicLeadStatsQuery,
  useDeletePublicLeadMutation,
  useBulkDeletePublicLeadsMutation,
} from '../hooks/usePublicLeads';
import { PublicLeadItem, PublicLeadType } from '../models/publicLead';
import { PublicLeadCard, getTypeColor } from './PublicLeadCard';

const PAGE_SIZE = 15;

const TYPE_TABS: { key: string; label: string; icon: any }[] = [
  { key: 'All', label: 'All', icon: 'layers-outline' },
  { key: 'Enquiry', label: 'Enquiries', icon: 'mail-outline' },
  { key: 'Callback', label: 'Callbacks', icon: 'call-outline' },
  { key: 'SiteVisit', label: 'Site Visits', icon: 'calendar-outline' },
  { key: 'Support', label: 'Support', icon: 'help-buoy-outline' },
];

export const PublicLeadsContent: React.FC = () => {
  const { isDark } = useTheme();

  // Local state
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

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

  // Colors
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#e2e8f0';
  const inputBg = isDark ? '#1e293b' : '#ffffff';

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

  const handleBulkDelete = () => {
    if (selectedLeadIds.length === 0) return;
    Alert.alert(
      'Bulk Delete Leads',
      `Are you sure you want to permanently delete ${selectedLeadIds.length} lead(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textColor }]}>Public Leads & Inquiries</Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Captured enquiries, callbacks, site visits & support requests
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            const nextMode = !isSelectionMode;
            setIsSelectionMode(nextMode);
            if (!nextMode) setSelectedLeadIds([]);
          }}
          style={[
            styles.selectModeBtn,
            isSelectionMode
              ? { backgroundColor: '#ef4444' }
              : { backgroundColor: isDark ? '#334155' : '#e2e8f0' },
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.selectModeBtnText,
              { color: isSelectionMode ? '#ffffff' : textColor },
            ]}
          >
            {isSelectionMode ? 'Cancel' : 'Select'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Stats Badges Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          {/* Total */}
          <View style={[styles.statBadgeCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={[styles.statIconBox, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}>
              <Ionicons name="layers" size={14} color="#3b82f6" />
            </View>
            <View>
              <Text style={[styles.statVal, { color: textColor }]}>
                {stats?.totalLeads ?? totalRecords}
              </Text>
              <Text style={[styles.statLbl, { color: subTextColor }]}>Total Leads</Text>
            </View>
          </View>

          {/* Enquiries */}
          <View style={[styles.statBadgeCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={[styles.statIconBox, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}>
              <Ionicons name="mail" size={14} color="#2563eb" />
            </View>
            <View>
              <Text style={[styles.statVal, { color: '#2563eb' }]}>
                {stats?.totalEnquiries ?? 0}
              </Text>
              <Text style={[styles.statLbl, { color: subTextColor }]}>Enquiries</Text>
            </View>
          </View>

          {/* Callbacks */}
          <View style={[styles.statBadgeCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={[styles.statIconBox, { backgroundColor: isDark ? '#78350f30' : '#fffbeb' }]}>
              <Ionicons name="call" size={14} color="#f59e0b" />
            </View>
            <View>
              <Text style={[styles.statVal, { color: '#f59e0b' }]}>
                {stats?.totalCallbacks ?? 0}
              </Text>
              <Text style={[styles.statLbl, { color: subTextColor }]}>Callbacks</Text>
            </View>
          </View>

          {/* Site Visits */}
          <View style={[styles.statBadgeCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={[styles.statIconBox, { backgroundColor: isDark ? '#581c8730' : '#f5f3ff' }]}>
              <Ionicons name="calendar" size={14} color="#8b5cf6" />
            </View>
            <View>
              <Text style={[styles.statVal, { color: '#8b5cf6' }]}>
                {stats?.totalSiteVisits ?? 0}
              </Text>
              <Text style={[styles.statLbl, { color: subTextColor }]}>Site Visits</Text>
            </View>
          </View>

          {/* Support */}
          <View style={[styles.statBadgeCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={[styles.statIconBox, { backgroundColor: isDark ? '#7f1d1d30' : '#fef2f2' }]}>
              <Ionicons name="help-buoy" size={14} color="#ef4444" />
            </View>
            <View>
              <Text style={[styles.statVal, { color: '#ef4444' }]}>
                {stats?.totalSupport ?? 0}
              </Text>
              <Text style={[styles.statLbl, { color: subTextColor }]}>Support</Text>
            </View>
          </View>
        </ScrollView>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor: borderCol }]}>
          <Ionicons name="search-outline" size={18} color={subTextColor} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search by name, phone, message, or company..."
            placeholderTextColor={subTextColor}
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
              <Ionicons name="close-circle" size={18} color={subTextColor} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Type Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeTabsScroll}
        >
          {TYPE_TABS.map((tab) => {
            const active = selectedType === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => {
                  setSelectedType(tab.key);
                  setPage(1);
                }}
                style={[
                  styles.tabChip,
                  active
                    ? { backgroundColor: '#2563eb', borderColor: '#2563eb' }
                    : {
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        borderColor: borderCol,
                      },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={13}
                  color={active ? '#ffffff' : subTextColor}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.tabChipText,
                    { color: active ? '#ffffff' : textColor },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Multi-selection Toolbar */}
        {isSelectionMode && (
          <View style={[styles.bulkBar, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllBtn}>
              <Ionicons
                name={
                  selectedLeadIds.length === items.length && items.length > 0
                    ? 'checkbox'
                    : 'square-outline'
                }
                size={18}
                color="#2563eb"
              />
              <Text style={[styles.selectAllText, { color: textColor }]}>
                {selectedLeadIds.length === items.length && items.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.selectedCountText, { color: subTextColor }]}>
              {selectedLeadIds.length} Selected
            </Text>

            <TouchableOpacity
              onPress={handleBulkDelete}
              disabled={selectedLeadIds.length === 0 || bulkDeleteMutation.isPending}
              style={[
                styles.bulkDeleteBtn,
                { opacity: selectedLeadIds.length === 0 ? 0.4 : 1 },
              ]}
            >
              {bulkDeleteMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="trash" size={14} color="#ffffff" />
                  <Text style={styles.bulkDeleteBtnText}>Delete ({selectedLeadIds.length})</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Lead List Area */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={[styles.loadingText, { color: subTextColor }]}>
              Loading public leads & inquiries...
            </Text>
          </View>
        ) : isError ? (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2',
                borderColor: isDark ? '#7f1d1d' : '#fecaca',
              },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={36} color="#ef4444" />
            <Text style={styles.errorTitle}>Failed to load leads</Text>
            <Text style={[styles.errorDesc, { color: subTextColor }]}>
              An error occurred while communicating with the server.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
              <Ionicons name="refresh" size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <FontAwesome5 name="inbox" size={44} color="#94a3b8" />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {searchQuery || selectedType !== 'All'
                ? 'No matching leads or inquiries'
                : 'No Public Leads Received Yet'}
            </Text>
            <Text style={[styles.emptyDesc, { color: subTextColor }]}>
              {searchQuery || selectedType !== 'All'
                ? 'Try adjusting your search terms or filter selection.'
                : 'Public inquiries submitted on your platform, callback requests and site visits will appear here.'}
            </Text>
          </View>
        ) : (
          <>
            {items.map((lead) => (
              <PublicLeadCard
                key={lead.leadId}
                lead={lead}
                isSelected={selectedLeadIds.includes(lead.leadId)}
                onToggleSelect={handleToggleSelect}
                isSelectionMode={isSelectionMode}
              />
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={[
                    styles.pageBtn,
                    {
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      opacity: page <= 1 ? 0.4 : 1,
                    },
                  ]}
                >
                  <Ionicons name="chevron-back" size={16} color={textColor} />
                  <Text style={[styles.pageBtnText, { color: textColor }]}>Previous</Text>
                </TouchableOpacity>

                <Text style={[styles.pageIndicator, { color: subTextColor }]}>
                  Page <Text style={{ fontWeight: '800', color: textColor }}>{page}</Text> of{' '}
                  <Text style={{ fontWeight: '800', color: textColor }}>{totalPages}</Text>
                </Text>

                <TouchableOpacity
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={[
                    styles.pageBtn,
                    {
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      opacity: page >= totalPages ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.pageBtnText, { color: textColor }]}>Next</Text>
                  <Ionicons name="chevron-forward" size={16} color={textColor} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  selectModeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectModeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  statsScroll: {
    gap: 8,
    paddingVertical: 8,
  },
  statBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 115,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginTop: 6,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: 42,
  },
  typeTabsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bulkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bulkDeleteBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 10,
  },
  errorDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pageIndicator: {
    fontSize: 12,
  },
});
