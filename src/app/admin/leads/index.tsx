import React, { useState, useMemo, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  ChevronDown,
  Check,
  X,
  RotateCcw,
  Calendar,
  Layers,
  Tag,
  Building,
  ArrowUpDown,
  UserX,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { usePermissions } from '../../../authorization/hooks/usePermission';
import { useLeadsQuery } from '../../../admin/hooks/useLeadsQuery';
import ConnectionStateView from '../../components/ConnectionStateView';
import { LeadItem } from '../../../admin/models/LeadTypes';
import LeadCard from '../../../admin/components/LeadCard';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';

// ─── Filter Options (Web Parity) ─────────────────────────────────────────────

const STATUS_OPTIONS = ['All', 'Active', 'New', 'Contacted', 'Qualified', 'Lost', 'Cold', 'Warm', 'Hot'];

const STAGE_OPTIONS = [
  'All',
  'New',
  'Enquiry',
  'Contacted',
  'Site Visit Requested',
  'Site Visit Done',
  'Quotation',
  'Quotation Sent',
  'Negotiation',
  'Booked',
  'Lost',
];

type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const DATE_PRESET_OPTIONS: { id: DatePreset; label: string }[] = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

const PROPERTY_TYPE_OPTIONS = ['All', 'Apartment', 'Villa', 'Plot', 'Commercial', 'Residential'];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First', sortBy: 'createdDate', sortDir: 'desc' },
  { id: 'oldest', label: 'Oldest First', sortBy: 'createdDate', sortDir: 'asc' },
  { id: 'name_asc', label: 'Name (A - Z)', sortBy: 'name', sortDir: 'asc' },
  { id: 'name_desc', label: 'Name (Z - A)', sortBy: 'name', sortDir: 'desc' },
];

function getDateRange(preset: DatePreset, customFrom?: string, customTo?: string): { from?: string; to?: string } {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === 'today') {
    const todayStr = formatYMD(now);
    return { from: todayStr, to: todayStr };
  }
  if (preset === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yStr = formatYMD(y);
    return { from: yStr, to: yStr };
  }
  if (preset === 'week') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const startOfWeek = new Date(d.setDate(diff));
    return { from: formatYMD(startOfWeek), to: formatYMD(now) };
  }
  if (preset === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: formatYMD(startOfMonth), to: formatYMD(now) };
  }
  if (preset === 'custom') {
    return {
      from: customFrom?.trim() || undefined,
      to: customTo?.trim() || undefined,
    };
  }
  return {};
}

