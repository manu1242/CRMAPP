import { useShallow } from 'zustand/react/shallow';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Kanban,
  Search,
  Filter,
  X,
  Check,
  RotateCcw,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Undo2,
  Calendar,
  User,
  Tag,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { useSalesPipelineStore } from '../../../admin/store/useSalesPipelineStore';
import { LeadItem } from '../../../admin/models/LeadTypes';
import { getStageLabel, CANONICAL_PIPELINE_STAGES } from '../../../admin/models/SalesPipelineTypes';
import PipelineStageCard from '../../../admin/components/PipelineStageCard';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';
import { apiClient } from '../../../api/apiClient';

type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const PAGE_SIZE = 10;

const DATE_PRESET_OPTIONS: { id: DatePreset; label: string }[] = [
  { id: 'all', label: 'All dates' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
];

const STANDARD_SOURCES = [
  'All',
  'Website',
  'Campaign',
  'Referral',
  'Direct',
  'Social Media',
  'Channel Partner',
  'Walk-in',
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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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

interface UndoState {
  leadId: number;
  leadName: string;
  fromStage: string;
  toStage: string;
}

// Global cached agent map to eliminate redundant network hits & re-render triggers
let globalAgentCache: Record<number, string> | null = null;

export default function SalesPipelineScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    stages,
    pipelineGroups,
    selectedStage,
    isLoading,
    isUpdatingStage,
    error,
    fetchPipelineData,
    setSelectedStage,
    updateLeadStage,
  } = useSalesPipelineStore(
    // Subscribe only to the fields used here (was: whole store → re-render on any change)
    useShallow((s) => ({ stages: s.stages, pipelineGroups: s.pipelineGroups, selectedStage: s.selectedStage, isLoading: s.isLoading, isUpdatingStage: s.isUpdatingStage, error: s.error, fetchPipelineData: s.fetchPipelineData, setSelectedStage: s.setSelectedStage, updateLeadStage: s.updateLeadStage }))
  );

  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeadForMove, setSelectedLeadForMove] = useState<LeadItem | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Pagination State (Matching Leads Screen)
  const [page, setPage] = useState(1);

  // Undo Toast State
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter States (Web Parity: Search, Agent, Source, Date)
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Filter Modal & Tabs
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'date' | 'agent' | 'source'>('date');

  // Modal Draft States
  const [draftAgentId, setDraftAgentId] = useState<number | null>(selectedAgentId);
  const [draftSource, setDraftSource] = useState(selectedSource);
  const [draftDatePreset, setDraftDatePreset] = useState<DatePreset>(datePreset);
  const [draftCustomFrom, setDraftCustomFrom] = useState(customFrom);
  const [draftCustomTo, setDraftCustomTo] = useState(customTo);

  // Agent Lookup map (cached)
  const [agentLookup, setAgentLookup] = useState<Record<number, string>>(globalAgentCache || {});

  // Compute resolved from / to strings
  const { from, to } = useMemo(
    () => getDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo]
  );

  // Fetch agent name lookup once on mount
  useEffect(() => {
    if (globalAgentCache && Object.keys(globalAgentCache).length > 0) return;
    let isMounted = true;
    (async () => {
      try {
        const res = await apiClient.get<any>('/Agent/GetAgents').catch(() => null);
        const items = res?.data?.items || res?.data || [];
        if (Array.isArray(items) && items.length > 0 && isMounted) {
          const map: Record<number, string> = {};
          items.forEach((item: any) => {
            const id = item.agentId || item.userId || item.id;
            const name = item.name || item.fullName || item.username;
            if (id && name) map[id] = name;
          });
          globalAgentCache = map;
          setAgentLookup(map);
        }
      } catch {
        // silent fallback
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch pipeline data ONLY when filters change or on mount (NOT on stage switch)
  const loadData = useCallback(() => {
    fetchPipelineData({
      search: search || undefined,
      executiveId: selectedAgentId || undefined,
      source: selectedSource || undefined,
      from: from || undefined,
      to: to || undefined,
    });
  }, [fetchPipelineData, search, selectedAgentId, selectedSource, from, to]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Debounced Search Handler
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (text: string) => {
    setSearchInput(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(text.trim());
      setPage(1);
    }, 350);
  };

  const handleSearchSubmit = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // Open Filter Modal
  const openFilterModal = () => {
    setDraftAgentId(selectedAgentId);
    setDraftSource(selectedSource);
    setDraftDatePreset(datePreset);
    setDraftCustomFrom(customFrom);
    setDraftCustomTo(customTo);
    setIsFilterModalOpen(true);
  };

  // Apply Modal Filters
  const applyModalFilters = () => {
    setSelectedAgentId(draftAgentId);
    setSelectedSource(draftSource);
    setDatePreset(draftDatePreset);
    setCustomFrom(draftCustomFrom);
    setCustomTo(draftCustomTo);
    setPage(1);
    setIsFilterModalOpen(false);
  };

  // Reset Filters
  const resetAllFilters = useCallback(() => {
    setSelectedAgentId(null);
    setSelectedSource('');
    setDatePreset('all');
    setCustomFrom('');
    setCustomTo('');
    setSearch('');
    setSearchInput('');
    setPage(1);
  }, []);

  const resetDraftFilters = () => {
    setDraftAgentId(null);
    setDraftSource('');
    setDraftDatePreset('all');
    setDraftCustomFrom('');
    setDraftCustomTo('');
  };

  // Fast Stage Switch Handler with Instant Scroll & Page Reset
  const handleStageSelect = useCallback((stg: string) => {
    if (stg.trim().toLowerCase() === selectedStage.trim().toLowerCase()) return;
    setSelectedStage(stg);
    setPage(1);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedStage, setSelectedStage]);

  // Dynamic list of distinct agents gathered from leads and agent lookup
  const availableAgents = useMemo(() => {
    const agentMap = new Map<number, string>();
    pipelineGroups.forEach((g) => {
      (g.leads || []).forEach((l) => {
        const id = l.executiveId || l.assignedToAgentId;
        const rawName =
          (l as any).agentName ||
          l.assignedToAgentName ||
          (l as any).executiveName ||
          (id ? agentLookup[id] : undefined);

        const name = (rawName && typeof rawName === 'string' && !rawName.toLowerCase().startsWith('agent #'))
          ? rawName.trim()
          : undefined;

        if (id && id > 0 && name && !agentMap.has(id)) {
          agentMap.set(id, name);
        }
      });
    });
    return Array.from(agentMap.entries()).map(([id, name]) => ({ id, name }));
  }, [pipelineGroups, agentLookup]);

  // Dynamic list of distinct sources
  const availableSources = useMemo(() => {
    const srcSet = new Set<string>(STANDARD_SOURCES);
    pipelineGroups.forEach((g) => {
      (g.leads || []).forEach((l) => {
        if (l.source && l.source.trim()) {
          srcSet.add(l.source.trim());
        }
      });
    });
    return Array.from(srcSet);
  }, [pipelineGroups]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedAgentId !== null) count++;
    if (selectedSource !== '') count++;
    if (datePreset !== 'all') count++;
    return count;
  }, [selectedAgentId, selectedSource, datePreset]);

  // Move Lead Stage Handler (Stable reference)
  const handleOpenMoveModal = useCallback((lead: LeadItem) => {
    setSelectedLeadForMove(lead);
    setIsMoveModalOpen(true);
  }, []);

  const handleMoveToStage = async (targetStage: string) => {
    if (!selectedLeadForMove) return;
    const lead = selectedLeadForMove;
    const oldStage = lead.stage || selectedStage;
    setIsMoveModalOpen(false);

    if (oldStage.trim().toLowerCase() === targetStage.trim().toLowerCase()) return;

    const success = await updateLeadStage(lead.leadId, targetStage);
    if (success) {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      setUndoState({
        leadId: lead.leadId,
        leadName: lead.fullName || lead.name || 'Lead',
        fromStage: oldStage,
        toStage: targetStage,
      });

      undoTimeoutRef.current = setTimeout(() => {
        setUndoState(null);
      }, 6000);
    } else {
      Alert.alert('Stage Move Failed', 'Unable to update lead stage. Please try again.');
    }
  };

  const handleExecuteUndo = async () => {
    if (!undoState) return;
    const { leadId, fromStage } = undoState;
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoState(null);

    const success = await updateLeadStage(leadId, fromStage);
    if (!success) {
      Alert.alert('Undo Failed', 'Unable to revert stage change. Please refresh.');
    }
  };

  // Dynamic Theme Tokens
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  // Active Stage Group
  const activeGroup = useMemo(() => {
    return pipelineGroups.find(
      (g) => g.stage.trim().toLowerCase() === selectedStage.trim().toLowerCase()
    );
  }, [pipelineGroups, selectedStage]);

  // Client-side instant filter fallback for high responsiveness
  const activeLeads = useMemo(() => {
    let list = activeGroup?.leads || [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) =>
        (l.fullName || l.name || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q)
      );
    }
    if (selectedAgentId !== null && selectedAgentId > 0) {
      list = list.filter((l) => (l.executiveId === selectedAgentId || l.assignedToAgentId === selectedAgentId));
    }
    if (selectedSource) {
      list = list.filter((l) => (l.source || '').toLowerCase() === selectedSource.toLowerCase());
    }
    return list;
  }, [activeGroup, search, selectedAgentId, selectedSource]);

  // Pagination Calculations (10 items per page for instant render performance)
  const totalStageLeads = activeLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalStageLeads / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return activeLeads.slice(start, start + PAGE_SIZE);
  }, [activeLeads, currentPage]);

  // Web header counter: "X of Y leads shown"
  const shownLeadsCount = pipelineGroups.reduce((sum, g) => sum + (g.count ?? g.leads?.length ?? 0), 0);
  const totalLeadsCount = pipelineGroups.reduce((sum, g) => sum + (g.totalCount ?? g.count ?? g.leads?.length ?? 0), 0);

  // Stages list (fallback to canonical if empty)
  const displayStages = stages.length > 0 ? stages : Array.from(CANONICAL_PIPELINE_STAGES);
  const hasActiveFilters = activeFilterCount > 0 || search.trim() !== '';

  // Resolved active filter names for Quick Chips
  const activeAgentName = useMemo(() => {
    if (selectedAgentId === null) return null;
    const ag = availableAgents.find((a) => a.id === selectedAgentId);
    return ag ? ag.name : `Agent #${selectedAgentId}`;
  }, [selectedAgentId, availableAgents]);

  const activeDateLabel = useMemo(() => {
    if (datePreset === 'all') return null;
    const opt = DATE_PRESET_OPTIONS.find((o) => o.id === datePreset);
    return opt ? opt.label : 'Custom Date';
  }, [datePreset]);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomSpacing + 80, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brandCol} colors={[brandCol]} />}
      >
        {/* ── Screen Header (Web Parity: Title, Subtitle & Counter) ── */}
        <View style={styles.screenHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {router.canGoBack() && (
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backBtn, { backgroundColor: cardBg, borderColor: borderCol }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={18} color={textColor} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.title, { color: textColor }]}>Sales Pipeline</Text>
                <View style={[styles.countBadge, { backgroundColor: isDark ? '#252840' : '#e2e8f0' }]}>
                  <Text style={[styles.countBadgeText, { color: subTextColor }]}>
                    {shownLeadsCount} of {totalLeadsCount} leads shown
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Filter Bar: Search, Filter Button & Clear Filters (Web Parity) ── */}
        <View style={styles.filterBar}>
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

          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Search size={16} color={subTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search by lead name or phone"
              placeholderTextColor={subTextColor}
              value={searchInput}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchInput !== '' && (
              <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={15} color={subTextColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={resetAllFilters}
              style={[styles.clearBtn, { backgroundColor: inputBg, borderColor: borderCol }]}
              activeOpacity={0.7}
            >
              <RotateCcw size={13} color={subTextColor} />
              <Text style={[styles.clearBtnText, { color: subTextColor }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Quick Active Filter Chips ── */}
        {hasActiveFilters && (
          <View style={styles.chipsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              {search.trim() !== '' && (
                <View style={[styles.chipPill, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <Text style={[styles.chipText, { color: textColor }]}>Search: "{search}"</Text>
                  <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <X size={13} color={subTextColor} />
                  </TouchableOpacity>
                </View>
              )}

              {activeAgentName && (
                <View style={[styles.chipPill, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <User size={12} color={brandCol} />
                  <Text style={[styles.chipText, { color: textColor }]}>{activeAgentName}</Text>
                  <TouchableOpacity onPress={() => setSelectedAgentId(null)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <X size={13} color={subTextColor} />
                  </TouchableOpacity>
                </View>
              )}

              {selectedSource !== '' && (
                <View style={[styles.chipPill, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <Tag size={12} color={brandCol} />
                  <Text style={[styles.chipText, { color: textColor }]}>{selectedSource}</Text>
                  <TouchableOpacity onPress={() => setSelectedSource('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <X size={13} color={subTextColor} />
                  </TouchableOpacity>
                </View>
              )}

              {activeDateLabel && (
                <View style={[styles.chipPill, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <Calendar size={12} color={brandCol} />
                  <Text style={[styles.chipText, { color: textColor }]}>{activeDateLabel}</Text>
                  <TouchableOpacity onPress={() => setDatePreset('all')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <X size={13} color={subTextColor} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* ── Horizontal Stage Selector Pills (Instant Switch) ── */}
        <View style={{ paddingTop: 10 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {displayStages.map((stg) => {
              const groupObj = pipelineGroups.find((g) => g.stage.trim().toLowerCase() === stg.trim().toLowerCase());
              const count = groupObj ? (groupObj.count ?? groupObj.leads?.length ?? 0) : 0;
              const isActive = selectedStage.trim().toLowerCase() === stg.trim().toLowerCase();

              return (
                <TouchableOpacity
                  key={stg}
                  onPress={() => handleStageSelect(stg)}
                  style={[
                    styles.stagePill,
                    {
                      backgroundColor: isActive ? adminTheme.activePillBg : cardBg,
                      borderColor: isActive ? adminTheme.activePillBg : borderCol,
                    },
                  ]}
                >
                  <Text style={[styles.stagePillText, { color: isActive ? adminTheme.activePillText : textColor }]}>
                    {getStageLabel(stg)}
                  </Text>
                  <View
                    style={[
                      styles.stageCountBadge,
                      { backgroundColor: isActive ? adminTheme.activePillText + '30' : inputBg },
                    ]}
                  >
                    <Text style={[styles.stageCountText, { color: isActive ? adminTheme.activePillText : subTextColor }]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Loading / Error / Board Content ── */}
        {isLoading && !refreshing ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={brandCol} />
            <Text style={{ color: subTextColor, marginTop: 12, fontSize: 13 }}>
              Loading sales pipeline stage board...
            </Text>
          </View>
        ) : error ? (
          <View style={[styles.errorContainer, { backgroundColor: '#ef444415', borderColor: '#ef444430' }]}>
            <AlertCircle size={24} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 6 }}>{error}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 10 }}>
            {/* Active Stage Header Box */}
            <View style={[styles.stageHeaderBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Kanban size={18} color={brandCol} />
                <Text style={[styles.stageHeaderTitle, { color: textColor }]}>
                  {getStageLabel(selectedStage)}
                </Text>
              </View>
              <Text style={[styles.stageHeaderSub, { color: subTextColor }]}>
                {totalStageLeads > 0
                  ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} - ${Math.min(currentPage * PAGE_SIZE, totalStageLeads)} of ${totalStageLeads}`
                  : '0 leads'}
              </Text>
            </View>

            {/* Paginated Leads List (Fast Virtual Window) */}
            {paginatedLeads.length > 0 ? (
              <>
                {paginatedLeads.map((lead: LeadItem) => (
                  <PipelineStageCard
                    key={lead.leadId}
                    lead={lead}
                    agentLookup={agentLookup}
                    onMoveStage={handleOpenMoveModal}
                  />
                ))}

                {/* ── Pagination Bar (Matching Leads Screen) ── */}
                {totalPages > 1 && (
                  <View style={[styles.paginationRow, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    <TouchableOpacity
                      disabled={currentPage <= 1}
                      onPress={() => {
                        setPage((p) => Math.max(1, p - 1));
                        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
                      }}
                      style={[
                        styles.pageBtn,
                        { backgroundColor: inputBg, opacity: currentPage <= 1 ? 0.4 : 1 },
                      ]}
                    >
                      <ChevronLeft size={18} color={textColor} />
                      <Text style={[styles.pageBtnText, { color: textColor }]}>Prev</Text>
                    </TouchableOpacity>

                    <Text style={[styles.pageIndicator, { color: textColor }]}>
                      Page <Text style={{ fontWeight: '700' }}>{currentPage}</Text> of {totalPages}
                    </Text>

                    <TouchableOpacity
                      disabled={currentPage >= totalPages}
                      onPress={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
                      }}
                      style={[
                        styles.pageBtn,
                        { backgroundColor: inputBg, opacity: currentPage >= totalPages ? 0.4 : 1 },
                      ]}
                    >
                      <Text style={[styles.pageBtnText, { color: textColor }]}>Next</Text>
                      <ChevronRight size={18} color={textColor} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Kanban size={32} color={subTextColor} />
                <Text style={[styles.emptyTitle, { color: textColor }]}>No leads here.</Text>
                <Text style={[styles.emptySub, { color: subTextColor }]}>
                  {hasActiveFilters
                    ? 'No leads match the current filters in this stage.'
                    : 'Leads placed in this stage will appear here automatically.'}
                </Text>
                {hasActiveFilters && (
                  <TouchableOpacity
                    onPress={resetAllFilters}
                    style={[styles.resetBtn, { backgroundColor: brandCol }]}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Clear filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Floating Undo Toast (Web Parity) ── */}
      {undoState && (
        <View style={styles.undoToastContainer}>
          <View style={styles.undoToastCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Undo2 size={16} color="#fbbf24" />
              <Text style={styles.undoToastText} numberOfLines={1}>
                Moved {undoState.leadName} to {getStageLabel(undoState.toStage)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleExecuteUndo} style={styles.undoToastBtn}>
              <Text style={styles.undoToastBtnText}>Undo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Filter Modal (Web Parity: Date, Agent, Source) ── */}
      <Modal visible={isFilterModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: borderCol }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: borderCol }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Filter size={18} color={brandCol} />
                <Text style={[styles.modalTitle, { color: textColor }]}>Filter Pipeline</Text>
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

            {/* Modal Tabs */}
            <View style={[styles.modalTabsRow, { borderBottomColor: borderCol }]}>
              <TouchableOpacity
                onPress={() => setActiveModalTab('date')}
                style={[styles.modalTabItem, activeModalTab === 'date' && { borderBottomColor: brandCol, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalTabLabel, { color: activeModalTab === 'date' ? brandCol : subTextColor }]}>
                  Date {draftDatePreset !== 'all' ? '•' : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveModalTab('agent')}
                style={[styles.modalTabItem, activeModalTab === 'agent' && { borderBottomColor: brandCol, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalTabLabel, { color: activeModalTab === 'agent' ? brandCol : subTextColor }]}>
                  Agent {draftAgentId !== null ? '•' : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveModalTab('source')}
                style={[styles.modalTabItem, activeModalTab === 'source' && { borderBottomColor: brandCol, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalTabLabel, { color: activeModalTab === 'source' ? brandCol : subTextColor }]}>
                  Source {draftSource ? '•' : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Date Tab */}
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

                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>Custom Date (YYYY-MM-DD)</Text>
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

              {/* Agent Tab */}
              {activeModalTab === 'agent' && (
                <View style={styles.tabSection}>
                  <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>Filter by Agent</Text>
                  <View style={styles.optionsWrap}>
                    <TouchableOpacity
                      onPress={() => setDraftAgentId(null)}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: draftAgentId === null ? (isDark ? '#064e3b' : '#ecfdf5') : inputBg,
                          borderColor: draftAgentId === null ? brandCol : borderCol,
                        },
                      ]}
                    >
                      <Text style={[styles.optionChipText, { color: draftAgentId === null ? brandCol : textColor, fontWeight: draftAgentId === null ? '700' : '500' }]}>
                        All agents
                      </Text>
                      {draftAgentId === null && <Check size={14} color={brandCol} />}
                    </TouchableOpacity>

                    {availableAgents.map((ag) => {
                      const isSelected = draftAgentId === ag.id;
                      return (
                        <TouchableOpacity
                          key={ag.id}
                          onPress={() => setDraftAgentId(ag.id)}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: isSelected ? (isDark ? '#064e3b' : '#ecfdf5') : inputBg,
                              borderColor: isSelected ? brandCol : borderCol,
                            },
                          ]}
                        >
                          <Text style={[styles.optionChipText, { color: isSelected ? brandCol : textColor, fontWeight: isSelected ? '700' : '500' }]}>
                            {ag.name}
                          </Text>
                          {isSelected && <Check size={14} color={brandCol} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Source Tab */}
              {activeModalTab === 'source' && (
                <View style={styles.tabSection}>
                  <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>Filter by Lead Source</Text>
                  <View style={styles.optionsWrap}>
                    {availableSources.map((src) => {
                      const isAll = src === 'All';
                      const isSelected = (isAll && !draftSource) || draftSource.toLowerCase() === src.toLowerCase();
                      const label = isAll ? 'All sources' : src;
                      return (
                        <TouchableOpacity
                          key={src}
                          onPress={() => setDraftSource(isAll ? '' : src)}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: isSelected ? (isDark ? '#064e3b' : '#ecfdf5') : inputBg,
                              borderColor: isSelected ? brandCol : borderCol,
                            },
                          ]}
                        >
                          <Text style={[styles.optionChipText, { color: isSelected ? brandCol : textColor, fontWeight: isSelected ? '700' : '500' }]}>
                            {label}
                          </Text>
                          {isSelected && <Check size={14} color={brandCol} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
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

      {/* ── Move Lead Stage Modal (Web Parity: Move to...) ── */}
      <Modal visible={isMoveModalOpen} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsMoveModalOpen(false)}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Move to...</Text>
                <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }} numberOfLines={1}>
                  {selectedLeadForMove?.fullName || selectedLeadForMove?.name} (Lead #{selectedLeadForMove?.leadId})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsMoveModalOpen(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 340 }}>
              {displayStages.map((stg) => {
                const currentLeadStage = selectedLeadForMove?.stage || selectedStage;
                const isCurrent = currentLeadStage.trim().toLowerCase() === stg.trim().toLowerCase();
                return (
                  <TouchableOpacity
                    key={stg}
                    disabled={isCurrent || isUpdatingStage}
                    onPress={() => handleMoveToStage(stg)}
                    style={[
                      styles.stageOption,
                      {
                        backgroundColor: isCurrent ? adminTheme.badgeBg : inputBg,
                        borderColor: isCurrent ? brandCol : borderCol,
                        opacity: isCurrent ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stageOptionText,
                        { color: isCurrent ? brandCol : textColor, fontWeight: isCurrent ? '700' : '500' },
                      ]}
                    >
                      {getStageLabel(stg)} {isCurrent ? '(Current)' : ''}
                    </Text>
                    {isCurrent && <Check size={16} color={brandCol} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 5,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  chipsSection: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  stagePillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  stageCountBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  stageCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stageHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  stageHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  stageHeaderSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  resetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 14,
  },
  errorContainer: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },

  // Pagination Styles (Matching Leads Screen Exactly)
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
    fontSize: 12.5,
  },

  // Undo Toast Styles
  undoToastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  undoToastCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  undoToastText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },
  undoToastBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 8,
  },
  undoToastBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
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
    maxHeight: '75%',
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
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  modalTabLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  modalBody: {
    maxHeight: 320,
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

  // Move Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  stageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  stageOptionText: {
    fontSize: 13.5,
  },
});
