import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  Search,
  X,
  Users,
  Phone,
  Mail,
  MapPin,
  CalendarClock,
  CalendarPlus,
  Tag,
  Activity,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  UserX,
  ShieldAlert,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme, AdminThemeTokens } from '../../../theme/adminTheme';
import { useAgentLeadTracking, useAssignAgentLead } from '../../../admin/hooks/useAgentTracking';
import { AgentTrackingAgent, AgentTrackingLead } from '../../../admin/models/AgentTrackingTypes';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';

const PAGE_SIZE = 15;

// Same pipeline stages the backend uses (LeadsApiController.GetFormOptions)
const STAGES = ['All', 'New', 'Office Meeting', 'Site Visit Requested', 'Site Visit Done', 'Quotation', 'Quotation Sent', 'Negotiation', 'Booked'];

const STAGE_TONE: Record<string, string> = {
  New: '#0284c7',
  'Office Meeting': '#8b5cf6',
  'Site Visit Requested': '#f59e0b',
  'Site Visit Done': '#0d9488',
  Quotation: '#6366f1',
  'Quotation Sent': '#4f46e5',
  Negotiation: '#ea580c',
  Booked: '#059669',
};
const stageTone = (s?: string) => STAGE_TONE[s || ''] || '#64748b';

const AVATAR_TONES = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#0ea5e9', '#14b8a6', '#f97316'];
const avatarTone = (id: number) => AVATAR_TONES[Math.abs(id) % AVATAR_TONES.length];
const initials = (name?: string) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

const fmtDate = (v?: string | null) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const isOverdue = (v?: string | null) => {
  if (!v) return false;
  const d = new Date(v);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !isNaN(d.getTime()) && d < today;
};

