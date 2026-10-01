import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Linking } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { OwnerSubscriptionItem } from '../models/ownerSubscription';
import { useTheme } from '../../../contexts/ThemeContext';

interface OwnerSubscriptionCardProps {
  subscription: OwnerSubscriptionItem;
  onToggleStatus: (item: OwnerSubscriptionItem) => void;
  onDelete: (item: OwnerSubscriptionItem) => void;
  isToggling?: boolean;
}

export const OwnerSubscriptionCard: React.FC<OwnerSubscriptionCardProps> = ({
  subscription,
  onToggleStatus,
  onDelete,
  isToggling = false,
}) => {
  const { isDark } = useTheme();

  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#e2e8f0';

  const isExpired =
    subscription.status?.toLowerCase() === 'expired' ||
    (subscription.expiryDate && new Date(subscription.expiryDate) < new Date());

  const isActiveStatus = subscription.isActive && !isExpired;

  const badgeBg = isActiveStatus
    ? isDark
      ? 'rgba(16, 185, 129, 0.15)'
      : '#ecfdf5'
    : isDark
    ? 'rgba(239, 68, 68, 0.15)'
    : '#fef2f2';

  const badgeText = isActiveStatus ? '#10b981' : '#ef4444';
  const badgeBorder = isActiveStatus
    ? isDark
      ? 'rgba(16, 185, 129, 0.3)'
      : '#a7f3d0'
    : isDark
    ? 'rgba(239, 68, 68, 0.3)'
    : '#fecaca';

  const formatDate = (dStr?: string) => {
    if (!dStr) return 'N/A';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const formatPrice = (price: number) => {
    return '₹' + (price || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCall = () => {
    if (subscription.ownerPhone) {
      Linking.openURL(`tel:${subscription.ownerPhone}`).catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: borderCol,
          shadowColor: '#000000',
          shadowOpacity: isDark ? 0.25 : 0.04,
        },
      ]}
    >
      {/* Header Row: Phone & Status & Price */}
      <View style={styles.headerRow}>
        <View style={styles.phoneGroup}>
          <View style={[styles.avatarBox, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}>
            <Ionicons name="phone-portrait-outline" size={18} color="#3b82f6" />
          </View>
          <View>
            <TouchableOpacity
              onPress={handleCall}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              activeOpacity={0.7}
            >
              <Text style={[styles.phoneText, { color: textColor }]}>
                {subscription.ownerPhone}
              </Text>
              <Ionicons name="call-outline" size={13} color="#3b82f6" />
            </TouchableOpacity>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: badgeBg, borderColor: badgeBorder },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActiveStatus ? '#10b981' : '#ef4444' },
                ]}
              />
              <Text style={[styles.statusText, { color: badgeText }]}>
                {isActiveStatus ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* Price Box */}
        <View style={styles.priceContainer}>
          <Text style={[styles.priceText, { color: '#10b981' }]}>
            {formatPrice(subscription.amountPaid)}
          </Text>
          <Text style={[styles.priceSub, { color: subTextColor }]}>Amount Paid</Text>
        </View>
      </View>

      {/* Dates Grid */}
      <View
        style={[
          styles.datesRow,
          { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: borderCol },
        ]}
      >
        <View style={styles.dateCol}>
          <Text style={[styles.dateLabel, { color: subTextColor }]}>Start Date</Text>
          <Text style={[styles.dateVal, { color: textColor }]}>
            {formatDate(subscription.startDate)}
          </Text>
        </View>
        <View style={[styles.dateDivider, { backgroundColor: borderCol }]} />
        <View style={styles.dateCol}>
          <Text style={[styles.dateLabel, { color: subTextColor }]}>Expiry Date</Text>
          <Text
            style={[
              styles.dateVal,
              { color: isExpired ? '#ef4444' : textColor, fontWeight: '700' },
            ]}
          >
            {formatDate(subscription.expiryDate)}
          </Text>
        </View>
      </View>

      {/* Payment ID & Notes */}
      <View style={styles.metaSection}>
        <View style={styles.metaRow}>
          <Ionicons name="receipt-outline" size={13} color={subTextColor} />
          <Text style={[styles.metaLabel, { color: subTextColor }]}>Ref / Payment ID:</Text>
          <Text
            style={[styles.metaValue, { color: textColor }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {subscription.razorpayPaymentId || 'Direct / Free'}
          </Text>
        </View>

        {subscription.notes ? (
          <View style={styles.metaRow}>
            <Ionicons name="document-text-outline" size={13} color={subTextColor} />
            <Text style={[styles.metaLabel, { color: subTextColor }]}>Notes:</Text>
            <Text style={[styles.metaValue, { color: textColor }]} numberOfLines={2}>
              {subscription.notes}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Footer / Actions */}
      <View style={[styles.footer, { borderTopColor: borderCol }]}>
        <View style={styles.switchBox}>
          <Text style={[styles.switchLabel, { color: subTextColor }]}>Status:</Text>
          <Switch
            value={subscription.isActive}
            onValueChange={() => onToggleStatus(subscription)}
            disabled={isToggling}
            trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#93c5fd' }}
            thumbColor={subscription.isActive ? '#2563eb' : isDark ? '#64748b' : '#f1f5f9'}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>

        <TouchableOpacity
          onPress={() => onDelete(subscription)}
          style={styles.deleteBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={14} color="#ef4444" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  phoneGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 0.5,
    gap: 5,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 17,
    fontWeight: '800',
  },
  priceSub: {
    fontSize: 10,
    marginTop: 1,
  },
  datesRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  dateCol: {
    flex: 1,
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
    height: 24,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  metaSection: {
    gap: 6,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
});
