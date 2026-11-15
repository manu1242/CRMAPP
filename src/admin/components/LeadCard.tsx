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
  MapPin,
  Building2,
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

  const isAssigned = !!(lead.assignedToAgentId || (lead.assignedToAgentName && lead.assignedToAgentName !== 'Unassigned'));

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const leadName = lead.fullName || lead.name || 'Unnamed Lead';
  const initial = (leadName.trim() || 'L').charAt(0).toUpperCase();
  const avatarStyle = getAvatarPalette(lead.leadId || leadName);

  const formattedDate = formatDate(lead.createdDate || lead.createdOn);
  const formattedFollowUp = formatFollowUp(lead.followUpDate);

  const specsList = [lead.bhk, lead.propertyType, lead.type].filter(Boolean);
  const requirementText = specsList.length > 0 ? specsList.join(' · ') : (lead.requirement || null);

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
                  #{lead.leadId} • {lead.source || 'Website'}
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

            <LeadStatusBadge value={lead.status || 'Active'} type="status" size="sm" />
          </View>
        </View>

        {/* Contact Strip with Quick Communication Actions (No border boxes) */}
        <View style={styles.contactRow}>
          <View style={styles.contactInfoCol}>
            {lead.phone ? (
              <Text style={[styles.contactPhone, { color: textColor }]} numberOfLines={1}>
                {lead.phone}
              </Text>
            ) : null}
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
                <MessageSquare size={14} color="#16a34a" />
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

        {/* Property Specs & Location (Simple inline tags, no box-in-box) */}
        {(requirementText || lead.preferredLocation) ? (
          <View style={styles.tagsRow}>
            {requirementText ? (
              <View style={[styles.tagItem]}>
                <Building2 size={12} color="#64748b" />
                <Text style={[styles.tagText, { color: textColor }]} numberOfLines={1}>
                  {requirementText}
                </Text>
              </View>
            ) : null}

            {lead.preferredLocation ? (
              <View style={[styles.tagItem]}>
                <MapPin size={12} color="#8b5cf6" />
                <Text style={[styles.tagText, { color: subTextColor }]} numberOfLines={1}>
                  {lead.preferredLocation}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Follow-up Banner (Seamless soft amber background, no borders) */}
        {formattedFollowUp ? (
          <View style={[styles.followUpWrap]}>
            <CalendarCheck size={13} color="#d97706" />
            <Text style={[styles.followUpText, { color: subTextColor }]} numberOfLines={1}>
              Follow-up: <Text style={{ fontWeight: '700', color: subTextColor }}>{formattedFollowUp}</Text>
            </Text>
          </View>
        ) : null}

        {/* Footer: Assigned Agent & Created Date */}
        <View style={styles.footerRow}>
          <View style={styles.agentCol}>
            {isAssigned ? (
              <TouchableOpacity
                disabled={!canAssign}
                onPress={(e) => {
                  e.stopPropagation();
                  setAssignModalOpen(true);
                }}
                style={styles.agentButton}
              >
                <UserCheck size={13} color="#059669" />
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
                <UserPlus size={13} color="#d97706" />
                <Text style={styles.unassignedText}>+ Assign Agent</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dateCol}>
            <Text style={[styles.dateText, { color: subTextColor }]}>{formattedDate}</Text>
            <ChevronRight size={14} color={subTextColor} />
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
