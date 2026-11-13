import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Clock, CheckCircle2, XCircle, CalendarCheck } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import { PendingPropertiesStats } from '../models/pendingProperty';

interface PendingPropertyStatsCardsProps {
  stats?: PendingPropertiesStats;
}

export const PendingPropertyStatsCards: React.FC<PendingPropertyStatsCardsProps> = ({ stats }) => {
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);

  const totalPending = stats?.totalPending ?? 0;
  const totalActive = stats?.totalActive ?? 0;
  const totalRejected = stats?.totalRejected ?? 0;
  const todaySubmitted = stats?.todaySubmitted ?? 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* 1. Pending Approval */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)' },
          ]}
        >
          <Clock size={17} color="#f59e0b" />
        </View>
        <View style={styles.info}>
          <Text style={[styles.label, { color: theme.textMuted }]}>PENDING</Text>
          <Text style={[styles.value, { color: '#f59e0b' }]}>{totalPending}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>Need review</Text>
        </View>
      </View>

      {/* 2. Approved Active */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' },
          ]}
        >
          <CheckCircle2 size={17} color="#10b981" />
        </View>
        <View style={styles.info}>
          <Text style={[styles.label, { color: theme.textMuted }]}>APPROVED</Text>
          <Text style={[styles.value, { color: '#10b981' }]}>{totalActive}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>Live on portal</Text>
        </View>
      </View>

      {/* 3. Rejected */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' },
          ]}
        >
          <XCircle size={17} color="#ef4444" />
        </View>
        <View style={styles.info}>
          <Text style={[styles.label, { color: theme.textMuted }]}>REJECTED</Text>
          <Text style={[styles.value, { color: '#ef4444' }]}>{totalRejected}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>Declined</Text>
        </View>
      </View>

      {/* 4. Today's Submissions */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isDark ? 'rgba(131, 92, 238, 0.15)' : 'rgba(131, 92, 238, 0.1)' },
          ]}
        >
          <CalendarCheck size={17} color={isDark ? '#a78bfa' : '#835CEE'} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.label, { color: theme.textMuted }]}>NEW TODAY</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{todaySubmitted}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>Since midnight</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 10,
    marginBottom: 12,
  },
  card: {
    minWidth: 154,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 1,
  },
  sub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
});
