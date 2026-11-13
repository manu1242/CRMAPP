import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import {
  Phone,
  MessageCircle,
  Trash2,
  ChevronRight,
  Mail,
  Calendar,
  LifeBuoy,
  PhoneCall,
  Building2,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PublicLeadItem } from '../models/publicLead';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';

interface PublicLeadCardProps {
  lead: PublicLeadItem;
  isSelected?: boolean;
  onToggleSelect?: (leadId: number) => void;
  isSelectionMode?: boolean;
  onDelete?: (lead: PublicLeadItem) => void;
}

export function getTypeBadgeConfig(type: string, isDark: boolean) {
  const norm = (type || 'enquiry').toLowerCase();

  if (norm.includes('sitevisit') || norm.includes('visit')) {
    return {
      bg: isDark ? 'rgba(139, 92, 246, 0.16)' : '#f5f3ff',
      text: '#8b5cf6',
      border: isDark ? 'rgba(139, 92, 246, 0.35)' : '#ddd6fe',
      icon: Calendar,
      label: 'Site Visit',
    };
  }
  if (norm.includes('callback') || norm.includes('call')) {
    return {
      bg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#fffbeb',
      text: '#f59e0b',
      border: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a',
      icon: PhoneCall,
      label: 'Callback',
    };
  }
  if (norm.includes('support')) {
    return {
      bg: isDark ? 'rgba(239, 68, 68, 0.16)' : '#fef2f2',
      text: '#ef4444',
      border: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fecaca',
      icon: LifeBuoy,
      label: 'Support',
    };
  }

  // Default Enquiry
  return {
    bg: isDark ? 'rgba(131, 92, 238, 0.16)' : '#f0ebff',
    text: '#835CEE',
    border: isDark ? 'rgba(131, 92, 238, 0.35)' : '#d4c5fc',
    icon: Mail,
    label: 'Enquiry',
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
  const theme = getSuperAdminTheme(isDark);

  const typeConfig = getTypeBadgeConfig(lead.type, isDark);
  const TypeIcon = typeConfig.icon;

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

  const getInitials = (name: string) => {
    if (!name) return 'L';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleCall = (e: any) => {
    e?.stopPropagation?.();
    if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`).catch(() => {});
    }
  };

  const handleWhatsApp = (e: any) => {
    e?.stopPropagation?.();
    if (lead.phone) {
      const clean = lead.phone.replace(/\D/g, '');
      const full = clean.length === 10 ? `91${clean}` : clean;
      Linking.openURL(`https://wa.me/${full}`).catch(() => {});
    }
  };

  const handleDelete = (e: any) => {
    e?.stopPropagation?.();
    if (onDelete) {
      onDelete(lead);
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
      activeOpacity={0.88}
      onPress={handlePressCard}
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderColor: isSelected ? theme.brand : theme.border,
          borderWidth: isSelected ? 2 : 1,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.3 : 0.04,
        },
      ]}
    >
      {/* Top Meta Bar */}
      <View style={styles.topRow}>
        <View style={styles.topRowLeft}>
          {isSelectionMode && (
            <TouchableOpacity
              onPress={() => onToggleSelect && onToggleSelect(lead.leadId)}
              style={styles.checkboxTouch}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isSelected ? theme.brand : theme.border,
                    backgroundColor: isSelected ? theme.brand : 'transparent',
                  },
                ]}
              >
                {isSelected && <CheckCircle2 size={13} color="#ffffff" />}
              </View>
            </TouchableOpacity>
          )}

          {/* Action Type Badge */}
          <View
            style={[
              styles.badge,
              { backgroundColor: typeConfig.bg, borderColor: typeConfig.border },
            ]}
          >
            <TypeIcon size={11} color={typeConfig.text} />
            <Text style={[styles.badgeText, { color: typeConfig.text }]}>
              {typeConfig.label}
            </Text>
          </View>

          {/* Tenant Name Tag */}
          {lead.tenantName ? (
            <View
              style={[
                styles.tenantTag,
                {
                  backgroundColor: isDark ? 'rgba(51, 65, 85, 0.4)' : '#f1f5f9',
                  borderColor: theme.border,
                },
              ]}
            >
              <Building2 size={10} color={theme.textSecondary} />
              <Text
                style={[styles.tenantTagText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {lead.tenantName}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Created Date */}
        {lead.createdOn ? (
          <View style={styles.dateWrap}>
            <Clock size={11} color={theme.textMuted} />
            <Text style={[styles.dateText, { color: theme.textMuted }]}>
              {formatDate(lead.createdOn)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Main Body */}
      <View style={styles.bodyRow}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: typeConfig.bg }]}>
          <Text style={[styles.avatarText, { color: typeConfig.text }]}>
            {getInitials(lead.name)}
          </Text>
        </View>

        {/* Lead Info */}
        <View style={styles.leadInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.leadName, { color: theme.textPrimary }]} numberOfLines={1}>
              {lead.name}
            </Text>
            <Text style={[styles.leadIdTag, { color: theme.textMuted }]}>
              #{lead.leadId}
            </Text>
          </View>

          {lead.phone ? (
            <Text style={[styles.leadPhone, { color: theme.textSecondary }]}>
              {lead.phone}
            </Text>
          ) : null}

          {/* Interested Property */}
          {lead.propertyName && lead.propertyName !== 'Direct / General' ? (
            <View style={styles.propertyRow}>
              <Text
                style={[styles.propertyText, { color: theme.accent }]}
                numberOfLines={1}
              >
                Interested in: {lead.propertyName}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Inquiry Message Box Preview */}
      {lead.message ? (
        <View
          style={[
            styles.messageBox,
            {
              backgroundColor: isDark ? 'rgba(22, 22, 22, 0.6)' : '#f4f4f5',
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[styles.messageText, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            "{lead.message.trim()}"
          </Text>
        </View>
      ) : null}

      {/* Action Footer Row */}
      <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
        <View style={styles.footerLeftActions}>
          {lead.phone ? (
            <>
              {/* Call Button */}
              <TouchableOpacity
                onPress={handleCall}
                style={[styles.actionBtn, { backgroundColor: isDark ? '#835CEE25' : '#835CEE15' }]}
                activeOpacity={0.7}
              >
                <Phone size={13} color="#835CEE" />
                <Text style={[styles.actionBtnText, { color: '#835CEE' }]}>Call</Text>
              </TouchableOpacity>

              {/* WhatsApp Button */}
              <TouchableOpacity
                onPress={handleWhatsApp}
                style={[styles.actionBtn, { backgroundColor: isDark ? '#064e3b30' : '#ecfdf5' }]}
                activeOpacity={0.7}
              >
                <MessageCircle size={13} color="#10b981" />
                <Text style={[styles.actionBtnText, { color: '#10b981' }]}>WhatsApp</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {/* Delete Button */}
          {onDelete ? (
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.deleteBtn, { backgroundColor: isDark ? '#7f1d1d25' : '#fef2f2' }]}
              activeOpacity={0.7}
            >
              <Trash2 size={13} color="#ef4444" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* View Details Link */}
        <View style={styles.viewDetailsRow}>
          <Text style={[styles.viewDetailsText, { color: theme.brand }]}>Details</Text>
          <ChevronRight size={14} color={theme.brand} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  checkboxTouch: {
    paddingRight: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  tenantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 120,
  },
  tenantTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  leadInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leadName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  leadIdTag: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  leadPhone: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  propertyRow: {
    marginTop: 2,
  },
  propertyText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  messageBox: {
    borderRadius: 8,
    padding: 9,
    marginTop: 10,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 16.5,
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
