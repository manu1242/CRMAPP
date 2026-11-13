import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  X,
  Users,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  User,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  Check,
  Building,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import {
  useAgentLeadTracking,
  useAssignAgentLead,
} from '../../../admin/hooks/useAgentTracking';
import {
  AgentTrackingAgent,
  AgentTrackingLead,
} from '../../../admin/models/AgentTrackingTypes';
import Toast from 'react-native-toast-message';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';

const STAGE_COLORS: Record<string, { color: string; bg: string }> = {
  New: { color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' },
  Contacted: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  Interested: { color: '#0d9488', bg: 'rgba(13, 148, 136, 0.12)' },
  'Site Visit': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  Negotiation: { color: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)' },
  Won: { color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' },
  Lost: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
  Dropped: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
};

function getStageBadge(stage: string) {
  const match = STAGE_COLORS[stage] || { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' };
  return match;
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'Not scheduled';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function AgentLeadTrackingScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  // Filters & State
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Reassignment Modal State
  const [assignModalLead, setAssignModalLead] = useState<AgentTrackingLead | null>(null);
  const [selectedAssignAgentId, setSelectedAssignAgentId] = useState<number | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch tracking data
  const { data: res, isLoading, isRefetching, refetch } = useAgentLeadTracking(
    selectedExecutiveId,
    debouncedSearch || undefined,
    selectedStage === 'All' ? undefined : selectedStage,
    page,
    pageSize
  );

  const assignMutation = useAssignAgentLead();

  const trackingData = res?.data;
  const agents: AgentTrackingAgent[] = trackingData?.agents || [];
  const leads: AgentTrackingLead[] = trackingData?.items || [];
  const totalCount = trackingData?.totalCount || 0;
  const totalPages = trackingData?.totalPages || 1;
  const canAssignLeads = trackingData?.canAssignLeads ?? true;

  const handleSelectAgent = (agentId?: number) => {
    setSelectedExecutiveId(agentId);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedExecutiveId(undefined);
    setSearch('');
    setDebouncedSearch('');
    setSelectedStage('All');
    setPage(1);
  };

  const handleDial = (contact: string) => {
    if (!contact || contact === '-') return;
    Linking.openURL(`tel:${contact}`);
  };

  const handleOpenAssign = (lead: AgentTrackingLead) => {
    setAssignModalLead(lead);
    setSelectedAssignAgentId(lead.assignedAgentId);
  };

  const handleConfirmAssignment = () => {
    if (!assignModalLead) return;

    assignMutation.mutate(
      {
        leadId: assignModalLead.leadId,
        agentId: selectedAssignAgentId,
      },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: 'Assignment Updated',
            text2: 'Lead has been reassigned successfully.',
          });
          setAssignModalLead(null);
          refetch();
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to update assignment';
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: msg,
          });
        },
      }
    );
  };

  const stagesList = ['All', 'New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Won', 'Lost'];

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>
      {/* ── TOP HEADER BANNER ── */}
      <View style={[styles.headerBanner, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
            accessibilityLabel="Back"
          >
            <ArrowLeft size={18} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={18} color={theme.brand} />
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Agent Lead Tracking</Text>
            </View>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]} numberOfLines={1}>
              Review assigned leads, current stage & follow-ups
            </Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5', borderColor: theme.brand }]}>
            <Text style={[styles.countBadgeText, { color: theme.brand }]}>{totalCount} Leads</Text>
          </View>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Search size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search lead by name, phone, location..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomSpacing + 30 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── AGENT FILTER PILL SCROLLER ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>FILTER BY AGENT</Text>
          {selectedExecutiveId && (
            <TouchableOpacity onPress={() => handleSelectAgent(undefined)}>
              <Text style={{ fontSize: 11, color: theme.brand, fontWeight: '600' }}>Show All</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.agentPillsContainer}
        >
          {/* All Agents Pill */}
          <TouchableOpacity
            onPress={() => handleSelectAgent(undefined)}
            style={[
              styles.agentPill,
              { backgroundColor: theme.secondaryBg, borderColor: theme.border },
              selectedExecutiveId === undefined && {
                backgroundColor: theme.brand,
                borderColor: theme.brand,
              },
            ]}
          >
            <Users size={14} color={selectedExecutiveId === undefined ? '#ffffff' : theme.textSecondary} />
            <Text
              style={[
                styles.agentPillName,
                { color: selectedExecutiveId === undefined ? '#ffffff' : theme.textPrimary },
              ]}
            >
              All Agents
            </Text>
            <View
              style={[
                styles.agentPillCount,
                {
                  backgroundColor:
                    selectedExecutiveId === undefined ? 'rgba(255,255,255,0.25)' : theme.inputBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.agentPillCountText,
                  { color: selectedExecutiveId === undefined ? '#ffffff' : theme.textSecondary },
                ]}
              >
                {agents.reduce((acc, a) => acc + (a.leadCount || 0), 0) || totalCount}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Individual Agent Pills */}
          {agents.map((ag) => {
            const isSelected = selectedExecutiveId === ag.userId;
            return (
              <TouchableOpacity
                key={`ag-${ag.userId}`}
                onPress={() => handleSelectAgent(ag.userId)}
                style={[
                  styles.agentPill,
                  { backgroundColor: theme.secondaryBg, borderColor: theme.border },
                  isSelected && {
                    backgroundColor: theme.brand,
                    borderColor: theme.brand,
                  },
                ]}
              >
                <User size={13} color={isSelected ? '#ffffff' : theme.textSecondary} />
                <Text
                  style={[
                    styles.agentPillName,
                    { color: isSelected ? '#ffffff' : theme.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {ag.name}
                </Text>
                <View
                  style={[
                    styles.agentPillCount,
                    {
                      backgroundColor:
                        isSelected ? 'rgba(255,255,255,0.25)' : theme.inputBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.agentPillCountText,
                      { color: isSelected ? '#ffffff' : theme.textSecondary },
                    ]}
                  >
                    {ag.leadCount ?? 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── STAGE FILTER CHIPS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stagePillsContainer}
        >
          {stagesList.map((st) => {
            const isSelected = selectedStage === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => {
                  setSelectedStage(st);
                  setPage(1);
                }}
                style={[
                  styles.stagePill,
                  { backgroundColor: theme.secondaryBg, borderColor: theme.border },
                  isSelected && { backgroundColor: theme.textPrimary, borderColor: theme.textPrimary },
                ]}
              >
                <Text
                  style={[
                    styles.stagePillText,
                    { color: isSelected ? '#ffffff' : theme.textSecondary },
                  ]}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── LEADS LIST SECTION ── */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
              TRACKED LEADS ({leads.length})
            </Text>
            {(selectedExecutiveId !== undefined || selectedStage !== 'All' || debouncedSearch.length > 0) && (
              <TouchableOpacity onPress={handleClearFilters} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <RotateCcw size={12} color={theme.brand} />
                <Text style={{ fontSize: 11, color: theme.brand, fontWeight: '600' }}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={theme.brand} />
              <Text style={{ color: theme.textSecondary, marginTop: 10, fontSize: 12 }}>Loading agent leads...</Text>
            </View>
          ) : leads.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
              <Users size={38} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Leads Found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                No leads match this agent selection or active filter criteria.
              </Text>
              <TouchableOpacity
                onPress={handleClearFilters}
                style={[styles.clearFilterBtn, { backgroundColor: theme.brand }]}
              >
                <Text style={styles.clearFilterBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            leads.map((lead) => {
              const stageStyle = getStageBadge(lead.stage);

              return (
                <View
                  key={`lead-${lead.leadId}`}
                  style={[styles.leadCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                >
                  {/* Lead Card Header: Name + Stage */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <TouchableOpacity onPress={() => router.push(`/admin/leads/${lead.leadId}` as any)}>
                        <Text style={[styles.leadName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {lead.name}
                        </Text>
                      </TouchableOpacity>
                      <Text style={[styles.leadMeta, { color: theme.textMuted }]}>
                        Lead #{lead.leadId} · {lead.contact}
                      </Text>
                    </View>
                    <View style={[styles.stageBadge, { backgroundColor: stageStyle.bg }]}>
                      <Text style={[styles.stageBadgeText, { color: stageStyle.color }]}>{lead.stage}</Text>
                    </View>
                  </View>

                  {/* Fields Grid (2-column details) */}
                  <View style={[styles.fieldsGrid, { borderColor: theme.border }]}>
                    <View style={styles.fieldItem}>
                      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>EMAIL</Text>
                      <Text style={[styles.fieldVal, { color: theme.textPrimary }]} numberOfLines={1}>
                        {lead.email || '-'}
                      </Text>
                    </View>

                    <View style={styles.fieldItem}>
                      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>SOURCE</Text>
                      <Text style={[styles.fieldVal, { color: theme.textPrimary }]} numberOfLines={1}>
                        {lead.source || '-'}
                      </Text>
                    </View>

                    <View style={styles.fieldItem}>
                      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>LOCATION</Text>
                      <Text style={[styles.fieldVal, { color: theme.textPrimary }]} numberOfLines={1}>
                        {lead.location || '-'}
                      </Text>
                    </View>

                    <View style={styles.fieldItem}>
                      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>CREATED</Text>
                      <Text style={[styles.fieldVal, { color: theme.textPrimary }]} numberOfLines={1}>
                        {formatDate(lead.createdOn)}
                      </Text>
                    </View>
                  </View>

                  {/* Follow-Up Highlight Box */}
                  <View
                    style={[
                      styles.followUpBox,
                      {
                        backgroundColor: lead.followUpDate
                          ? (isDark ? 'rgba(212, 164, 90, 0.12)' : '#fffbeb')
                          : theme.inputBg,
                        borderColor: lead.followUpDate
                          ? (isDark ? 'rgba(212, 164, 90, 0.28)' : '#fde68a')
                          : theme.border,
                      },
                    ]}
                  >
                    <Calendar size={13} color={lead.followUpDate ? '#d4a45a' : theme.textMuted} />
                    <Text
                      style={[
                        styles.followUpText,
                        { color: lead.followUpDate ? (isDark ? '#e3b063' : '#92400e') : theme.textMuted },
                      ]}
                    >
                      Next follow-up: {formatDate(lead.followUpDate)}
                    </Text>
                  </View>

                  {/* Assignment & Actions Bar */}
                  <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                    <View style={styles.assignedToWrap}>
                      <Text style={[styles.assignedLabel, { color: theme.textMuted }]}>ASSIGNED:</Text>
                      <View style={[styles.agentAvatarPill, { backgroundColor: theme.inputBg }]}>
                        <UserCheck size={12} color={theme.brand} />
                        <Text style={[styles.assignedAgentName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {lead.assignedAgentName || 'Unassigned'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionsRow}>
                      {lead.contact && lead.contact !== '-' && (
                        <TouchableOpacity
                          onPress={() => handleDial(lead.contact)}
                          style={[styles.actionIconBtn, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
                          accessibilityLabel="Call Lead"
                        >
                          <Phone size={13} color={theme.brand} />
                        </TouchableOpacity>
                      )}

                      {canAssignLeads && (
                        <TouchableOpacity
                          onPress={() => handleOpenAssign(lead)}
                          style={[styles.reassignBtn, { borderColor: theme.brand, backgroundColor: theme.inputBg }]}
                        >
                          <Text style={[styles.reassignBtnText, { color: theme.brand }]}>Reassign</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => router.push(`/admin/leads/${lead.leadId}` as any)}
                        style={[styles.detailsBtn, { backgroundColor: theme.brand }]}
                      >
                        <Text style={styles.detailsBtnText}>Details</Text>
                        <ChevronRight size={13} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* ── PAGINATION CONTROLS ── */}
          {totalPages > 1 && (
            <View style={[styles.paginationRow, { borderColor: theme.border, backgroundColor: theme.secondaryBg }]}>
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={[styles.pageBtn, page <= 1 && { opacity: 0.4 }]}
              >
                <ChevronLeft size={16} color={theme.textPrimary} />
                <Text style={[styles.pageBtnText, { color: theme.textPrimary }]}>Prev</Text>
              </TouchableOpacity>

              <Text style={[styles.pageInfoText, { color: theme.textSecondary }]}>
                Page {page} of {totalPages}
              </Text>

              <TouchableOpacity
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={[styles.pageBtn, page >= totalPages && { opacity: 0.4 }]}
              >
                <Text style={[styles.pageBtnText, { color: theme.textPrimary }]}>Next</Text>
                <ChevronRight size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── REASSIGN AGENT MODAL ── */}
      <Modal visible={assignModalLead !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Reassign Lead</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {assignModalLead?.name} (Lead #{assignModalLead?.leadId})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAssignModalLead(null)}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>SELECT ASSIGNED AGENT</Text>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {/* Unassigned Option */}
              <TouchableOpacity
                onPress={() => setSelectedAssignAgentId(null)}
                style={[
                  styles.agentOptionRow,
                  { borderColor: theme.border, backgroundColor: theme.inputBg },
                  selectedAssignAgentId === null && {
                    borderColor: theme.brand,
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.agentOptionName, { color: theme.textPrimary }]}>Unassigned</Text>
                  <Text style={[styles.agentOptionMeta, { color: theme.textMuted }]}>Clear agent assignment</Text>
                </View>
                {selectedAssignAgentId === null && <Check size={16} color={theme.brand} />}
              </TouchableOpacity>

              {/* Agents list */}
              {agents.map((ag) => {
                const isSelected = selectedAssignAgentId === ag.userId;
                return (
                  <TouchableOpacity
                    key={`assign-${ag.userId}`}
                    onPress={() => setSelectedAssignAgentId(ag.userId)}
                    style={[
                      styles.agentOptionRow,
                      { borderColor: theme.border, backgroundColor: theme.inputBg },
                      isSelected && {
                        borderColor: theme.brand,
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.agentOptionName, { color: theme.textPrimary }]}>{ag.name}</Text>
                      <Text style={[styles.agentOptionMeta, { color: theme.textMuted }]}>
                        {ag.email ? ag.email + ' · ' : ''}
                        {ag.leadCount} active leads
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color={theme.brand} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                onPress={() => setAssignModalLead(null)}
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmAssignment}
                disabled={assignMutation.isPending}
                style={[styles.modalSaveBtn, { backgroundColor: theme.brand }]}
              >
                {assignMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Save Assignment</Text>
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
  container: {
    flex: 1,
  },
  headerBanner: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  agentPillsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  agentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  agentPillName: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 120,
  },
  agentPillCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  agentPillCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stagePillsContainer: {
    paddingHorizontal: 16,
    gap: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  stagePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  stagePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listSection: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  leadCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  leadMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingTop: 8,
    marginBottom: 8,
  },
  fieldItem: {
    width: '50%',
    paddingVertical: 4,
    paddingRight: 6,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fieldVal: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  followUpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  followUpText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 6,
  },
  assignedToWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  assignedLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  agentAvatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    maxWidth: 130,
  },
  assignedAgentName: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reassignBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  reassignBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  detailsBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  clearFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFilterBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pageInfoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  agentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  agentOptionName: {
    fontSize: 13,
    fontWeight: '700',
  },
  agentOptionMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
});

