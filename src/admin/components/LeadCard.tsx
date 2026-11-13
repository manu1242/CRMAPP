import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Phone,
  Mail,
  MessageSquare,
  CalendarCheck,
  UserCheck,
  ChevronRight,
  Pen,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { LeadItem } from '../models/LeadTypes';
import LeadStatusBadge from './LeadStatusBadge';
import LeadAssignmentModal from './LeadAssignmentModal';
import LeadStageModal from './LeadStageModal';

interface LeadCardProps {
  lead: LeadItem;
  canAssign?: boolean;
  canEditStage?: boolean;
  onAssignmentChange?: (leadId: number, agentId: number | null, agentName: string) => void;
  onStageChange?: (leadId: number, newStage: string) => void;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return 'N/A';
  }
}

function formatFollowUp(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch {
    return null;
  }
}

export default function LeadCard({
  lead,
  canAssign = true,
  canEditStage = true,
  onAssignmentChange,
  onStageChange,
}: LeadCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState(lead.stage || 'New');
  const [assignedAgentName, setAssignedAgentName] = useState(
    lead.assignedToAgentName || (lead.assignedToAgentId ? `Agent #${lead.assignedToAgentId}` : 'Unassigned')
  );

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

  const initial = (lead.fullName || 'L').charAt(0).toUpperCase();
  const formattedDate = formatDate(lead.createdDate);
  const formattedFollowUp = formatFollowUp(lead.followUpDate);

  const requirementText =
    [lead.type, lead.bhk, lead.propertyType].filter(Boolean).join(' · ') ||
    lead.requirement ||
    'N/A';

  const cleanPhone = (lead.phone || '').replace(/[^0-9+]/g, '');

  const handleCall = (e: any) => {
    e?.stopPropagation();
    if (cleanPhone) Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleWhatsApp = (e: any) => {
    e?.stopPropagation();
    if (cleanPhone) {
      const num = cleanPhone.startsWith('+') ? cleanPhone.replace('+', '') : `91${cleanPhone}`;
      Linking.openURL(`whatsapp://send?phone=${num}&text=Hello%20${encodeURIComponent(lead.fullName || 'there')}`);
    }
  };

  const handleEmail = (e: any) => {
    e?.stopPropagation();
    if (lead.email) Linking.openURL(`mailto:${lead.email}`);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/admin/leads/${lead.leadId}`)}
        style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={[styles.avatar, { backgroundColor: `${brandCol}20` }]}>
              <Text style={[styles.avatarText, { color: brandCol }]}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.leadName, { color: textColor }]} numberOfLines={1}>
                {lead.fullName || 'Unnamed Lead'}
              </Text>
              <Text style={[styles.subtitle, { color: subTextColor }]}>
                Lead #{lead.leadId} · {lead.source || 'Direct'}
              </Text>
            </View>
          </View>

          <LeadStatusBadge value={currentStage || 'New'} type="stage" size="sm" />



          <LeadStatusBadge value={lead.status || 'Active'} type="status" size="sm" />
        </View>

 

        {/* Follow-up Banner */}
        {formattedFollowUp ? (
          <View style={[styles.followUpBanner, { backgroundColor: isDark ? 'rgba(234,179,8,0.12)' : 'rgba(234,179,8,0.08)' }]}>
            <CalendarCheck size={14} color="#eab308" />
            <Text style={styles.followUpText} numberOfLines={1}>
              Follow-up: {formattedFollowUp}
            </Text>
          </View>
        ) : null}

        {/* Action Buttons Footer */}
        <View style={[styles.footerRow, { borderTopColor: borderCol }]}>
          <View style={styles.contactActions}>
            {cleanPhone ? (
              <TouchableOpacity onPress={handleCall} style={[styles.actionIconBtn, { backgroundColor: inputBg }]}>
                <Phone size={14} color={brandCol} />
              </TouchableOpacity>
            ) : null}

            {cleanPhone ? (
              <TouchableOpacity onPress={handleWhatsApp} style={[styles.actionIconBtn, { backgroundColor: inputBg }]}>
                <MessageSquare size={14} color="#25D366" />
              </TouchableOpacity>
            ) : null}

            {lead.email ? (
              <TouchableOpacity onPress={handleEmail} style={[styles.actionIconBtn, { backgroundColor: inputBg }]}>
                <Mail size={14} color="#3b82f6" />
              </TouchableOpacity>
            ) : null}
          </View>

          {canAssign ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setAssignModalOpen(true);
              }}
              style={[styles.assignBtn, { borderColor: borderCol, backgroundColor: inputBg }]}
            >
              <UserCheck size={13} color={brandCol} />
              <Text style={[styles.assignBtnText, { color: textColor }]}>Assign</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12, color: subTextColor, fontWeight: '500' }}>View Details</Text>
              <ChevronRight size={14} color={subTextColor} />
            </View>
          )}
        </View>
      </TouchableOpacity>

      <LeadStageModal
        visible={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        leadId={lead.leadId}
        leadName={lead.fullName}
        currentStage={currentStage}
        onSuccess={(newStage) => {
          setCurrentStage(newStage);
          if (onStageChange) {
            onStageChange(lead.leadId, newStage);
          }
        }}
      />

      <LeadAssignmentModal
        visible={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        leadId={lead.leadId}
        leadName={lead.fullName}
        currentAgentId={lead.assignedToAgentId}
        currentAgentName={assignedAgentName}
        onSuccess={(newAgentId, newAgentName) => {
          setAssignedAgentName(newAgentName);
          if (onAssignmentChange) {
            onAssignmentChange(lead.leadId, newAgentId, newAgentName);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  leadName: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  stageWrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageEditorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageEditIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  grid: {
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
  },
  colLeft: {
    flex: 1.2,
    paddingRight: 8,
  },
  colRight: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  val: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  followUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  followUpText: {
    color: '#eab308',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  assignBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

