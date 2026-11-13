import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Kanban,
  FileText,
  Star,
  ChevronRight,
  ArrowRightLeft,
  X,
  Check,
  AlertCircle,
  Building,
  CalendarCheck,
  Phone,
  Mail,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { useSalesPipelineStore } from '../../../admin/store/useSalesPipelineStore';
import { LeadItem } from '../../../admin/models/LeadTypes';
import PipelineStageCard from '../../../admin/components/PipelineStageCard';
import LeadStatusBadge from '../../../admin/components/LeadStatusBadge';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';

// Safe date formatter
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

export default function SalesPipelineScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

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
  } = useSalesPipelineStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeadForMove, setSelectedLeadForMove] = useState<LeadItem | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPipelineData();
    setRefreshing(false);
  };

  // Dynamic Admin Theme Colors (from admin.css)
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  // Calculate total leads across all stages
  const totalPipelineLeads = pipelineGroups.reduce((acc, curr) => acc + (curr.count || curr.leads?.length || 0), 0);

  // Active Stage Group
  const activeGroup = pipelineGroups.find(
    (g) => g.stage.trim().toLowerCase() === selectedStage.trim().toLowerCase()
  );
  const activeLeads = activeGroup?.leads || [];

  const handleOpenMoveModal = (lead: LeadItem) => {
    setSelectedLeadForMove(lead);
    setIsMoveModalOpen(true);
  };

  const handleMoveToStage = async (targetStage: string) => {
    if (!selectedLeadForMove) return;
    setIsMoveModalOpen(false);
    const success = await updateLeadStage(selectedLeadForMove.leadId, targetStage);
    if (!success) {
      Alert.alert('Stage Move Failed', 'Unable to update lead stage. Please try again.');
    }
  };

  // Render Rating Pill
  const renderRatingBadge = (rating?: string | null) => {
    if (!rating) return null;
    let badgeBg = '#3b82f615';
    let textCol = '#3b82f6';
    if (rating.toLowerCase() === 'hot') {
      badgeBg = '#ef444415';
      textCol = '#ef4444';
    } else if (rating.toLowerCase() === 'warm') {
      badgeBg = '#f59e0b15';
      textCol = '#f59e0b';
    } else if (rating.toLowerCase() === 'cold') {
      badgeBg = '#06b6d415';
      textCol = '#06b6d4';
    }

    return (
      <View style={[styles.ratingBadge, { backgroundColor: badgeBg }]}>
        <Star size={11} color={textCol} fill={textCol} />
        <Text style={[styles.ratingText, { color: textCol }]}>{rating}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top Header */}



      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomSpacing, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Horizontal Stage Selector Pills */}
        <View style={{ paddingTop: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {stages.map((stg) => {
              const groupObj = pipelineGroups.find((g) => g.stage.trim().toLowerCase() === stg.trim().toLowerCase());
              const count = groupObj ? (groupObj.count ?? groupObj.leads?.length ?? 0) : 0;
              const isActive = selectedStage.trim().toLowerCase() === stg.trim().toLowerCase();

              return (
                <TouchableOpacity
                  key={stg}
                  onPress={() => setSelectedStage(stg)}
                  style={[
                    styles.stagePill,
                    {
                      backgroundColor: isActive ? adminTheme.activePillBg : cardBg,
                      borderColor: isActive ? adminTheme.activePillBg : borderCol,
                    },
                  ]}
                >
                  <Text style={[styles.stagePillText, { color: isActive ? adminTheme.activePillText : textColor }]}>
                    {stg}
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


        {/* Loading Indicator */}
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
          /* Active Stage Content Area */
          <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14 }}>
            {/* Active Stage Header Card */}
            <View style={[styles.stageHeaderBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Kanban size={18} color={brandCol} />
                <Text style={[styles.stageHeaderTitle, { color: textColor }]}>{selectedStage}</Text>
              </View>
              <Text style={[styles.stageHeaderSub, { color: subTextColor }]}>
                {activeLeads.length} {activeLeads.length === 1 ? 'Lead' : 'Leads'} in stage
              </Text>
            </View>

            {/* Leads List Cards */}
            {activeLeads.length > 0 ? (
              activeLeads.map((lead: LeadItem) => (
                <PipelineStageCard
                  key={lead.leadId}
                  lead={lead}
                  onMoveStage={(selectedLead) => handleOpenMoveModal(selectedLead)}
                />
              ))
            ) : (
              /* Empty Stage Placeholder */
              <View style={[styles.emptyContainer, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Kanban size={32} color={subTextColor} />
                <Text style={[styles.emptyTitle, { color: textColor }]}>No Leads in {selectedStage}</Text>
                <Text style={[styles.emptySub, { color: subTextColor }]}>
                  Leads placed in this stage will appear here automatically.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Move Stage Selector Modal */}
      <Modal visible={isMoveModalOpen} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsMoveModalOpen(false)}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={[styles.modalTitle, { color: textColor }]}>Move Lead Stage</Text>
                <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                  {selectedLeadForMove?.fullName || selectedLeadForMove?.name} (Lead #{selectedLeadForMove?.leadId})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsMoveModalOpen(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {stages.map((stg) => {
                const isCurrent = (selectedLeadForMove?.stage || selectedStage).trim().toLowerCase() === stg.trim().toLowerCase();
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
                      {stg} {isCurrent ? '(Current)' : ''}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#4b5563',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  stagePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stageCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stageCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stageHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  stageHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  stageHeaderSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  leadCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  leadName: {
    fontSize: 15,
    fontWeight: '700',
  },
  leadSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  moveStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b82f615',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  moveStageBtnText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  stageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  stageOptionText: {
    fontSize: 13,
  },
});