/* ── Lead card ─────────────────────────────────────────────────────── */
const LeadCard = memo(function LeadCard({
  lead,
  t,
  canAssign,
  onOpen,
  onReassign,
}: {
  lead: AgentTrackingLead;
  t: AdminThemeTokens;
  canAssign: boolean;
  onOpen: (id: number) => void;
  onReassign: (lead: AgentTrackingLead) => void;
}) {
  const tone = stageTone(lead.stage);
  const followUp = fmtDate(lead.followUpDate);
  const overdue = isOverdue(lead.followUpDate);
  const assigned = lead.assignedAgentId != null && lead.assignedAgentName !== 'Unassigned';
  const hasPhone = !!lead.contact && lead.contact !== '-';

  const Info = ({ icon, value }: { icon: React.ReactNode; value: string }) => (
    <View style={styles.infoItem}>
      {icon}
      <Text style={[styles.infoText, { color: t.textSecondary }]} numberOfLines={1}>
        {value || '-'}
      </Text>
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onOpen(lead.leadId)}
      style={[styles.leadCard, { backgroundColor: t.cardBg, borderColor: t.border }]}
    >
      {/* Head */}
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.leadName, { color: t.textPrimary }]} numberOfLines={1}>
            {lead.name || 'Unnamed Lead'}
          </Text>
          <Text style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
            Lead #{lead.leadId} · {lead.contact || '-'}
          </Text>
        </View>
        <View style={[styles.stagePill, { backgroundColor: `${tone}1A` }]}>
          <View style={[styles.stageDot, { backgroundColor: tone }]} />
          <Text style={[styles.stageText, { color: tone }]} numberOfLines={1}>
            {lead.stage || 'New'}
          </Text>
        </View>
      </View>

      {/* Details (web: Email, Source, Location, Created, Status) */}
      <View style={styles.infoGrid}>
        <Info icon={<Mail size={12} color={t.textMuted} />} value={lead.email} />
        <Info icon={<Tag size={12} color={t.textMuted} />} value={lead.source} />
        <Info icon={<MapPin size={12} color={t.textMuted} />} value={lead.location} />
        <Info icon={<CalendarPlus size={12} color={t.textMuted} />} value={fmtDate(lead.createdOn) || '-'} />
        <Info icon={<Activity size={12} color={t.textMuted} />} value={lead.status} />
      </View>

      {/* Next follow-up */}
      <View
        style={[
          styles.followUp,
          {
            backgroundColor: !followUp ? t.inputBg : overdue ? '#ef44441A' : '#f59e0b14',
          },
        ]}
      >
        <CalendarClock size={13} color={!followUp ? t.textMuted : overdue ? '#ef4444' : '#d97706'} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: !followUp ? t.textMuted : overdue ? '#ef4444' : '#b45309' }}>
          Next follow-up: {followUp || 'Not scheduled'}
          {overdue ? ' · Overdue' : ''}
        </Text>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: t.border }]}>
        <View style={[styles.rowCenter, { flex: 1, gap: 8 }]}>
          <View
            style={[
              styles.miniAvatar,
              { backgroundColor: assigned ? `${avatarTone(lead.assignedAgentId as number)}1F` : t.inputBg },
            ]}
          >
            {assigned ? (
              <Text style={{ fontSize: 10, fontWeight: '800', color: avatarTone(lead.assignedAgentId as number) }}>
                {initials(lead.assignedAgentName)}
              </Text>
            ) : (
              <UserX size={12} color={t.textMuted} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: t.textMuted }}>Assigned</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: assigned ? t.textPrimary : t.textMuted }} numberOfLines={1}>
              {lead.assignedAgentName || 'Unassigned'}
            </Text>
          </View>
        </View>

        {hasPhone && (
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${lead.contact}`)}
            style={[styles.iconBtn, { backgroundColor: t.badgeBg }]}
            hitSlop={6}
          >
            <Phone size={14} color={t.brand} />
          </TouchableOpacity>
        )}
        {canAssign && lead.canReassign !== false && (
          <TouchableOpacity onPress={() => onReassign(lead)} style={[styles.reassignBtn, { borderColor: t.brand }]}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.brand }}>Reassign</Text>
          </TouchableOpacity>
        )}
        <ChevronRight size={16} color={t.textMuted} />
      </View>
    </TouchableOpacity>
  );
});

/* ── Screen ────────────────────────────────────────────────────────── */
export default function AgentLeadTrackingScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const t = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  const [executiveId, setExecutiveId] = useState<number | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('All');
  const [page, setPage] = useState(1);

  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [agentPickerSearch, setAgentPickerSearch] = useState('');
  const [reassignLead, setReassignLead] = useState<AgentTrackingLead | null>(null);
  const [reassignTo, setReassignTo] = useState<number | null>(null);
  const [agentSearch, setAgentSearch] = useState('');

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data: res, isLoading, isError, error, isRefetching, isFetching, refetch } = useAgentLeadTracking(
    executiveId,
    search || undefined,
    stage === 'All' ? undefined : stage,
    page,
    PAGE_SIZE
  );
  const assignMutation = useAssignAgentLead();

  const d = res?.data;
  const agents: AgentTrackingAgent[] = d?.agents || [];
  const leads: AgentTrackingLead[] = d?.items || [];
  const totalCount = d?.totalCount || 0;
  const totalPages = d?.totalPages || 1;
  const canAssign = d?.canAssignLeads ?? false;
  const hasFilters = executiveId !== undefined || !!search || stage !== 'All';

  // "All" count stays the overall total even while a single agent is selected
  const [allCount, setAllCount] = useState(0);
  useEffect(() => {
    if (executiveId === undefined && !search && stage === 'All' && d) setAllCount(totalCount);
  }, [executiveId, search, stage, d, totalCount]);

  const selectAgent = useCallback((id?: number) => {
    setExecutiveId(id);
    setPage(1);
  }, []);
  const openLead = useCallback((id: number) => router.push(`/admin/leads/${id}` as any), [router]);
  const openReassign = useCallback((lead: AgentTrackingLead) => {
    setReassignLead(lead);
    setReassignTo(lead.assignedAgentId);
    setAgentSearch('');
  }, []);

  const clearFilters = () => {
    setExecutiveId(undefined);
    setSearchInput('');
    setSearch('');
    setStage('All');
    setPage(1);
  };

  const selectedAgent = agents.find((a) => a.userId === executiveId);
  const selectedTone = selectedAgent ? avatarTone(selectedAgent.userId) : t.brand;
  const pickerAgents = useMemo(() => {
    const q = agentPickerSearch.trim().toLowerCase();
    return q ? agents.filter((a) => a.name.toLowerCase().includes(q)) : agents;
  }, [agents, agentPickerSearch]);

  const filteredAgents = useMemo(() => {
    const q = agentSearch.trim().toLowerCase();
    return q ? agents.filter((a) => a.name.toLowerCase().includes(q)) : agents;
  }, [agents, agentSearch]);

  const confirmReassign = () => {
    if (!reassignLead) return;
    assignMutation.mutate(
      { leadId: reassignLead.leadId, agentId: reassignTo },
      {
        onSuccess: (r: any) => {
          Toast.show({ type: 'success', text1: 'Assignment Updated', text2: r?.message || 'Lead reassigned.' });
          setReassignLead(null);
        },
        onError: (err: any) =>
          Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to update assignment' }),
      }
    );
  };

  const Header = (
    <View style={{ marginBottom: 12 }}>
      {/* Filter by agent — dropdown */}
      <Text style={[styles.fieldLabel, { color: t.textMuted }]}>FILTER BY AGENT</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          setAgentPickerSearch('');
          setAgentPickerOpen(true);
        }}
        style={[
          styles.dropdown,
          { backgroundColor: t.cardBg, borderColor: executiveId !== undefined ? t.brand : t.border },
        ]}
      >
        <View style={[styles.miniAvatar, { width: 32, height: 32, borderRadius: 16, backgroundColor: `${selectedTone}1F` }]}>
          {selectedAgent ? (
            <Text style={{ fontSize: 12, fontWeight: '800', color: selectedTone }}>{initials(selectedAgent.name)}</Text>
          ) : (
            <Users size={15} color={selectedTone} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }} numberOfLines={1}>
            {selectedAgent ? selectedAgent.name : 'All agents and leads'}
          </Text>
          <Text style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
            {selectedAgent ? `${selectedAgent.leadCount || 0} leads` : `${agents.length} agents · ${allCount || totalCount} leads`}
          </Text>
        </View>
        {executiveId !== undefined ? (
          <TouchableOpacity onPress={() => selectAgent(undefined)} hitSlop={8} style={{ padding: 2 }}>
            <X size={16} color={t.textSecondary} />
          </TouchableOpacity>
        ) : null}
        <ChevronDown size={18} color={t.textSecondary} />
      </TouchableOpacity>

      {/* Stage chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        style={{ marginHorizontal: -16, paddingLeft: 16, marginTop: 14 }}
      >
        {STAGES.map((s) => {
          const active = stage === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => {
                setStage(s);
                setPage(1);
              }}
              style={[
                styles.chip,
                { backgroundColor: active ? t.textPrimary : t.cardBg, borderColor: active ? t.textPrimary : t.border },
              ]}
            >
              <Text style={{ fontSize: 12, fontWeight: active ? '700' : '500', color: active ? t.primaryBg : t.textSecondary }}>
                {s}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results bar */}
      <View style={[styles.rowBetween, { marginTop: 16 }]}>
        <View style={[styles.rowCenter, { gap: 8 }]}>
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Leads</Text>
          <View style={[styles.countChip, { backgroundColor: t.badgeBg }]}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: t.badgeText }}>{totalCount}</Text>
          </View>
          {isFetching && !isRefetching && <ActivityIndicator size="small" color={t.brand} />}
        </View>
        {hasFilters && (
          <TouchableOpacity onPress={clearFilters} hitSlop={8}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.brand }}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const Empty = isLoading ? (
    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
      <ActivityIndicator size="large" color={t.brand} />
      <Text style={{ color: t.textSecondary, marginTop: 12, fontSize: 13 }}>Loading agent leads...</Text>
    </View>
  ) : isError ? (
    <View style={[styles.empty, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <ShieldAlert size={32} color="#ef4444" />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>Couldn't load leads</Text>
      <Text style={{ fontSize: 12, color: t.textSecondary, textAlign: 'center' }}>
        {(error as any)?.response?.data?.message || 'Something went wrong.'}
      </Text>
      <TouchableOpacity onPress={() => refetch()} style={[styles.primaryBtn, { backgroundColor: t.brand, marginTop: 6 }]}>
        <Text style={styles.primaryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={[styles.empty, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <Users size={32} color={t.textMuted} />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No leads found</Text>
      <Text style={{ fontSize: 12, color: t.textSecondary, textAlign: 'center' }}>No leads match this agent selection.</Text>
    </View>
  );

  const Footer =
    totalPages > 1 ? (
      <View style={[styles.rowBetween, { marginTop: 14 }]}>
        <TouchableOpacity
          disabled={page <= 1 || isFetching}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          style={[styles.pageBtn, { borderColor: t.border, backgroundColor: t.cardBg, opacity: page <= 1 ? 0.45 : 1 }]}
        >
          <ChevronLeft size={16} color={t.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 12, fontWeight: '600', color: t.textSecondary }}>
          Page {page} of {totalPages}
        </Text>
        <TouchableOpacity
          disabled={page >= totalPages || isFetching}
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          style={[styles.pageBtn, { borderColor: t.border, backgroundColor: t.cardBg, opacity: page >= totalPages ? 0.45 : 1 }]}
        >
          <ChevronRight size={16} color={t.textPrimary} />
        </TouchableOpacity>
      </View>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: t.primaryBg }}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: t.cardBg, borderBottomColor: t.border }]}>
        <View style={[styles.rowCenter, { gap: 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: t.inputBg }]} hitSlop={6}>
            <ArrowLeft size={18} color={t.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: t.textPrimary }]}>Agent Lead Tracking</Text>
            <Text style={{ fontSize: 12, color: t.textSecondary }} numberOfLines={1}>
              Review assigned leads, current stage, and the next follow-up date.
            </Text>
          </View>
        </View>
        <View style={[styles.search, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <Search size={16} color={t.textSecondary} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search lead name, phone or email..."
            placeholderTextColor={t.textMuted}
            style={{ flex: 1, color: t.textPrimary, fontSize: 14, paddingVertical: 0 }}
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
        data={isLoading || isError ? [] : leads}
        keyExtractor={(l) => String(l.leadId)}
        renderItem={({ item }) => (
          <LeadCard lead={item} t={t} canAssign={canAssign} onOpen={openLead} onReassign={openReassign} />
        )}
        ListHeaderComponent={Header}
        ListEmptyComponent={Empty}
        ListFooterComponent={Footer}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomSpacing + 20, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[t.brand]} tintColor={t.brand} />}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        windowSize={7}
      />

      {/* Agent filter picker */}
      <Modal visible={agentPickerOpen} transparent animationType="slide" onRequestClose={() => setAgentPickerOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setAgentPickerOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: t.cardBg }]}>
            <View style={[styles.handle, { backgroundColor: t.border }]} />
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: t.textPrimary }}>Filter by agent</Text>
              <TouchableOpacity onPress={() => setAgentPickerOpen(false)} hitSlop={8}>
                <X size={20} color={t.textSecondary} />
              </TouchableOpacity>
            </View>

            {agents.length > 6 && (
              <View style={[styles.search, { backgroundColor: t.inputBg, borderColor: t.border, marginTop: 14 }]}>
                <Search size={15} color={t.textSecondary} />
                <TextInput
                  value={agentPickerSearch}
                  onChangeText={setAgentPickerSearch}
                  placeholder="Search agents..."
                  placeholderTextColor={t.textMuted}
                  style={{ flex: 1, color: t.textPrimary, fontSize: 14, paddingVertical: 0 }}
                />
              </View>
            )}

            <ScrollView style={{ maxHeight: 380, marginTop: 12 }} keyboardShouldPersistTaps="handled">
              {[{ userId: undefined as number | undefined, name: 'All agents and leads', leadCount: allCount || totalCount }, ...pickerAgents].map((a) => {
                const active = executiveId === a.userId;
                const tone = a.userId === undefined ? t.brand : avatarTone(a.userId);
                return (
                  <TouchableOpacity
                    key={String(a.userId ?? 'all')}
                    onPress={() => {
                      selectAgent(a.userId);
                      setAgentPickerOpen(false);
                    }}
                    style={[styles.agentRow, { borderColor: active ? t.brand : t.border, backgroundColor: active ? t.badgeBg : 'transparent' }]}
                  >
                    <View style={[styles.miniAvatar, { width: 34, height: 34, borderRadius: 17, backgroundColor: `${tone}1F` }]}>
                      {a.userId === undefined ? (
                        <Users size={15} color={tone} />
                      ) : (
                        <Text style={{ fontSize: 12, fontWeight: '800', color: tone }}>{initials(a.name)}</Text>
                      )}
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: active ? '700' : '600', color: t.textPrimary }} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <View style={[styles.countChip, { backgroundColor: active ? t.brand : t.inputBg }]}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#fff' : t.textSecondary }}>{a.leadCount || 0}</Text>
                    </View>
                    {active && <Check size={16} color={t.brand} />}
                  </TouchableOpacity>
                );
              })}
              {pickerAgents.length === 0 && agentPickerSearch !== '' && (
                <Text style={{ textAlign: 'center', color: t.textMuted, fontSize: 13, paddingVertical: 16 }}>No agents found</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reassign sheet */}
      <Modal visible={!!reassignLead} transparent animationType="slide" onRequestClose={() => setReassignLead(null)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setReassignLead(null)} />
          <View style={[styles.sheet, { backgroundColor: t.cardBg }]}>
            <View style={[styles.handle, { backgroundColor: t.border }]} />
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: t.textPrimary }}>Reassign Lead</Text>
                <Text style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }} numberOfLines={1}>
                  {reassignLead?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReassignLead(null)} hitSlop={8}>
                <X size={20} color={t.textSecondary} />
              </TouchableOpacity>
            </View>

            {agents.length > 6 && (
              <View style={[styles.search, { backgroundColor: t.inputBg, borderColor: t.border, marginTop: 14 }]}>
                <Search size={15} color={t.textSecondary} />
                <TextInput
                  value={agentSearch}
                  onChangeText={setAgentSearch}
                  placeholder="Search agents..."
                  placeholderTextColor={t.textMuted}
                  style={{ flex: 1, color: t.textPrimary, fontSize: 14, paddingVertical: 0 }}
                />
              </View>
            )}

            <ScrollView style={{ maxHeight: 340, marginTop: 12 }} keyboardShouldPersistTaps="handled">
              {[{ userId: null as number | null, name: 'Unassigned', leadCount: -1 }, ...filteredAgents].map((a) => {
                const active = reassignTo === a.userId;
                const tone = a.userId == null ? t.textMuted : avatarTone(a.userId);
                return (
                  <TouchableOpacity
                    key={String(a.userId)}
                    onPress={() => setReassignTo(a.userId)}
                    style={[styles.agentRow, { borderColor: active ? t.brand : t.border, backgroundColor: active ? t.badgeBg : 'transparent' }]}
                  >
                    <View style={[styles.miniAvatar, { width: 34, height: 34, borderRadius: 17, backgroundColor: `${tone}1F` }]}>
                      {a.userId == null ? (
                        <UserX size={15} color={tone} />
                      ) : (
                        <Text style={{ fontSize: 12, fontWeight: '800', color: tone }}>{initials(a.name)}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary }}>{a.name}</Text>
                      <Text style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
                        {a.leadCount < 0 ? 'Clear agent assignment' : `${a.leadCount} leads`}
                      </Text>
                    </View>
                    <View style={[styles.radio, { borderColor: active ? t.brand : t.textMuted }]}>
                      {active && <Check size={11} color={t.brand} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={confirmReassign}
              disabled={assignMutation.isPending || reassignTo === reassignLead?.assignedAgentId}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: t.brand,
                  marginTop: 14,
                  opacity: assignMutation.isPending || reassignTo === reassignLead?.assignedAgentId ? 0.55 : 1,
                },
              ]}
            >
              {assignMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save Assignment</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800' },
  search: { height: 42, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },

  sectionTitle: { fontSize: 14, fontWeight: '700' },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  dropdown: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 56, borderRadius: 14, borderWidth: 1 },


  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, borderWidth: 1 },
  countChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },

  leadCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  leadName: { fontSize: 15, fontWeight: '700' },
  stagePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, maxWidth: 150 },
  stageDot: { width: 6, height: 6, borderRadius: 3 },
  stageText: { fontSize: 11, fontWeight: '700' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 8 },
  infoItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 8 },
  infoText: { fontSize: 12, flexShrink: 1 },
  followUp: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  miniAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  reassignBtn: { height: 34, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  empty: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  pageBtn: { width: 40, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
