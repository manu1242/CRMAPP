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
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  CalendarCheck,
  Filter,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { useLeadsQuery } from '../../../admin/hooks/useLeadsQuery';
import ConnectionStateView from '../../components/ConnectionStateView';
import { LeadItem } from '../../../admin/models/LeadTypes';

const STATUS_OPTIONS = ['All', 'Active', 'New', 'Contacted', 'Qualified', 'Lost'];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return 'N/A';
  }
}

function formatDateTime(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${day} ${month}, ${strHours}:${minutes} ${ampm}`;
  } catch {
    return null;
  }
}

export default function LeadsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  // TanStack Query handles caching, staleTime (3min), and AbortSignal propagation under the hood
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
    setSearch(searchInput);
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

  // Dynamic Theme Colors (from admin.css)
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
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Bar with Left Filter Dropdown Button */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', gap: 10 }}>
          {/* Left Filter Button */}
          <TouchableOpacity
            onPress={() => setDropdownOpen(true)}
            style={[
              styles.filterDropdownBtn,
              { backgroundColor: cardBg, borderColor: status ? brandCol : borderCol },
            ]}
          >
            <Filter size={15} color={status ? brandCol : subTextColor} />
            <Text style={[styles.filterDropdownText, { color: status ? brandCol : textColor }]}>
              {status || 'All'}
            </Text>
            <ChevronDown size={14} color={subTextColor} />
          </TouchableOpacity>

          {/* Search Input Box */}
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol, flex: 1 }]}>
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
          <View style={[styles.countBadge, { backgroundColor: inputBg }]}>
            <Text style={[styles.countBadgeText, { color: subTextColor }]}>
              {totalCount}Leads
            </Text>
          </View>
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

        <ConnectionStateView
          isLoading={isLoading}
          error={error}
          hasData={leads.length > 0}
          onRetry={refetch}
          isRetrying={isLoading}
        >
          {/* Loading Indicator */}
          {isLoading && !refreshing ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={{ color: subTextColor, marginTop: 12, fontSize: 13 }}>Fetching leads list...</Text>
            </View>
          ) : (
            /* Leads List Cards */
            <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14 }}>
              {leads.length > 0 ? (
                leads.map((lead: LeadItem) => {
                  const initial = (lead.fullName || 'L').charAt(0).toUpperCase();

                  const formattedDate = formatDate(lead.createdDate);
                  const formattedFollowUp = formatDateTime(lead.followUpDate);

                  const requirementText = [lead.type, lead.bhk, lead.propertyType]
                    .filter(Boolean)
                    .join(' · ') || lead.requirement || 'N/A';

                  const agentText = lead.assignedToAgentName || (lead.assignedToAgentId ? `Agent #${lead.assignedToAgentId}` : 'Admin');

                  return (
                    <TouchableOpacity
                      key={lead.leadId}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/admin/leads/${lead.leadId}`)}
                      style={[styles.leadCard, { backgroundColor: cardBg, borderColor: borderCol }]}
                    >
                      {/* Header Row */}
                      <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initial}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.leadName, { color: textColor }]} numberOfLines={1}>
                              {lead.fullName || 'Unnamed Lead'}
                            </Text>
                            <Text style={[styles.leadSubtitle, { color: subTextColor }]}>
                              Lead #{lead.leadId} · {lead.source || 'Website'}
                            </Text>
                          </View>
                        </View>

                        {/* Status Badge */}
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>{lead.status || 'Active'}</Text>
                        </View>
                      </View>

                      {/* Stage Pill Tag */}
                      {lead.stage ? (
                        <View style={styles.stageTag}>
                          <FileText size={14} color="#c084fc" />
                          <Text style={styles.stageTagText}>{lead.stage}</Text>
                        </View>
                      ) : null}

                      {/* Divider Line */}
                      <View style={[styles.divider, { backgroundColor: borderCol }]} />

                      {/* 2-Column Info Grid */}
                      <View style={{ gap: 14 }}>
                        {/* Row 1: Email & Phone */}
                        <View style={{ flexDirection: 'row' }}>
                          <View style={{ flex: 1.2, paddingRight: 8 }}>
                            <Text style={[styles.gridLabel, { color: subTextColor }]}>Email</Text>
                            <Text style={[styles.gridValue, { color: textColor }]} numberOfLines={1}>
                              {lead.email || 'N/A'}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.gridLabel, { color: subTextColor }]}>Phone</Text>
                            <Text style={[styles.gridValue, { color: textColor }]}>
                              {lead.phone || 'N/A'}
                            </Text>
                          </View>
                        </View>

                        {/* Row 2: Requirement & Location */}
                        <View style={{ flexDirection: 'row' }}>
                          <View style={{ flex: 1.2, paddingRight: 8 }}>
                            <Text style={[styles.gridLabel, { color: subTextColor }]}>Requirement</Text>
                            <Text style={[styles.gridValue, { color: textColor }]} numberOfLines={1}>
                              {requirementText}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.gridLabel, { color: subTextColor }]}>Location</Text>
                            <Text style={[styles.gridValue, { color: textColor }]} numberOfLines={1}>
                              {lead.preferredLocation || 'N/A'}
                            </Text>
                          </View>
                        </View>

                        {/* Row 3: Agent & Created */}
                        <View style={{ flexDirection: 'row' }}>
                          <View style={{ flex: 1.2, paddingRight: 8 }}>
                            <Text style={[styles.gridLabel, { color: subTextColor }]}>Agent</Text>
                            <Text style={[styles.gridValue, { color: textColor }]} numberOfLines={1}>
                              {agentText}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.gridLabel, { color: subTextColor }]}>Created</Text>
                            <Text style={[styles.gridValue, { color: textColor }]}>
                              {formattedDate}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Follow-up Banner */}
                      {formattedFollowUp ? (
                        <View style={styles.followUpBanner}>
                          <CalendarCheck size={16} color="#fbbf24" />
                          <Text style={styles.followUpText}>
                            Follow-up · {formattedFollowUp}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              ) : (
                /* Empty State */
                <View style={[styles.emptyContainer, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No Leads Found</Text>
                  <Text style={[styles.emptySub, { color: subTextColor }]}>
                    Try adjusting your search criteria or filters.
                  </Text>
                  <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>Reset Filters</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Pagination Controls */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,

    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#4b5550',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    alignSelf: "center",
     borderWidth: 1,
    // borderColor:'#c9c8c87a'
    
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '500',
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
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leadCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f2b5c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#60a5fa',
    fontSize: 18,
    fontWeight: 'bold',
  },
  leadName: {
    fontSize: 14,
    fontWeight: '500',
  },
  leadSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#14532d',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
  stageTag: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageTagText: {
    color: '#c084fc',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  gridLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '400',
  },
  followUpBanner: {
    // backgroundColor: '#451a01',
    // borderColor: '#78350f',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followUpText: {
    color: '#fbbf14',
    fontWeight: '700',
    fontSize: 13,
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
    backgroundColor: '#3b82f6',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 16,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
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
