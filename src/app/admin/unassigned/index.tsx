import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  UserX,
  Search,
  CheckSquare,
  Square,
  UserPlus,
  Trash2,
  Phone,
  Mail,
  MapPin,
  X,
  ShieldAlert,

  Tag,
  MessageSquare,
  Users,
  UserCheck,
  CheckCheck,
  Inbox,
  Filter,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme, AdminThemeTokens } from '../../../theme/adminTheme';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';
import {
  useUnassignedLeadsQuery,
  useUnassignedExecutivesQuery,
  useAssignUnassignedMutation,
  useDeleteUnassignedMutation,
} from '../../../admin/hooks/useUnassignedLeads';
import { UnassignedLeadItem, UnassignedSourceFilter } from '../../../admin/models/UnassignedLeadTypes';

const FB_COLOR = '#4267B2';
const DANGER = '#ef4444';

const FbIcon = ({ size }: { size: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: FB_COLOR, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: '#fff', fontSize: size * 0.7, fontWeight: '800', lineHeight: size }}>f</Text>
  </View>
);

const SOURCE_FILTERS: { label: string; value: UnassignedSourceFilter }[] = [
  { label: 'All', value: '' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Website', value: 'website' },
  { label: 'Manual', value: 'manual' },
  { label: 'Other', value: 'other' },
];

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

const formatDate = (iso?: string) => {
  if (!iso) return { date: '-', time: '' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: '-', time: '' };
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
};

/* ───────────────────────── Lead Card (memoized) ───────────────────────── */

type CardProps = {
  lead: UnassignedLeadItem;
  selected: boolean;
  t: AdminThemeTokens;
  onToggle: (id: number) => void;
  onOpen: (id: number) => void;
  onAssign: (id: number) => void;
  onDelete: (lead: UnassignedLeadItem) => void;
};

const LeadCard = memo(function LeadCard({ lead, selected, t, onToggle, onOpen, onAssign, onDelete }: CardProps) {
  const { date, time } = formatDate(lead.createdDate);
  const isFb = !!lead.isFacebook;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: selected ? t.badgeBg : t.cardBg,
          borderColor: selected ? t.brand : t.border,
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: isFb ? FB_COLOR : t.brand }]} />

      {/* Header */}
      <View style={styles.rowStart}>
        <TouchableOpacity onPress={() => onToggle(lead.leadId)} hitSlop={10} style={{ paddingTop: 2 }}>
          {selected ? <CheckSquare size={20} color={t.brand} /> : <Square size={20} color={t.textMuted} />}
        </TouchableOpacity>

        <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.7} onPress={() => onOpen(lead.leadId)}>
          <Text style={[styles.name, { color: t.textPrimary }]} numberOfLines={1}>
            {lead.fullName || 'Unnamed Lead'}
          </Text>
          <View style={[styles.rowCenter, { gap: 6, marginTop: 4, flexWrap: 'wrap' }]}>
            {lead.source ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isFb ? `${FB_COLOR}1A` : t.inputBg, borderColor: isFb ? `${FB_COLOR}40` : t.border },
                ]}
              >
                {isFb ? <FbIcon size={12} /> : <Tag size={10} color={t.textSecondary} />}
                <Text style={[styles.badgeText, { color: isFb ? FB_COLOR : t.textSecondary }]}>{lead.source}</Text>
              </View>
            ) : null}
            {lead.handoverStatus === 'ReadyToBook' ? (
              <View style={[styles.badge, { backgroundColor: '#f59e0b1A', borderColor: '#f59e0b40' }]}>
                <Text style={[styles.badgeText, { color: '#f59e0b' }]}>Ready To Book</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.date, { color: t.textSecondary }]}>{date}</Text>
          <Text style={[styles.time, { color: t.textMuted }]}>{time}</Text>
        </View>
      </View>

      {/* Contact */}
      <View style={[styles.rowCenter, { flexWrap: 'wrap', gap: 14, marginTop: 10, paddingLeft: 30 }]}>
        <TouchableOpacity
          disabled={!lead.phone}
          onPress={() => lead.phone && Linking.openURL(`tel:${lead.phone}`)}
          style={[styles.rowCenter, { gap: 5 }]}
        >
          <Phone size={12} color={t.brand} />
          <Text style={[styles.meta, { color: t.textPrimary }]}>{lead.phone || 'N/A'}</Text>
        </TouchableOpacity>
        {lead.email ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${lead.email}`)}
            style={[styles.rowCenter, { gap: 5, flexShrink: 1 }]}
          >
            <Mail size={12} color={t.textSecondary} />
            <Text style={[styles.meta, { color: t.textPrimary, flexShrink: 1 }]} numberOfLines={1}>
              {lead.email}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Comments */}
      {lead.comments ? (
        <View style={[styles.rowStart, { gap: 6, marginTop: 8, paddingLeft: 30 }]}>
          <MessageSquare size={12} color={t.textMuted} style={{ marginTop: 2 }} />
          <Text style={[styles.comment, { color: t.textSecondary }]} numberOfLines={2}>
            {lead.comments}
          </Text>
        </View>
      ) : null}

      {/* Footer: BHK / Location / actions */}
      <View style={[styles.footer, { borderTopColor: t.border }]}>
        <View style={[styles.rowCenter, { gap: 18, flex: 1 }]}>
          <View>
            <Text style={[styles.label, { color: t.textMuted }]}>BHK</Text>
            <Text style={[styles.value, { color: t.textPrimary }]}>{lead.bhk || 'N/A'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: t.textMuted }]}>Location</Text>
            <View style={[styles.rowCenter, { gap: 3 }]}>
              <MapPin size={11} color={DANGER} />
              <Text style={[styles.value, { color: t.textPrimary, flex: 1 }]} numberOfLines={1}>
                {lead.preferredLocation || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.rowCenter, { gap: 8 }]}>
          <TouchableOpacity
            onPress={() => onDelete(lead)}
            style={[styles.iconBtn, { backgroundColor: `${DANGER}15` }]}
            hitSlop={6}
          >
            <Trash2 size={14} color={DANGER} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onAssign(lead.leadId)}
            style={[styles.assignBtn, { backgroundColor: t.badgeBg }]}
          >
            <UserPlus size={12} color={t.brand} />
            <Text style={[styles.assignBtnText, { color: t.badgeText }]}>Assign</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

/* ───────────────────────── Screen ───────────────────────── */

export default function UnassignedLeadsScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const t = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<UnassignedSourceFilter>('');
  const [filterMenuPos, setFilterMenuPos] = useState<{ top: number; left: number } | null>(null);
  const filterBtnRef = useRef<View>(null);
  const currentSourceLabel = SOURCE_FILTERS.find((f) => f.value === source)?.label ?? 'All';

  const openFilterMenu = () => {
    filterBtnRef.current?.measureInWindow((x, y, _w, h) => {
      setFilterMenuPos({ top: y + h + 6, left: x });
    });
  };

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

  // Modals
  const [assignTargets, setAssignTargets] = useState<number[] | null>(null);
  const [execSearch, setExecSearch] = useState('');
  const [selectedExecId, setSelectedExecId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnassignedLeadItem | null>(null);

  // Data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUnassignedLeadsQuery(search, source);

  const executivesQuery = useUnassignedExecutivesQuery(true);
  const executives = executivesQuery.data ?? [];

  const assignMutation = useAssignUnassignedMutation();
  const deleteMutation = useDeleteUnassignedMutation();

  const leads = useMemo(() => data?.pages.flatMap((p) => p?.data?.items ?? []) ?? [], [data]);
  const firstPage = data?.pages[0]?.data;
  const stats = firstPage?.stats;
  const filteredTotal = firstPage?.totalCount ?? 0;

  // Drop selections that are no longer in the list (after assign/delete/filter)
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(leads.map((l) => l.leadId));
      let changed = false;
      const next = new Set<number>();
      prev.forEach((id) => (visible.has(id) ? next.add(id) : (changed = true)));
      return changed ? next : prev;
    });
  }, [leads]);

  // Handlers (stable for memoized cards)
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const openLead = useCallback((id: number) => router.push(`/admin/leads/${id}`), [router]);

  const openAssign = useCallback((id: number) => {
    setAssignTargets([id]);
    setExecSearch('');
    setSelectedExecId(null);
  }, []);

  const allSelected = leads.length > 0 && selectedIds.size === leads.length;
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(leads.map((l) => l.leadId)));

  const openBulkAssign = () => {
    if (selectedIds.size === 0) return;
    setAssignTargets(Array.from(selectedIds));
    setExecSearch('');
    setSelectedExecId(null);
  };

  const filteredExecutives = useMemo(() => {
    const q = execSearch.trim().toLowerCase();
    if (!q) return executives;
    return executives.filter(
      (e) => e.username?.toLowerCase().includes(q) || e.role?.toLowerCase().includes(q)
    );
  }, [executives, execSearch]);

  const submitAssign = () => {
    if (!assignTargets?.length || !selectedExecId) {
      Toast.show({ type: 'error', text1: 'Select an executive', text2: 'Choose an executive to assign the lead(s).' });
      return;
    }
    assignMutation.mutate(
      { leadIds: assignTargets, executiveId: selectedExecId },
      {
        onSuccess: (res) => {
          if (res?.success) {
            Toast.show({ type: 'success', text1: 'Leads Assigned', text2: res.message });
            setAssignTargets(null);
          } else {
            Toast.show({ type: 'error', text1: 'Assignment Failed', text2: res?.message || 'Could not assign leads.' });
          }
        },
        onError: (err) =>
          Toast.show({ type: 'error', text1: 'Assignment Failed', text2: getErrorMessage(err, 'Could not assign leads.') }),
      }
    );
  };

  const submitDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.leadId, {
      onSuccess: (res) => {
        if (res?.success) {
          Toast.show({ type: 'success', text1: 'Lead Deleted', text2: res.message });
          setDeleteTarget(null);
        } else {
          Toast.show({ type: 'error', text1: 'Delete Failed', text2: res?.message || 'Failed to delete lead.' });
        }
      },
      onError: (err) =>
        Toast.show({ type: 'error', text1: 'Delete Failed', text2: getErrorMessage(err, 'Failed to delete lead.') }),
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: UnassignedLeadItem }) => (
      <LeadCard
        lead={item}
        selected={selectedIds.has(item.leadId)}
        t={t}
        onToggle={toggleSelect}
        onOpen={openLead}
        onAssign={openAssign}
        onDelete={setDeleteTarget}
      />
    ),
    [selectedIds, t, toggleSelect, openLead, openAssign]
  );

  const statItems = [
    { label: 'Unassigned', value: stats?.totalUnassigned ?? 0, icon: <UserPlus size={14} color={t.brand} />, tint: t.badgeBg },
    { label: 'Facebook', value: stats?.facebookCount ?? 0, icon: <FbIcon size={16} />, tint: `${FB_COLOR}1A` },
    { label: 'Selected', value: selectedIds.size, icon: <CheckCheck size={14} color="#0ea5e9" />, tint: '#0ea5e91A' },
    { label: 'Executives', value: stats?.executivesCount ?? executives.length, icon: <Users size={14} color="#f59e0b" />, tint: '#f59e0b1A' },
  ];

  const ListHeader = (
    <View style={{ gap: 12, marginBottom: 4 }}>
      {/* Stats — single horizontal row */}
      <View style={styles.statsRow}>
        {statItems.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: t.cardBg, borderColor: t.border }]}>
            <View style={[styles.statIcon, { backgroundColor: s.tint }]}>{s.icon}</View>
            <Text style={[styles.statValue, { color: t.textPrimary }]} numberOfLines={1}>
              {s.value}
            </Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]} numberOfLines={1}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Select-all bar */}
      {leads.length > 0 && (
        <View style={[styles.rowBetween, { paddingHorizontal: 2 }]}>
          <TouchableOpacity onPress={toggleSelectAll} style={[styles.rowCenter, { gap: 8 }]}>
            {allSelected ? <CheckSquare size={18} color={t.brand} /> : <Square size={18} color={t.textMuted} />}
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary }}>Select All</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: t.textSecondary }}>
            Showing {leads.length} of {filteredTotal}
          </Text>
        </View>
      )}
    </View>
  );

  const ListEmpty = isLoading ? (
    <View style={styles.centerBox}>
      <ActivityIndicator size="large" color={t.brand} />
      <Text style={{ color: t.textSecondary, marginTop: 12, fontSize: 13 }}>Loading unassigned leads...</Text>
    </View>
  ) : isError ? (
    <View style={[styles.emptyCard, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <ShieldAlert size={36} color={DANGER} />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>Couldn't load leads</Text>
      <Text style={[styles.emptyText, { color: t.textSecondary }]}>{getErrorMessage(error, 'Something went wrong.')}</Text>
      <TouchableOpacity onPress={() => refetch()} style={[styles.primaryBtnSm, { backgroundColor: t.brand }]}>
        <Text style={styles.primaryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={[styles.emptyCard, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      {search || source ? <UserX size={36} color={t.textMuted} /> : <Inbox size={36} color={t.textMuted} />}
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>
        {search || source ? 'No matching leads' : 'No Unassigned Leads'}
      </Text>
      <Text style={[styles.emptyText, { color: t.textSecondary }]}>
        {search || source ? 'Try a different search or source filter.' : 'All leads have been assigned to sales executives.'}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.primaryBg }}>
      {/* Source dropdown (left) + Search bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          ref={filterBtnRef}
          onPress={openFilterMenu}
          activeOpacity={0.8}
          style={[
            styles.filterBtn,
            {
              backgroundColor: source ? t.badgeBg : t.cardBg,
              borderColor: source ? t.brand : t.border,
            },
          ]}
        >
          <Filter size={14} color={source ? t.brand : t.textSecondary} />
          <Text
            style={{ fontSize: 13, fontWeight: '600', color: source ? t.badgeText : t.textPrimary }}
            numberOfLines={1}
          >
            {currentSourceLabel}
          </Text>
          <ChevronDown size={14} color={source ? t.brand : t.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.searchBox, { flex: 1, backgroundColor: t.cardBg, borderColor: t.border }]}>
          <Search size={16} color={t.textSecondary} />
          <TextInput
            style={{ flex: 1, color: t.textPrimary, fontSize: 14, paddingVertical: 0 }}
            placeholder="Search name, phone, email..."
            placeholderTextColor={t.textMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
          {searchInput !== '' && (
            <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={8}>
              <X size={16} color={t.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item) => String(item.leadId)}
        renderItem={renderItem}
        extraData={selectedIds}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: bottomSpacing + (selectedIds.size > 0 ? 72 : 0),
          flexGrow: 1,
        }}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: 16 }} color={t.brand} /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            colors={[t.brand]}
            tintColor={t.brand}
          />
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />

      {/* Floating selection bar */}
      {selectedIds.size > 0 && (
        <View
          style={[
            styles.selectionBar,
            { backgroundColor: t.cardBg, borderColor: t.border, bottom: bottomSpacing > 0 ? bottomSpacing - 8 : 16 },
          ]}
        >
          <TouchableOpacity onPress={() => setSelectedIds(new Set())} style={[styles.rowCenter, { gap: 6 }]}>
            <X size={16} color={t.textSecondary} />
            <Text style={{ color: t.textPrimary, fontWeight: '600', fontSize: 13 }}>{selectedIds.size} selected</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openBulkAssign} style={[styles.primaryBtnSm, { backgroundColor: t.brand, marginTop: 0 }]}>
            <UserCheck size={14} color="#fff" />
            <Text style={styles.primaryBtnText}>Assign Selected</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Assign bottom sheet */}
      <Modal
        visible={!!assignTargets}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignTargets(null)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setAssignTargets(null)} />
          <View style={[styles.sheet, { backgroundColor: t.cardBg }]}>
            <View style={[styles.sheetHandle, { backgroundColor: t.border }]} />
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: t.textPrimary }}>Assign to Executive</Text>
              <TouchableOpacity onPress={() => setAssignTargets(null)} hitSlop={8}>
                <X size={20} color={t.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 4 }}>
              {assignTargets?.length ?? 0} lead(s) will move to the executive's pipeline.
            </Text>

            <View style={[styles.searchBox, { backgroundColor: t.inputBg, borderColor: t.border, marginTop: 14 }]}>
              <Search size={15} color={t.textSecondary} />
              <TextInput
                style={{ flex: 1, color: t.textPrimary, fontSize: 14, paddingVertical: 0 }}
                placeholder="Search executives..."
                placeholderTextColor={t.textMuted}
                value={execSearch}
                onChangeText={setExecSearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 320, marginTop: 10 }} keyboardShouldPersistTaps="handled">
              {executivesQuery.isLoading ? (
                <ActivityIndicator color={t.brand} style={{ marginVertical: 20 }} />
              ) : executivesQuery.isError ? (
                <View style={{ alignItems: 'center', padding: 12, gap: 8 }}>
                  <Text style={{ color: DANGER, fontSize: 13, textAlign: 'center' }}>
                    {getErrorMessage(executivesQuery.error, 'Could not load executives.')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => executivesQuery.refetch()}
                    style={[styles.primaryBtnSm, { backgroundColor: t.brand, marginTop: 0 }]}
                  >
                    <Text style={styles.primaryBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredExecutives.length === 0 ? (
                <Text style={{ color: t.textSecondary, fontSize: 13, padding: 12, textAlign: 'center' }}>
                  No executives found
                </Text>
              ) : (
                filteredExecutives.map((e) => {
                  const active = selectedExecId === e.userId;
                  return (
                    <TouchableOpacity
                      key={e.userId}
                      onPress={() => setSelectedExecId(e.userId)}
                      style={[
                        styles.execRow,
                        { borderColor: active ? t.brand : t.border, backgroundColor: active ? t.badgeBg : 'transparent' },
                      ]}
                    >
                      <View style={[styles.avatar, { backgroundColor: t.badgeBg }]}>
                        <Text style={{ color: t.badgeText, fontWeight: '700' }}>
                          {(e.username || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary }}>{e.username}</Text>
                        <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 1 }}>{e.role || 'Sales'}</Text>
                      </View>
                      <View style={[styles.radio, { borderColor: active ? t.brand : t.textMuted }]}>
                        {active && <View style={[styles.radioDot, { backgroundColor: t.brand }]} />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={submitAssign}
              disabled={assignMutation.isPending || !selectedExecId}
              style={[
                styles.primaryBtn,
                { backgroundColor: t.brand, opacity: assignMutation.isPending || !selectedExecId ? 0.6 : 1 },
              ]}
            >
              {assignMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Confirm Assignment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Source filter dropdown menu */}
      <Modal
        visible={!!filterMenuPos}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFilterMenuPos(null)}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setFilterMenuPos(null)}>
          <View
            style={[
              styles.dropdownMenu,
              {
                top: filterMenuPos?.top ?? 0,
                left: filterMenuPos?.left ?? 16,
                backgroundColor: t.cardBg,
                borderColor: t.border,
              },
            ]}
          >
            {SOURCE_FILTERS.map((f) => {
              const active = source === f.value;
              return (
                <TouchableOpacity
                  key={f.label}
                  onPress={() => {
                    setSource(f.value);
                    setFilterMenuPos(null);
                  }}
                  style={[styles.dropdownItem, active && { backgroundColor: t.badgeBg }]}
                >
                  {f.value === 'facebook' ? (
                    <FbIcon size={14} />
                  ) : (
                    <View style={[styles.dropdownDot, { backgroundColor: active ? t.brand : t.textMuted }]} />
                  )}
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: active ? '700' : '500',
                      color: active ? t.badgeText : t.textPrimary,
                    }}
                  >
                    {f.label}
                  </Text>
                  {active && <Check size={14} color={t.brand} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete confirm */}
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.centerOverlay}>
          <View style={[styles.dialog, { backgroundColor: t.cardBg }]}>
            <View style={{ backgroundColor: `${DANGER}15`, padding: 12, borderRadius: 24 }}>
              <ShieldAlert size={30} color={DANGER} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: t.textPrimary, textAlign: 'center' }}>Delete Lead?</Text>
            <Text style={{ fontSize: 13, color: t.textSecondary, textAlign: 'center' }}>
              <Text style={{ fontWeight: '700', color: t.textPrimary }}>{deleteTarget?.fullName}</Text> will be permanently
              removed. This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, width: '100%' }}>
              <TouchableOpacity
                onPress={() => setDeleteTarget(null)}
                style={[styles.dialogBtn, { borderWidth: 1, borderColor: t.border }]}
              >
                <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitDelete}
                disabled={deleteMutation.isPending}
                style={[styles.dialogBtn, { backgroundColor: DANGER }]}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowStart: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  searchBox: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  statIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },

  filterBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 130,
  },
  dropdownMenu: {
    position: 'absolute',
    minWidth: 170,
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dropdownDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 3 },

  card: { borderRadius: 16, borderWidth: 1, padding: 14, paddingLeft: 16, overflow: 'hidden' },
  accentBar: { position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  name: { fontSize: 15, fontWeight: '700' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  date: { fontSize: 11, fontWeight: '600' },
  time: { fontSize: 10, marginTop: 1 },
  meta: { fontSize: 12 },
  comment: { fontSize: 12, fontStyle: 'italic', flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, gap: 10 },
  label: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  value: { fontSize: 12, fontWeight: '600' },
  iconBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  assignBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 32, borderRadius: 10 },
  assignBtnText: { fontSize: 12, fontWeight: '700' },

  centerBox: { padding: 40, alignItems: 'center' },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 8, marginTop: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  emptyText: { fontSize: 12, textAlign: 'center' },

  selectionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  primaryBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryBtnSm: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 38, borderRadius: 12, marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  execRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4 },

  centerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', gap: 12 },
  dialogBtn: { flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
