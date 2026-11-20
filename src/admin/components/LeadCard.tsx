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
  MessageCircle,
  CalendarCheck,
  UserCheck,
  ChevronRight,
  MapPin,
  UserPlus,
  Star,
  ChevronDown,
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

const AVATAR_PALETTES = [
  { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366f1' }, // Indigo
  { bg: 'rgba(14, 165, 233, 0.12)', text: '#0284c7' }, // Sky
  { bg: 'rgba(16, 185, 129, 0.12)', text: '#059669' }, // Emerald
  { bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706' }, // Amber
  { bg: 'rgba(168, 85, 247, 0.12)', text: '#9333ea' }, // Purple
  { bg: 'rgba(244, 63, 94, 0.12)', text: '#e11d48' },  // Rose
  { bg: 'rgba(20, 184, 166, 0.12)', text: '#0d9488' }, // Teal
];

function getAvatarPalette(id: number | string) {
  const num = typeof id === 'number' ? id : (id ? String(id).charCodeAt(0) : 0);
  return AVATAR_PALETTES[Math.abs(num) % AVATAR_PALETTES.length];
}

// Same format as web Leads list (formatDateNice): "DD Mon YYYY", '-' when empty
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return '-';
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
    lead.assignedToAgentName ||
    (lead as any).assignedAgentName ||
    (lead as any).executiveName ||
    (lead.assignedToAgentId ? 'Assigned' : 'Unassigned')
  );

  React.useEffect(() => {
    const nextName =
      lead.assignedToAgentName ||
      (lead as any).assignedAgentName ||
      (lead as any).executiveName;
    if (nextName) {
      setAssignedAgentName(nextName);
    }
  }, [lead.assignedToAgentName, (lead as any).assignedAgentName, (lead as any).executiveName]);

  const isAssigned = !!(lead.assignedToAgentId || (assignedAgentName && assignedAgentName !== 'Unassigned'));

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const leadName = lead.fullName || lead.name || 'Unnamed Lead';
  const initial = (leadName.trim() || 'L').charAt(0).toUpperCase();
  const avatarStyle = getAvatarPalette(lead.leadId || leadName);

  // Same values/fallbacks as web Leads list columns
  const formattedDate = formatDate(lead.createdDate || lead.createdOn);
  const formattedFollowUp = formatDate(lead.followUpDate);
  const sourceText = lead.source || 'Website';
  const locationText = lead.preferredLocation || lead.groupName || 'Direct / General';

  const cleanPhone = (lead.phone || '').replace(/[^0-9+]/g, '');

  const handleCall = (e: any) => {
    e?.stopPropagation();
    if (cleanPhone) Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleWhatsApp = (e: any) => {
    e?.stopPropagation();
    if (cleanPhone) {
      const num = cleanPhone.startsWith('+') ? cleanPhone.replace('+', '') : `91${cleanPhone}`;
      Linking.openURL(`whatsapp://send?phone=${num}&text=Hello%20${encodeURIComponent(leadName)}`);
    }
  };

  const handleEmail = (e: any) => {
    e?.stopPropagation();
    if (lead.email) Linking.openURL(`mailto:${lead.email}`);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/admin/leads/${lead.leadId}`)}
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: borderCol,
          },
        ]}
      >
        {/* Top Header: Avatar + Info + Badges */}
        <View style={styles.headerRow}>
          <View style={styles.profileSection}>
            <View style={[styles.avatar, { backgroundColor: avatarStyle.bg }]}>
              <Text style={[styles.avatarText, { color: avatarStyle.text }]}>{initial}</Text>
            </View>
            <View style={styles.nameMeta}>
              <Text style={[styles.leadName, { color: textColor }]} numberOfLines={1}>
                {leadName}
              </Text>
              <View style={styles.metaSubRow}>
                <Text style={[styles.metaSubText, { color: subTextColor }]}>
                  {lead.phone || '-'}
                </Text>
                {lead.rating ? (
                  <View style={styles.ratingChip}>
                    <Star size={11} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.ratingText}>{lead.rating}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Badges on Right */}
          <View style={styles.badgeColumn}>
            {canEditStage ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation();
                  setStageModalOpen(true);
                }}
                style={styles.stageButton}
              >
                <LeadStatusBadge value={currentStage || 'New'} type="stage" size="sm" />
                <ChevronDown size={12} color={subTextColor} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            ) : (
              <LeadStatusBadge value={currentStage || 'New'} type="stage" size="sm" />
            )}

          </View>
        </View>

        {/* Contact Strip with Quick Communication Actions (No border boxes) */}
        <View style={styles.contactRow}>
          <View style={styles.contactInfoCol}>
            {lead.email ? (
              <Text style={[styles.contactEmail, { color: subTextColor }]} numberOfLines={1}>
                {lead.email}
              </Text>
            ) : null}
          </View>

          <View style={styles.actionButtons}>
            {cleanPhone ? (
              <TouchableOpacity
                onPress={handleCall}
                style={[styles.iconButton]}
                accessibilityLabel="Call Lead"
              >
                <Phone size={14} color="#0284c7" />
              </TouchableOpacity>
            ) : null}

            {cleanPhone ? (
              <TouchableOpacity
                onPress={handleWhatsApp}
                style={[styles.iconButton]}
                accessibilityLabel="WhatsApp Lead"
              >
                <MessageCircle size={14} color="#16a34a" />
              </TouchableOpacity>
            ) : null}

            {lead.email ? (
              <TouchableOpacity
                onPress={handleEmail}
                style={[styles.iconButton]}
                accessibilityLabel="Email Lead"
              >
                <Mail size={14} color="#6366f1" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Labeled fields — same titles/values as web Leads list */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>SOURCE</Text>
            <Text style={[styles.infoValue, { color: textColor }]} numberOfLines={1}>{sourceText}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>LOCATION</Text>
            <View style={styles.infoValueRow}>
              <MapPin size={11} color="#8b5cf6" />
              <Text style={[styles.infoValue, { color: textColor }]} numberOfLines={1}>{locationText}</Text>
            </View>
          </View>
          <View style={styles.infoCell}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>ASSIGNED TO</Text>
            {isAssigned ? (
              <TouchableOpacity
                disabled={!canAssign}
                onPress={(e) => {
                  e.stopPropagation();
                  setAssignModalOpen(true);
                }}
                style={styles.agentButton}
              >
                <UserCheck size={12} color="#059669" />
                <Text style={styles.agentText} numberOfLines={1}>
                  {assignedAgentName}
                </Text>
                {canAssign ? <ChevronDown size={11} color="#059669" /> : null}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                disabled={!canAssign}
                onPress={(e) => {
                  e.stopPropagation();
                  setAssignModalOpen(true);
                }}
                style={styles.unassignedButton}
              >
                <UserPlus size={12} color="#d97706" />
                <Text style={styles.unassignedText}>Unassigned</Text>
                {canAssign ? <ChevronDown size={11} color="#d97706" /> : null}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.infoCell}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>CREATED</Text>
            <Text style={[styles.infoValue, { color: textColor }]} numberOfLines={1}>{formattedDate}</Text>
          </View>
          <View style={[styles.infoCell, styles.infoCellFull]}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>NEXT FOLLOW-UP</Text>
            <View style={styles.infoValueRow}>
              {lead.followUpDate ? <CalendarCheck size={11} color="#d97706" /> : null}
              <Text style={[styles.infoValue, { color: textColor }]} numberOfLines={1}>{formattedFollowUp}</Text>
              <View style={{ flex: 1 }} />
              <ChevronRight size={14} color={subTextColor} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Stage Editor Modal */}
      <LeadStageModal
        visible={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        leadId={lead.leadId}
        leadName={leadName}
        currentStage={currentStage}
        onSuccess={(newStage) => {
          setCurrentStage(newStage);
          if (onStageChange) {
            onStageChange(lead.leadId, newStage);
          }
        }}
      />

      {/* Assignment Modal */}
      <LeadAssignmentModal
        visible={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        leadId={lead.leadId}
        leadName={leadName}
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 5,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  nameMeta: {
    flex: 1,
  },
  leadName: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  metaSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  metaSubText: {
    fontSize: 11.5,
    fontWeight: '300',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 3,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '300',
    color: '#d97706',
  },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  contactInfoCol: {
    flex: 1,
  },
  contactPhone: {
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.2,
  },
  contactEmail: {
    fontSize: 11.5,
    marginTop: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  followUpWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 9,
  },
  followUpText: {
    fontSize: 11.5,
    fontWeight: '500',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 11,
  },
  agentCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
    maxWidth: '90%',
  },
  agentText: {
    fontSize: 11.5,
    fontWeight: '300',
    color: '#059669',
  },
  unassignedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  unassignedText: {
    fontSize: 11.5,
    fontWeight: '300',
    color: '#d97706',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    rowGap: 8,
  },
  infoCell: {
    width: '50%',
    paddingRight: 8,
  },
  infoCellFull: {
    width: '100%',
  },
  infoLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '400',
    flexShrink: 1,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
