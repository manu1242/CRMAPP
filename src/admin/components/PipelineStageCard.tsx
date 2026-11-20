import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Phone, ChevronRight, MessageCircle, ArrowRightLeft } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { LeadItem } from '../models/LeadTypes';
import { formatCardDate } from '../models/SalesPipelineTypes';

interface PipelineStageCardProps {
  lead: LeadItem;
  agentLookup?: Record<number, string>;
  onMoveStage?: (lead: LeadItem) => void;
}

function PipelineStageCardComponent({ lead, agentLookup, onMoveStage }: PipelineStageCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

  const cleanPhone = (lead.phone || '').replace(/[^0-9+]/g, '');

  const handleCall = (e: any) => {
    e?.stopPropagation();
    if (cleanPhone) Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleWhatsApp = (e: any) => {
    e?.stopPropagation();
    if (cleanPhone) {
      const num = cleanPhone.startsWith('+') ? cleanPhone.replace('+', '') : `91${cleanPhone}`;
      Linking.openURL(`whatsapp://send?phone=${num}&text=Hello%20${encodeURIComponent(lead.fullName || lead.name || 'there')}`);
    }
  };

  // Resolve actual Agent Name (matches Web logic, never displays Agent ID)
  const resolveAgentName = (): string => {
    const directName =
      (lead as any).agentName ||
      lead.assignedToAgentName ||
      (lead as any).executiveName ||
      (lead as any).assignedTo;

    if (
      directName &&
      typeof directName === 'string' &&
      directName.trim() !== '' &&
      !directName.toLowerCase().startsWith('agent #')
    ) {
      return directName.trim();
    }

    const agentId = lead.assignedToAgentId || lead.executiveId;
    if (agentId && agentLookup && agentLookup[agentId]) {
      return agentLookup[agentId];
    }

    return 'Unassigned';
  };

  const agentName = resolveAgentName();
  const formattedDate = formatCardDate(lead.createdDate || lead.createdOn);
  const statusStr = (lead.status || 'Active').trim();
  const sourceStr = (lead.source || 'Direct').trim();

  // Status badge styling matching Web CSS classes (.status-active, .status-hot, etc.)
  const getStatusStyle = () => {
    const s = statusStr.toLowerCase();
    if (s.includes('active') || s.includes('converted') || s.includes('booked')) {
      return {
        bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7',
        text: isDark ? '#34d399' : '#14532d',
        border: isDark ? 'rgba(16, 185, 129, 0.4)' : '#bbf7d0',
      };
    }
    if (s.includes('hot') || s.includes('lost') || s.includes('not interested')) {
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
        text: isDark ? '#f87171' : '#991b1b',
        border: isDark ? 'rgba(239, 68, 68, 0.4)' : '#fecaca',
      };
    }
    if (s.includes('warm') || s.includes('follow')) {
      return {
        bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
        text: isDark ? '#fbbf24' : '#78350f',
        border: isDark ? 'rgba(245, 158, 11, 0.4)' : '#fde68a',
      };
    }
    if (s.includes('cold') || s.includes('new')) {
      return {
        bg: isDark ? 'rgba(56, 189, 248, 0.2)' : '#e0f2fe',
        text: isDark ? '#38bdf8' : '#075985',
        border: isDark ? 'rgba(56, 189, 248, 0.4)' : '#bae6fd',
      };
    }
    return {
      bg: isDark ? '#334155' : '#f1f5f9',
      text: isDark ? '#cbd5e1' : '#334155',
      border: isDark ? '#475569' : '#e2e8f0',
    };
  };

  const statusStyle = getStatusStyle();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/admin/leads/${lead.leadId}`)}
      style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}
    >
      {/* ── Top Row: Name, Lead ID & Quick Phone / WhatsApp Actions ── */}
      <View style={styles.topRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
            {lead.fullName || lead.name || 'Unnamed Lead'}
          </Text>
            
        </View>

        {cleanPhone ? (
          <View style={styles.quickContactRow}>
            <TouchableOpacity
              onPress={handleCall}
              style={[styles.iconBtn, { backgroundColor: inputBg, borderColor: borderCol }]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Phone size={12} color={brandCol} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={[styles.iconBtn, { backgroundColor: '#10b98115', borderColor: '#10b98140' }]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MessageCircle size={12} color="#10b981" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* ── Phone Row (Matching Web: icon + contact text) ── */}
      <View style={styles.phoneRow}>
        <Phone size={11} color={subTextColor} />
        <Text style={[styles.phoneText, { color: subTextColor }]} numberOfLines={1}>
          {lead.phone || 'No contact'}
        </Text>
      </View>

      {/* ── Badges Row (Matching Web: Status badge + Source badge) ── */}
      <View style={styles.badgesRow}>
        <View
          style={[
            styles.badgePill,
            { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
          ]}
        >
          <Text style={[styles.badgeText, { color: statusStyle.text }]}>
            {statusStr}
          </Text>
        </View>

        <View
          style={[
            styles.badgePill,
            {
              backgroundColor: isDark ? 'rgba(212, 164, 90, 0.22)' : '#fef3c7',
              borderColor: isDark ? 'rgba(212, 164, 90, 0.45)' : 'rgba(245, 158, 11, 0.25)',
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isDark ? '#fcd34d' : '#78350f' },
            ]}
            numberOfLines={1}
          >
            {sourceStr}
          </Text>
        </View>
      </View>

      {/* ── Meta Row (Matching Web: Agent: {agentName} • {formattedDate}) ── */}
      <View style={styles.metaRow}>
        <User size={12} color={brandCol} />
        <Text style={[styles.metaText, { color: subTextColor }]} numberOfLines={1}>
          Agent: <Text style={{ fontWeight: '600', color: textColor }}>{agentName}</Text>
        </Text>
        <Text style={[styles.dot, { color: borderCol }]}>•</Text>
        <Text style={[styles.metaText, { color: subTextColor }]}>
          {formattedDate}
        </Text>
      </View>

      {/* ── Move to... Footer (Matching Web: Move to... selector / button) ── */}
      <View style={[styles.footer, { borderTopColor: borderCol }]}>
        {onMoveStage ? (
          <TouchableOpacity
            style={[styles.moveBtn, { backgroundColor: inputBg, borderColor: borderCol }]}
            onPress={(e) => {
              e.stopPropagation();
              onMoveStage(lead);
            }}
            activeOpacity={0.7}
          >
            <ArrowRightLeft size={11} color={brandCol} />
            <Text style={[styles.moveBtnText, { color: brandCol }]}>Move to...</Text>
          </TouchableOpacity>
        ) : <View />}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[styles.viewDetailsText, { color: subTextColor }]}>Details</Text>
          <ChevronRight size={14} color={subTextColor} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  leadIdText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  quickContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 11.5,
  },
  dot: {
    fontSize: 12,
    marginHorizontal: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  moveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  moveBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default React.memo(PipelineStageCardComponent);
