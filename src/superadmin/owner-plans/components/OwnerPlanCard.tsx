import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { OwnerPlan } from '../models/ownerPlan';
import { useTheme } from '../../../contexts/ThemeContext';

interface OwnerPlanCardProps {
  plan: OwnerPlan;
  onEdit: (plan: OwnerPlan) => void;
  onDelete: (plan: OwnerPlan) => void;
  onToggleStatus: (plan: OwnerPlan) => void;
  isToggling?: boolean;
}

export const OwnerPlanCard: React.FC<OwnerPlanCardProps> = ({
  plan,
  onEdit,
  onDelete,
  onToggleStatus,
  isToggling = false,
}) => {
  const { isDark } = useTheme();

  // Theme colors
  const cardBg = isDark ? '#242424' : '#ffffff';
  const textColor = isDark ? '#FFFFFF' : '#0a0a0a';
  const subTextColor = isDark ? '#a1a1aa' : '#52525b';
  const borderCol = isDark ? '#2e2e2e' : '#e4e4e7';
  const badgeBg = plan.isActive
    ? isDark
      ? 'rgba(16, 185, 129, 0.15)'
      : '#ecfdf5'
    : isDark
    ? 'rgba(239, 68, 68, 0.15)'
    : '#fef2f2';
  const badgeText = plan.isActive ? '#10b981' : '#ef4444';
  const badgeBorder = plan.isActive
    ? isDark
      ? 'rgba(16, 185, 129, 0.3)'
      : '#a7f3d0'
    : isDark
    ? 'rgba(239, 68, 68, 0.3)'
    : '#fecaca';

  const isUnlimited = plan.maxLeadsUnlock === -1 || plan.maxLeadsUnlock < 0;

  const formatPrice = (price: number) => {
    return '₹' + price.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? '#835CEE25' : '#835CEE15' }]}>
            <FontAwesome5 name="crown" size={16} color="#835CEE" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.planTitle, { color: textColor }]} numberOfLines={1}>
              {plan.planName}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: badgeBg, borderColor: badgeBorder },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: plan.isActive ? '#10b981' : '#ef4444' },
                  ]}
                />
                <Text style={[styles.statusText, { color: badgeText }]}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Price Tag */}
        <View style={styles.priceTagContainer}>
          <Text style={[styles.priceValue, { color: '#10b981' }]}>
            {formatPrice(plan.price)}
          </Text>
        </View>
      </View>

      {/* Description */}
      {plan.description ? (
        <Text style={[styles.descriptionText, { color: subTextColor }]} numberOfLines={2}>
          {plan.description}
        </Text>
      ) : null}

      {/* Metrics Row (Validity & Leads Unlock) */}
      <View style={[styles.metricsContainer, { backgroundColor: isDark ? '#161616' : '#f4f4f5', borderColor: borderCol }]}>
        {/* Validity */}
        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Ionicons name="calendar-outline" size={13} color={subTextColor} />
            <Text style={[styles.metricLabel, { color: subTextColor }]}>Validity</Text>
          </View>
          <Text style={[styles.metricValue, { color: textColor }]}>
            {plan.validityDays} Days
          </Text>
        </View>

        <View style={[styles.metricDivider, { backgroundColor: borderCol }]} />

        {/* Leads Unlock */}
        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Ionicons name="lock-open-outline" size={13} color={subTextColor} />
            <Text style={[styles.metricLabel, { color: subTextColor }]}>Leads Unlock</Text>
          </View>
          {isUnlimited ? (
            <View style={styles.unlimitedBadge}>
              <Ionicons name="infinite" size={14} color="#8b5cf6" style={{ marginRight: 3 }} />
              <Text style={styles.unlimitedText}>Unlimited</Text>
            </View>
          ) : (
            <Text style={[styles.metricValue, { color: textColor }]}>
              {plan.maxLeadsUnlock} Leads
            </Text>
          )}
        </View>
      </View>

      {/* Action Footer Bar */}
      <View style={[styles.footerRow, { borderTopColor: borderCol }]}>
        {/* Active Switch */}
        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: subTextColor }]}>
            Status:
          </Text>
          <Switch
            value={plan.isActive}
            onValueChange={() => onToggleStatus(plan)}
            disabled={isToggling}
            trackColor={{ false: isDark ? '#2e2e2e' : '#e4e4e7', true: '#c4b5fd' }}
            thumbColor={plan.isActive ? '#835CEE' : isDark ? '#71717a' : '#f4f4f5'}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>

        {/* Action Buttons (Edit & Delete) */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            onPress={() => onEdit(plan)}
            style={[styles.actionBtn, styles.editBtn, { borderColor: borderCol, backgroundColor: isDark ? '#242424' : '#ffffff' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={14} color="#835CEE" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(plan)}
            style={[styles.actionBtn, styles.deleteBtn]}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
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
    gap: 12,
  },
  titleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 0.5,
    gap: 5,
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
  priceTagContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 10,
  },
  metricsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  unlimitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 6,
  },
  unlimitedText: {
    color: '#8b5cf6',
    fontSize: 13,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtn: {
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#835CEE',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
  },
});
