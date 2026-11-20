import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldAlert, Zap, ArrowLeft, ArrowUpRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';

interface PartnerPlanUpgradeCardProps {
  title?: string;
  message?: string;
  showBack?: boolean;
}

export default function PartnerPlanUpgradeCard({
  title = 'Channel Partners Not Included In Your Plan',
  message = 'Channel Partner tracking, dashboard, and payouts are available on Enterprise and Unlimited plans. Upgrade your subscription to start collaborating with channel partners.',
  showBack = true,
}: PartnerPlanUpgradeCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  return (
    <View style={[styles.container, { backgroundColor: adminTheme.primaryBg }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
        ]}
      >
        <View style={styles.iconCircle}>
          <ShieldAlert size={36} color="#f59e0b" />
        </View>

        <Text style={[styles.title, { color: adminTheme.textPrimary }]}>{title}</Text>

        <Text style={[styles.description, { color: adminTheme.textSecondary }]}>
          {message}
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => router.push('/admin/subscriptions/crmplans/MyCrmPlan' as any)}
            style={[styles.upgradeButton, { backgroundColor: '#10b981' }]}
          >
            <Zap size={16} color="#ffffff" />
            <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
            <ArrowUpRight size={14} color="#ffffff" />
          </TouchableOpacity>

          {showBack && (
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/admin/dashboard' as any);
                }
              }}
              style={[
                styles.backButton,
                { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border },
              ]}
            >
              <ArrowLeft size={16} color={adminTheme.textPrimary} />
              <Text style={[styles.backBtnText, { color: adminTheme.textPrimary }]}>
                Back to Dashboard
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f59e0b15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsRow: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
  },
  upgradeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
