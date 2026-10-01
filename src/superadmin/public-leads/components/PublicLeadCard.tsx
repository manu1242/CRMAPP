import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PublicLeadItem } from '../models/publicLead';
import { useTheme } from '../../../contexts/ThemeContext';

interface PublicLeadCardProps {
  lead: PublicLeadItem;
  isSelected?: boolean;
  onToggleSelect?: (leadId: number) => void;
  isSelectionMode?: boolean;
  onDelete?: (lead: PublicLeadItem) => void;
}

export function getTypeColor(type: string, isDark: boolean) {
  const norm = (type || 'enquiry').toLowerCase();
  if (norm.includes('sitevisit') || norm.includes('visit')) {
    return {
      bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
      text: '#8b5cf6',
      border: isDark ? 'rgba(139, 92, 246, 0.3)' : '#ddd6fe',
      icon: 'calendar' as const,
    };
  }
  if (norm.includes('callback') || norm.includes('call')) {
    return {
      bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
      text: '#f59e0b',
      border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a',
      icon: 'call' as const,
    };
  }
  if (norm.includes('support')) {
    return {
      bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
      text: '#ef4444',
      border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
      icon: 'help-buoy' as const,
    };
  }
  // Default Enquiry
  return {
    bg: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
    text: '#2563eb',
    border: isDark ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe',
    icon: 'mail' as const,
  };
}

export const PublicLeadCard: React.FC<PublicLeadCardProps> = ({
  lead,
  isSelected = false,
  onToggleSelect,
  isSelectionMode = false,
  onDelete,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();

  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#e2e8f0';

  const typeConfig = getTypeColor(lead.type, isDark);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleCall = () => {
    if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`).catch(() => {});
    }
  };

  const handlePressCard = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect(lead.leadId);
    } else {
      router.push({
        pathname: '/superadmin/public-leads/[id]',
        params: { id: lead.leadId.toString() },
      });
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePressCard}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: isSelected ? '#2563eb' : borderCol,
          borderWidth: isSelected ? 2 : 1,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.25 : 0.04,
        },
      ]}
    >
      {/* Top Header: Select Checkbox / Type Badge & Created Date */}
      <View style={styles.topRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {isSelectionMode && (
            <TouchableOpacity
              onPress={() => onToggleSelect && onToggleSelect(lead.leadId)}
              style={styles.checkBtn}
            >
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={20}
                color={isSelected ? '#2563eb' : subTextColor}
              />
            </TouchableOpacity>
          )}

          {/* Type Badge */}
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: typeConfig.bg, borderColor: typeConfig.border },
            ]}
          >
            <Ionicons name={typeConfig.icon} size={11} color={typeConfig.text} />
            <Text style={[styles.typeBadgeText, { color: typeConfig.text }]}>
              {lead.type || 'Enquiry'}
            </Text>
          </View>

          {/* Tenant Name Chip */}
          {lead.tenantName ? (
            <View
              style={[
                styles.tenantChip,
                { backgroundColor: isDark ? '#334155' : '#f1f5f9', borderColor: borderCol },
              ]}
            >
              <Ionicons name="business-outline" size={10} color={subTextColor} />
              <Text style={[styles.tenantChipText, { color: subTextColor }]} numberOfLines={1}>
                {lead.tenantName}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.dateText, { color: subTextColor }]}>
          {formatDate(lead.createdOn)}
        </Text>
      </View>

      {/* Main Info: Name & Phone */}
      <View style={styles.nameRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nameText, { color: textColor }]} numberOfLines={1}>
            {lead.name}
          </Text>
          <TouchableOpacity
            onPress={handleCall}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
            activeOpacity={0.7}
          >
            <Ionicons name="call-outline" size={12} color="#2563eb" />
            <Text style={styles.phoneText}>{lead.phone}</Text>
          </TouchableOpacity>
        </View>

        <Ionicons name="chevron-forward" size={18} color={subTextColor} />
      </View>

      {/* Message Snippet */}
      {lead.message ? (
        <View
          style={[
            styles.messageBox,
            { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: borderCol },
          ]}
        >
          <Text style={[styles.messageText, { color: isDark ? '#cbd5e1' : '#475569' }]} numberOfLines={2}>
            {lead.message}
          </Text>
        </View>
      ) : null}

      {/* Footer Specs Row */}
      <View style={styles.specsRow}>
        {lead.propertyName ? (
          <View style={styles.specItem}>
            <Ionicons name="home-outline" size={12} color={subTextColor} />
            <Text style={[styles.specText, { color: subTextColor }]} numberOfLines={1}>
              {lead.propertyName}
            </Text>
          </View>
        ) : null}

        {lead.siteVisitDate ? (
          <View style={[styles.specItem, styles.siteVisitPill]}>
            <Ionicons name="calendar-outline" size={11} color="#8b5cf6" />
            <Text style={styles.siteVisitText}>
              Visit: {formatDate(lead.siteVisitDate)}
            </Text>
          </View>
        ) : null}

        {lead.callbackRequested ? (
          <View style={[styles.specItem, styles.callbackPill]}>
            <Ionicons name="time-outline" size={11} color="#f59e0b" />
            <Text style={styles.callbackText}>Callback Requested</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkBtn: {
    marginRight: 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tenantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    gap: 4,
    maxWidth: 120,
  },
  tenantChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '800',
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  messageBox: {
    borderRadius: 8,
    borderWidth: 0.5,
    padding: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 16,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 11,
    fontWeight: '500',
  },
  siteVisitPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  siteVisitText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  callbackPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  callbackText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
  },
});
