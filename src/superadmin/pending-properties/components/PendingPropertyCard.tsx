import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import {
  Building2,
  User,
  Phone,
  MapPin,
  Check,
  X,
  Clock,
  ChevronRight,
  Maximize2,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import { PendingPropertyItem } from '../models/pendingProperty';

interface PendingPropertyCardProps {
  item: PendingPropertyItem;
  onPress: (item: PendingPropertyItem) => void;
  onApprove: (item: PendingPropertyItem) => void;
  onReject: (item: PendingPropertyItem) => void;
  isActionLoading?: boolean;
}

export const PendingPropertyCard: React.FC<PendingPropertyCardProps> = ({
  item,
  onPress,
  onApprove,
  onReject,
  isActionLoading = false,
}) => {
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);

  const formatPrice = (val?: number) => {
    if (!val && val !== 0) return '₹ --';
    try {
      return `₹${Number(val).toLocaleString('en-IN')}`;
    } catch {
      return `₹${val}`;
    }
  };

  const isPending = item.propertyStatus === 'PENDING_APPROVAL';
  const isActive = item.propertyStatus === 'ACTIVE';
  const isRejected = item.propertyStatus === 'REJECTED';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(item)}
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Top Header: Property Name, ID, Price */}
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text
            numberOfLines={1}
            style={[styles.propertyName, { color: theme.textPrimary }]}
          >
            {item.propertyName || `Property #${item.propertyId}`}
          </Text>
          <Text style={[styles.propertyId, { color: theme.textMuted }]}>
            Property ID: #{item.propertyId}
          </Text>
        </View>

        <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
      </View>

      {/* Owner Info Row */}
      <View style={styles.ownerRow}>
        <View style={styles.ownerInfo}>
          <User size={13} color={theme.textMuted} />
          <Text
            numberOfLines={1}
            style={[styles.ownerName, { color: theme.textPrimary }]}
          >
            {item.owner?.fullName || 'Property Owner'}
          </Text>
          {Boolean(item.owner?.phone) && (
            <Text style={[styles.ownerPhone, { color: theme.textSecondary }]}>
              · {item.owner?.phone}
            </Text>
          )}
        </View>
      </View>

      {/* Badges: Category, Type, Status */}
      <View style={styles.tagsRow}>
        <View
          style={[
            styles.tagBadge,
            {
              backgroundColor: isDark
                ? 'rgba(131, 92, 238, 0.15)'
                : 'rgba(131, 92, 238, 0.1)',
            },
          ]}
        >
          <Text
            style={[
              styles.tagBadgeText,
              { color: isDark ? '#a78bfa' : '#835CEE' },
            ]}
          >
            {item.listingCategory || 'Listing'}
          </Text>
        </View>

        <View
          style={[
            styles.tagBadge,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <Text style={[styles.tagBadgeText, { color: theme.textSecondary }]}>
            {item.propertyType || 'Residential'}
          </Text>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isPending
                ? isDark
                  ? 'rgba(245, 158, 11, 0.18)'
                  : 'rgba(245, 158, 11, 0.12)'
                : isActive
                ? isDark
                  ? 'rgba(16, 185, 129, 0.18)'
                  : 'rgba(16, 185, 129, 0.12)'
                : isDark
                ? 'rgba(239, 68, 68, 0.18)'
                : 'rgba(239, 68, 68, 0.12)',
            },
          ]}
        >
          {isPending ? (
            <Clock size={10} color="#f59e0b" />
          ) : isActive ? (
            <Check size={10} color="#10b981" />
          ) : (
            <X size={10} color="#ef4444" />
          )}
          <Text
            style={[
              styles.statusText,
              {
                color: isPending ? '#f59e0b' : isActive ? '#10b981' : '#ef4444',
              },
            ]}
          >
            {isPending ? 'Pending Approval' : isActive ? 'Approved' : 'Rejected'}
          </Text>
        </View>
      </View>

      {/* Property Facts (Area / BHK / Location) */}
      <View style={[styles.factsGrid, { borderTopColor: theme.border }]}>
        <View style={styles.factCol}>
          <Text style={[styles.factLabel, { color: theme.textMuted }]}>AREA / BHK</Text>
          <Text numberOfLines={1} style={[styles.factValue, { color: theme.textPrimary }]}>
            {item.bhk ? `${item.bhk} · ` : ''}{item.areaSqft ? `${item.areaSqft} Sq.Ft` : '--'}
          </Text>
        </View>

        <View style={styles.factCol}>
          <Text style={[styles.factLabel, { color: theme.textMuted }]}>LOCATION</Text>
          <View style={styles.locationWrap}>
            <MapPin size={10} color={theme.textMuted} />
            <Text numberOfLines={1} style={[styles.factValue, { color: theme.textPrimary }]}>
              {item.location ? `${item.location}, ` : ''}{item.city || '--'}
            </Text>
          </View>
        </View>
      </View>

      {/* Reject Reason Alert if Rejected */}
      {isRejected && Boolean(item.rejectReason) && (
        <View
          style={[
            styles.rejectReasonBox,
            {
              backgroundColor: isDark
                ? 'rgba(239, 68, 68, 0.12)'
                : 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.25)',
            },
          ]}
        >
          <AlertCircle size={12} color="#ef4444" />
          <Text numberOfLines={2} style={styles.rejectReasonText}>
            Reason: {item.rejectReason}
          </Text>
        </View>
      )}

      {/* Quick Action Buttons for Pending items */}
      {isPending && (
        <View style={[styles.actionsRow, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            disabled={isActionLoading}
            onPress={() => onApprove(item)}
            style={[styles.actionBtn, styles.approveBtn]}
          >
            <Check size={14} color="#ffffff" />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isActionLoading}
            onPress={() => onReject(item)}
            style={[styles.actionBtn, styles.rejectBtn, { borderColor: '#ef4444' }]}
          >
            <X size={14} color="#ef4444" />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  propertyName: {
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  propertyId: {
    fontSize: 10.5,
    marginTop: 2,
  },
  priceText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#10b981',
  },
  ownerRow: {
    marginTop: 8,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownerName: {
    fontSize: 12,
    fontWeight: '600',
  },
  ownerPhone: {
    fontSize: 11.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  factsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  factCol: {
    flex: 1,
    minWidth: 0,
  },
  factLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  factValue: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rejectReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  rejectReasonText: {
    fontSize: 11,
    color: '#ef4444',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveBtn: {
    backgroundColor: '#10b981',
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  rejectBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
});