export default function LeadsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const { canCreate, canEdit } = usePermissions();

  // Search & Pagination State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Active Filter State
  const [status, setStatus] = useState('');
  const [stage, setStage] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [isUnassignedOnly, setIsUnassignedOnly] = useState(false);
  const [sortOption, setSortOption] = useState('newest');

  // Modal Visibility State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Active Filter Section Tab inside Modal
  const [activeModalTab, setActiveModalTab] = useState<'date' | 'stage' | 'status' | 'property' | 'sort'>('date');

  // Draft Filter State inside Modal (applied upon clicking Apply Filters)
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftStage, setDraftStage] = useState(stage);
  const [draftDatePreset, setDraftDatePreset] = useState(datePreset);
  const [draftCustomFrom, setDraftCustomFrom] = useState(customFrom);
  const [draftCustomTo, setDraftCustomTo] = useState(customTo);
  const [draftPropertyType, setDraftPropertyType] = useState(propertyType);
  const [draftIsUnassignedOnly, setDraftIsUnassignedOnly] = useState(isUnassignedOnly);
  const [draftSortOption, setDraftSortOption] = useState(sortOption);

  // Resolve Sort By & Dir
  const selectedSort = useMemo(
    () => SORT_OPTIONS.find((s) => s.id === sortOption) || SORT_OPTIONS[0],
    [sortOption]
  );

  // Resolve Date Range
  const { from, to } = useMemo(
    () => getDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo]
  );

  // Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (status) count++;
    if (stage) count++;
    if (datePreset !== 'all') count++;
    if (propertyType) count++;
    if (isUnassignedOnly) count++;
    if (sortOption !== 'newest') count++;
    return count;
  }, [status, stage, datePreset, propertyType, isUnassignedOnly, sortOption]);

  // Lead Query Params with full parity
  const queryParams = useMemo(() => ({
    page,
    pageSize: 10,
    search: search || undefined,
    status: status || undefined,
    stage: stage || undefined,
    propertyType: propertyType || undefined,
    from: from || undefined,
    to: to || undefined,
    executiveId: isUnassignedOnly ? 0 : undefined,
    sortBy: selectedSort.sortBy,
    sortDir: selectedSort.sortDir,
  }), [page, search, status, stage, propertyType, from, to, isUnassignedOnly, selectedSort]);

  // TanStack Query
  const { data, isLoading, error, refetch } = useLeadsQuery(queryParams);

  const responseData = data?.data;
  const leads = responseData?.items || [];
  const totalCount = responseData?.totalCount || 0;
  const totalPages = responseData?.totalPages || 1;
  const pageNumber = page;

  // Search Handlers
  const handleSearchSubmit = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // Open Modal & sync draft state
  const openFilterModal = () => {
    setDraftStatus(status);
    setDraftStage(stage);
    setDraftDatePreset(datePreset);
    setDraftCustomFrom(customFrom);
    setDraftCustomTo(customTo);
    setDraftPropertyType(propertyType);
    setDraftIsUnassignedOnly(isUnassignedOnly);
    setDraftSortOption(sortOption);
    setIsFilterModalOpen(true);
  };

  // Apply Modal Filters
  const applyModalFilters = () => {
    setStatus(draftStatus);
    setStage(draftStage);
    setDatePreset(draftDatePreset);
    setCustomFrom(draftCustomFrom);
    setCustomTo(draftCustomTo);
    setPropertyType(draftPropertyType);
    setIsUnassignedOnly(draftIsUnassignedOnly);
    setSortOption(draftSortOption);
    setPage(1);
    setIsFilterModalOpen(false);
  };

  // Reset All Filters
  const resetAllFilters = useCallback(() => {
    setPage(1);
    setStatus('');
    setStage('');
    setDatePreset('all');
    setCustomFrom('');
    setCustomTo('');
    setPropertyType('');
    setIsUnassignedOnly(false);
    setSortOption('newest');
    setSearch('');
    setSearchInput('');
  }, []);

  const resetDraftFilters = () => {
    setDraftStatus('');
    setDraftStage('');
    setDraftDatePreset('all');
    setDraftCustomFrom('');
    setDraftCustomTo('');
    setDraftPropertyType('');
    setDraftIsUnassignedOnly(false);
    setDraftSortOption('newest');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Theme colors
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomSpacing + 20, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brandCol} colors={[brandCol]} />}
      >
        {/* ── Top Bar: Filter Button, Search Box, Add Button ── */}
        <View style={styles.headerBar}>
          {/* Filter Modal Trigger Button with Active Count Badge */}
          <TouchableOpacity
            onPress={openFilterModal}
            style={[
              styles.filterBtn,
              {
                backgroundColor: activeFilterCount > 0 ? (isDark ? '#064e3b' : '#ecfdf5') : cardBg,
                borderColor: activeFilterCount > 0 ? brandCol : borderCol,
              },
            ]}
            activeOpacity={0.7}
          >
            <Filter size={15} color={activeFilterCount > 0 ? brandCol : subTextColor} />
            <Text
              style={[
                styles.filterBtnText,
                { color: activeFilterCount > 0 ? brandCol : textColor },
              ]}
            >
              {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
            </Text>
            <ChevronDown size={14} color={activeFilterCount > 0 ? brandCol : subTextColor} />
          </TouchableOpacity>

          {/* Search Input Box */}
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Search size={18} color={subTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search...."
              placeholderTextColor={subTextColor}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchInput !== '' && (
              <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={subTextColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Create Lead Plus Button */}
          {canCreate('Leads') && (
            <TouchableOpacity
              onPress={() => router.push('/admin/leads/AddLead')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.addBtn,
                  { backgroundColor: cardBg, borderColor: borderCol },
                ]}
              >
                <Plus size={18} color={brandCol} />
                <Text style={[styles.filterBtnText, { color: brandCol }]}>Add</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Quick Chips / Active Filter Chips Row (Web Parity) ── */}
        <View style={styles.chipsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {/* If any filter is active: show Clear All chip */}
            {activeFilterCount > 0 && (
              <TouchableOpacity
                onPress={resetAllFilters}
                style={[styles.chipPill, { backgroundColor: isDark ? '#7f1d1d33' : '#fef2f2', borderColor: '#ef4444' }]}
                activeOpacity={0.7}
              >
                <RotateCcw size={12} color="#ef4444" />
                <Text style={[styles.chipText, { color: '#ef4444', fontWeight: '700' }]}>Clear All</Text>
              </TouchableOpacity>
            )}

            {/* Active Chip: Date */}
            {datePreset !== 'all' && (
              <TouchableOpacity
                onPress={() => { setDatePreset('all'); setPage(1); }}
                style={[styles.chipPill, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: brandCol }]}
              >
                <Calendar size={12} color={brandCol} />
                <Text style={[styles.chipText, { color: brandCol }]}>
                  {DATE_PRESET_OPTIONS.find((d) => d.id === datePreset)?.label || 'Custom Date'}
                </Text>
                <X size={12} color={brandCol} />
              </TouchableOpacity>
            )}

            {/* Active Chip: Stage */}
            {stage !== '' && (
              <TouchableOpacity
                onPress={() => { setStage(''); setPage(1); }}
                style={[styles.chipPill, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: brandCol }]}
              >
                <Layers size={12} color={brandCol} />
                <Text style={[styles.chipText, { color: brandCol }]}>{stage}</Text>
                <X size={12} color={brandCol} />
              </TouchableOpacity>
            )}

            {/* Active Chip: Status */}
            {status !== '' && (
              <TouchableOpacity
                onPress={() => { setStatus(''); setPage(1); }}
                style={[styles.chipPill, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: brandCol }]}
              >
                <Tag size={12} color={brandCol} />
                <Text style={[styles.chipText, { color: brandCol }]}>{status}</Text>
                <X size={12} color={brandCol} />
              </TouchableOpacity>
            )}

            {/* Active Chip: Property Type */}
            {propertyType !== '' && (
              <TouchableOpacity
                onPress={() => { setPropertyType(''); setPage(1); }}
                style={[styles.chipPill, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: brandCol }]}
              >
                <Building size={12} color={brandCol} />
                <Text style={[styles.chipText, { color: brandCol }]}>{propertyType}</Text>
                <X size={12} color={brandCol} />
              </TouchableOpacity>
            )}

            {/* Active Chip: Unassigned */}
            {isUnassignedOnly && (
              <TouchableOpacity
                onPress={() => { setIsUnassignedOnly(false); setPage(1); }}
                style={[styles.chipPill, { backgroundColor: isDark ? '#78350f33' : '#fffbeb', borderColor: '#f59e0b' }]}
              >
                <UserX size={12} color="#f59e0b" />
                <Text style={[styles.chipText, { color: '#f59e0b', fontWeight: '700' }]}>Unassigned</Text>
                <X size={12} color="#f59e0b" />
              </TouchableOpacity>
            )}

            {/* Active Chip: Sort */}
            {sortOption !== 'newest' && (
              <TouchableOpacity
                onPress={() => { setSortOption('newest'); setPage(1); }}
                style={[styles.chipPill, { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff', borderColor: '#6366f1' }]}
              >
                <ArrowUpDown size={12} color="#6366f1" />
                <Text style={[styles.chipText, { color: '#6366f1' }]}>{selectedSort.label}</Text>
                <X size={12} color="#6366f1" />
              </TouchableOpacity>
            )}

            {/* Quick Preset Shortcut Chips (when filter not active) */}
            {datePreset !== 'today' && (
              <TouchableOpacity
                onPress={() => { setDatePreset('today'); setPage(1); }}
                style={[styles.chipPill, { backgroundColor: cardBg, borderColor: borderCol }]}
              >
                <Text style={[styles.chipText, { color: subTextColor }]}>Today</Text>
              </TouchableOpacity>
            )}

            {datePreset !== 'week' && (
              <TouchableOpacity
                onPress={() => { setDatePreset('week'); setPage(1); }}
                style={[styles.chipPill, { backgroundColor: cardBg, borderColor: borderCol }]}
              >
                <Text style={[styles.chipText, { color: subTextColor }]}>This Week</Text>
              </TouchableOpacity>
            )}

            {datePreset !== 'month' && (
              <TouchableOpacity
                onPress={() => { setDatePreset('month'); setPage(1); }}
                style={[styles.chipPill, { backgroundColor: cardBg, borderColor: borderCol }]}
              >
                <Text style={[styles.chipText, { color: subTextColor }]}>This Month</Text>
              </TouchableOpacity>
            )}

            {!isUnassignedOnly && (
              <TouchableOpacity
                onPress={() => { setIsUnassignedOnly(true); setPage(1); }}
                style={[styles.chipPill, { backgroundColor: cardBg, borderColor: borderCol }]}
              >
                <Text style={[styles.chipText, { color: subTextColor }]}>Unassigned</Text>
              </TouchableOpacity>
            )}

            {stage !== 'Booked' && (
              <TouchableOpacity
                onPress={() => { setStage('Booked'); setPage(1); }}
                style={[styles.chipPill, { backgroundColor: cardBg, borderColor: borderCol }]}
              >
                <Text style={[styles.chipText, { color: subTextColor }]}>Booked</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* ── Summary Count / Active Criteria ── */}
        <View style={styles.resultsSummaryBar}>
          <Text style={[styles.summaryText, { color: subTextColor }]}>
            Showing <Text style={{ fontWeight: '700', color: textColor }}>{leads.length}</Text> of <Text style={{ fontWeight: '700', color: textColor }}>{totalCount}</Text> leads
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={resetAllFilters}>
              <Text style={{ fontSize: 12, color: brandCol, fontWeight: '600' }}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Connection & Query State ── */}
        <ConnectionStateView
          isLoading={isLoading}
          error={error}
          hasData={leads.length > 0}
          onRetry={refetch}
          isRetrying={isLoading}
        >
          {isLoading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={brandCol} />
              <Text style={[styles.loadingText, { color: subTextColor }]}>Fetching leads list...</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {leads.length > 0 ? (
                leads.map((lead: LeadItem) => (
                  <LeadCard
                    key={lead.leadId}
                    lead={lead}
                    canAssign={canEdit('Leads')}
                    canEditStage={canEdit('Leads')}
                    onAssignmentChange={() => refetch()}
                    onStageChange={() => refetch()}
                  />
                ))
              ) : (
                /* Simple Empty State */
                <View style={[styles.emptyContainer, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No Leads Found</Text>
                  <Text style={[styles.emptySub, { color: subTextColor }]}>
                    No leads match your current filter criteria. Try adjusting or resetting your filters.
                  </Text>
                  <TouchableOpacity onPress={resetAllFilters} style={[styles.resetBtn, { backgroundColor: brandCol }]}>
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Clear All Filters</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Simple Pagination Row */}
              {totalPages > 1 && (
                <View style={[styles.paginationRow, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <TouchableOpacity
                    disabled={pageNumber <= 1}
                    onPress={() => setPage(pageNumber - 1)}
                    style={[
                      styles.pageBtn,
                      { backgroundColor: inputBg, opacity: pageNumber <= 1 ? 0.4 : 1 },
                    ]}
                  >
                    <ChevronLeft size={18} color={textColor} />
                    <Text style={[styles.pageBtnText, { color: textColor }]}>Prev</Text>
                  </TouchableOpacity>

                  <Text style={[styles.pageIndicator, { color: textColor }]}>
                    Page <Text style={{ fontWeight: '700' }}>{pageNumber}</Text> of {totalPages}
                  </Text>

                  <TouchableOpacity
                    disabled={pageNumber >= totalPages}
                    onPress={() => setPage(pageNumber + 1)}
                    style={[
                      styles.pageBtn,
                      { backgroundColor: inputBg, opacity: pageNumber >= totalPages ? 0.4 : 1 },
                    ]}
                  >
                    <Text style={[styles.pageBtnText, { color: textColor }]}>Next</Text>
                    <ChevronRight size={18} color={textColor} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ConnectionStateView>
      </ScrollView>

      {/* ── Complete Web Parity Filter Modal ── */}
      <Modal visible={isFilterModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: borderCol }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: borderCol }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Filter size={18} color={brandCol} />
                <Text style={[styles.modalTitle, { color: textColor }]}>Filter Leads</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <TouchableOpacity onPress={resetDraftFilters}>
                  <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsFilterModalOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color={subTextColor} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Section Tabs */}
            <View style={[styles.modalTabsRow, { borderBottomColor: borderCol }]}>
              <TouchableOpacity
                onPress={() => setActiveModalTab('date')}
                style={[styles.modalTabItem, activeModalTab === 'date' && { borderBottomColor: brandCol, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalTabLabel, { color: activeModalTab === 'date' ? brandCol : subTextColor }]}>
                  Date
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveModalTab('stage')}
                style={[styles.modalTabItem, activeModalTab === 'stage' && { borderBottomColor: brandCol, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalTabLabel, { color: activeModalTab === 'stage' ? brandCol : subTextColor }]}>
                  Stage {draftStage ? '•' : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveModalTab('status')}
                style={[styles.modalTabItem, activeModalTab === 'status' && { borderBottomColor: brandCol, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalTabLabel, { color: activeModalTab === 'status' ? brandCol : subTextColor }]}>
                  Status {draftStatus ? '•' : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveModalTab('property')}
                style={[styles.modalTabItem, activeModalTab === 'property' && { borderBottomColor: brandCol, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalTabLabel, { color: activeModalTab === 'property' ? brandCol : subTextColor }]}>
                  Property {draftPropertyType ? '•' : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveModalTab('sort')}
                style={[styles.modalTabItem, activeModalTab === 'sort' && { borderBottomColor: brandCol, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalTabLabel, { color: activeModalTab === 'sort' ? brandCol : subTextColor }]}>
                  Sort
                </Text>
              </TouchableOpacity>
            </View>

            {/* Modal Body: Active Tab Content */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Date Presets Tab */}
              {activeModalTab === 'date' && (
                <View style={styles.tabSection}>
                  <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>Select Date Preset</Text>
                  <View style={styles.optionsWrap}>
                    {DATE_PRESET_OPTIONS.map((opt) => {
                      const isSelected = draftDatePreset === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          onPress={() => setDraftDatePreset(opt.id)}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: isSelected ? (isDark ? '#064e3b' : '#ecfdf5') : inputBg,
                              borderColor: isSelected ? brandCol : borderCol,
                            },
                          ]}
                        >
                          <Text style={[styles.optionChipText, { color: isSelected ? brandCol : textColor, fontWeight: isSelected ? '700' : '500' }]}>
                            {opt.label}
                          </Text>
                          {isSelected && <Check size={14} color={brandCol} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom Date Range Input Fields */}
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>Or Custom Date (YYYY-MM-DD)</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: subTextColor, marginBottom: 4 }}>From</Text>
                        <TextInput
                          style={[styles.dateInput, { backgroundColor: inputBg, borderColor: borderCol, color: textColor }]}
                          placeholder="2026-01-01"
                          placeholderTextColor={subTextColor}
                          value={draftCustomFrom}
                          onChangeText={(v) => {
                            setDraftCustomFrom(v);
                            setDraftDatePreset('custom');
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: subTextColor, marginBottom: 4 }}>To</Text>
                        <TextInput
                          style={[styles.dateInput, { backgroundColor: inputBg, borderColor: borderCol, color: textColor }]}
                          placeholder="2026-12-31"
                          placeholderTextColor={subTextColor}
                          value={draftCustomTo}
                          onChangeText={(v) => {
                            setDraftCustomTo(v);
                            setDraftDatePreset('custom');
                          }}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Stage Filter Tab */}
              {activeModalTab === 'stage' && (
                <View style={styles.tabSection}>
                  <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>Select Lead Stage</Text>
                  <View style={styles.optionsWrap}>
                    {STAGE_OPTIONS.map((opt) => {
                      const isSelected = (opt === 'All' && !draftStage) || draftStage.toLowerCase() === opt.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => setDraftStage(opt === 'All' ? '' : opt)}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: isSelected ? (isDark ? '#064e3b' : '#ecfdf5') : inputBg,
                              borderColor: isSelected ? brandCol : borderCol,
                            },
                          ]}
                        >
                          <Text style={[styles.optionChipText, { color: isSelected ? brandCol : textColor, fontWeight: isSelected ? '700' : '500' }]}>
                            {opt}
                          </Text>
                          {isSelected && <Check size={14} color={brandCol} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Status Filter Tab */}
              {activeModalTab === 'status' && (
                <View style={styles.tabSection}>
                  <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>Select Lead Status</Text>
                  <View style={styles.optionsWrap}>
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = (opt === 'All' && !draftStatus) || draftStatus.toLowerCase() === opt.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => setDraftStatus(opt === 'All' ? '' : opt)}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: isSelected ? (isDark ? '#064e3b' : '#ecfdf5') : inputBg,
                              borderColor: isSelected ? brandCol : borderCol,
                            },
                          ]}
                        >
                          <Text style={[styles.optionChipText, { color: isSelected ? brandCol : textColor, fontWeight: isSelected ? '700' : '500' }]}>
                            {opt}
                          </Text>
                          {isSelected && <Check size={14} color={brandCol} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Property Type Tab & Unassigned Toggle */}
              {activeModalTab === 'property' && (
                <View style={styles.tabSection}>
                  <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>Property Type</Text>
                  <View style={styles.optionsWrap}>
                    {PROPERTY_TYPE_OPTIONS.map((opt) => {
                      const isSelected = (opt === 'All' && !draftPropertyType) || draftPropertyType.toLowerCase() === opt.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => setDraftPropertyType(opt === 'All' ? '' : opt)}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: isSelected ? (isDark ? '#064e3b' : '#ecfdf5') : inputBg,
                              borderColor: isSelected ? brandCol : borderCol,
                            },
                          ]}
                        >
                          <Text style={[styles.optionChipText, { color: isSelected ? brandCol : textColor, fontWeight: isSelected ? '700' : '500' }]}>
                            {opt}
                          </Text>
                          {isSelected && <Check size={14} color={brandCol} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Assignment Filter */}
                  <View style={{ marginTop: 20 }}>
                    <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>Assignment Status</Text>
                    <TouchableOpacity
                      onPress={() => setDraftIsUnassignedOnly(!draftIsUnassignedOnly)}
                      style={[
                        styles.toggleRow,
                        {
                          backgroundColor: draftIsUnassignedOnly ? (isDark ? '#78350f33' : '#fffbeb') : inputBg,
                          borderColor: draftIsUnassignedOnly ? '#f59e0b' : borderCol,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <UserX size={16} color={draftIsUnassignedOnly ? '#f59e0b' : subTextColor} />
                        <Text style={[styles.optionChipText, { color: draftIsUnassignedOnly ? '#f59e0b' : textColor, fontWeight: '600' }]}>
                          Show Unassigned Leads Only
                        </Text>
                      </View>
                      {draftIsUnassignedOnly && <Check size={16} color="#f59e0b" />}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Sort Order Tab */}
              {activeModalTab === 'sort' && (
                <View style={styles.tabSection}>
                  <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>Sort Leads By</Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = draftSortOption === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          onPress={() => setDraftSortOption(opt.id)}
                          style={[
                            styles.sortOptionRow,
                            {
                              backgroundColor: isSelected ? (isDark ? '#064e3b' : '#ecfdf5') : inputBg,
                              borderColor: isSelected ? brandCol : borderCol,
                            },
                          ]}
                        >
                          <Text style={[styles.optionChipText, { color: isSelected ? brandCol : textColor, fontWeight: isSelected ? '700' : '500' }]}>
                            {opt.label}
                          </Text>
                          {isSelected && <Check size={16} color={brandCol} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer Actions */}
            <View style={[styles.modalFooter, { borderTopColor: borderCol }]}>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                style={[styles.cancelBtn, { borderColor: borderCol }]}
              >
                <Text style={{ fontSize: 13, color: subTextColor, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={applyModalFilters}
                style={[styles.applyBtn, { backgroundColor: brandCol }]}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: '700' }}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
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
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 6,
  },
  filterBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  searchBox: {
    flex: 1,
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
    fontSize: 13.5,
  },
  chipsSection: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultsSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 4,
  },
  summaryText: {
    fontSize: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 18,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pageIndicator: {
    fontSize: 13,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  modalTabItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  modalTabLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  modalBody: {
    maxHeight: 360,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  tabSection: {
    paddingBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionChipText: {
    fontSize: 13,
  },
  dateInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  applyBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
