import React, { useState } from 'react';
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
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { usePermissions } from '../../../authorization/hooks/usePermission';
import { useLeadsQuery } from '../../../admin/hooks/useLeadsQuery';
import ConnectionStateView from '../../components/ConnectionStateView';
import { LeadItem } from '../../../admin/models/LeadTypes';
import LeadCard from '../../../admin/components/LeadCard';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';

const STATUS_OPTIONS = ['All', 'Active', 'New', 'Contacted', 'Qualified', 'Lost', 'Cold', 'Warm', 'Hot'];

export default function LeadsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const { canCreate, canEdit } = usePermissions();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  // TanStack Query handles caching, staleTime (3min), and AbortSignal propagation
  const { data, isLoading, error, refetch } = useLeadsQuery({
    page,
    pageSize: 10,
    status: status || undefined,
    search: search || undefined,
  });

  const responseData = data?.data;
  const leads = responseData?.items || [];
  const totalCount = responseData?.totalCount || 0;
  const totalPages = responseData?.totalPages || 1;
  const pageNumber = page;

  const handleSearchSubmit = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleStatusSelect = (selectedStatus: string) => {
    const value = selectedStatus === 'All' ? '' : selectedStatus;
    setStatus(value);
    setPage(1);
  };

  const resetFilters = () => {
    setPage(1);
    setStatus('');
    setSearch('');
    setSearchInput('');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Bar with Left Filter Dropdown Button & Right Add Plus Button */}
        <View style={styles.headerBar}>
          {/* Left Filter Dropdown Button */}
          <TouchableOpacity
            onPress={() => setDropdownOpen(true)}
            style={[
              styles.filterDropdownBtn,
              { backgroundColor: cardBg, borderColor: status ? brandCol : borderCol },
            ]}
            activeOpacity={0.7}
          >
            <Filter size={15} color={status ? brandCol : subTextColor} />
            <Text style={[styles.filterDropdownText, { color: status ? brandCol : textColor }]}>
              {status || 'All'}
            </Text>
            <ChevronDown size={14} color={subTextColor} />
          </TouchableOpacity>

          {/* Center Search Input Box */}
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Search size={18} color={subTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search leads..."
              placeholderTextColor={subTextColor}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchInput !== '' && (
              <TouchableOpacity
                onPress={() => {
                  setSearchInput('');
                  setSearch('');
                  setPage(1);
                }}
              >
                <Text style={{ color: subTextColor, fontSize: 13, fontWeight: '600' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Right Create Plus Button */}
          {canCreate('Leads') && (
            <TouchableOpacity
              onPress={() => router.push('/admin/leads/AddLead')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.filterDropdownBtn,
                  { backgroundColor: cardBg, borderColor: borderCol },
                ]}
              >
                <Plus size={18} color={brandCol} />
                <Text style={[styles.filterDropdownText, { color: brandCol }]}>Add</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Dropdown Modal */}
        <Modal visible={isDropdownOpen} transparent animationType="fade">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setDropdownOpen(false)}
            style={styles.modalOverlay}
          >
            <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <Text style={[styles.dropdownTitle, { color: subTextColor }]}>Filter by Status</Text>
              {STATUS_OPTIONS.map((opt) => {
                const isActive = (opt === 'All' && !status) || status.toLowerCase() === opt.toLowerCase();
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      handleStatusSelect(opt);
                      setDropdownOpen(false);
                    }}
                    style={[
                      styles.dropdownOption,
                      { backgroundColor: isActive ? adminTheme.badgeBg : 'transparent' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        { color: isActive ? brandCol : textColor, fontWeight: isActive ? '700' : '400' },
                      ]}
                    >
                      {opt}
                    </Text>
                    {isActive && <Check size={16} color={brandCol} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Connection & Query State */}
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
                    Try adjusting your search criteria or status filter.
                  </Text>
                  <TouchableOpacity onPress={resetFilters} style={[styles.resetBtn, { backgroundColor: brandCol }]}>
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>Reset Filters</Text>
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
    gap: 10,
    alignItems: 'center',
  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 6,
  },
  filterDropdownText: {
    fontSize: 13,
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
    fontSize: 14,
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
    paddingTop: 16,
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
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  resetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 16,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownMenu: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 2,
  },
  dropdownOptionText: {
    fontSize: 14,
  },
});
