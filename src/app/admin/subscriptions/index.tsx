import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Layers,
  Bookmark,
  CreditCard,
  RotateCcw,
  Award,
  FileText,
  ChevronRight,
  ChevronLeft,
  Zap,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';
import { usePermissions } from '../../../authorization/hooks/usePermission';
import {
  useSubscriptionPlans,
  usePartnerSubscriptions,
  useRazorpayTransactions,
  usePendingRefunds,
  useMyCrmPlan,
} from '../../../admin/hooks/useSubscriptionHooks';

export default function SubscriptionsHubScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const { isAdmin, isPartner } = usePermissions();

  // Queries for live metrics
  const { data: plansData, refetch: refetchPlans } = useSubscriptionPlans();
  const { data: partnerSubsData, refetch: refetchPartnerSubs } = usePartnerSubscriptions({ page: 1, pageSize: 5 });
  const { data: razorpayData, refetch: refetchRazorpay } = useRazorpayTransactions({ page: 1, pageSize: 5 });
  const { data: refundsData, refetch: refetchRefunds } = usePendingRefunds({ page: 1, pageSize: 5 });
  const { data: myPlanData, refetch: refetchMyPlan } = useMyCrmPlan();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchPlans(),
      refetchPartnerSubs(),
      refetchRazorpay(),
      refetchRefunds(),
      refetchMyPlan(),
    ]);
    setRefreshing(false);
  }, [refetchPlans, refetchPartnerSubs, refetchRazorpay, refetchRefunds, refetchMyPlan]);

  const activePlansCount = plansData?.data?.stats?.activePlans ?? plansData?.data?.plans?.filter((p) => p.isActive)?.length ?? 0;
  const partnerSubsCount = partnerSubsData?.data?.stats?.active ?? partnerSubsData?.data?.totalCount ?? 0;
  const pendingRefundsCount = refundsData?.data?.stats?.pendingCount ?? refundsData?.data?.totalCount ?? 0;
  const revenueTotal = razorpayData?.data?.stats?.totalSuccessfulAmount ?? 0;

  // Subscription cards matching the 6 web modules
  const adminModules = [
    {
      id: 'plans',
      title: 'Subscription Plans',
      subtitle: 'Create, edit, pricing, limits, and quotas',
      route: '/admin/subscriptions/plans',
      icon: Layers,
      color: '#10b981',
      badge: `${activePlansCount} Active`,
    },
    {
      id: 'partner-subscriptions',
      title: 'Partner Subscriptions',
      subtitle: 'Manage partner billing, assign plans & quotas',
      route: '/admin/subscriptions/partnersubscriptions',
      icon: Bookmark,
      color: '#a855f7',
      badge: `${partnerSubsCount} Active`,
    },
    {
      id: 'razorpay-transactions',
      title: 'Payment Transactions',
      subtitle: 'Razorpay gateway orders, payment IDs & status',
      route: '/admin/subscriptions/razorpay',
      icon: CreditCard,
      color: '#0284c7',
      badge: `₹${revenueTotal.toLocaleString('en-IN')}`,
    },
    {
      id: 'pending-refunds',
      title: 'Pending Refunds',
      subtitle: 'Process cancellation refund requests',
      route: '/admin/subscriptions/pendingrefunds',
      icon: RotateCcw,
      color: '#f59e0b',
      badge: pendingRefundsCount > 0 ? `${pendingRefundsCount} Pending` : undefined,
    },
    {
      id: 'my-crm-plan',
      title: 'My CRM Plan',
      subtitle: 'Company plan status, usage limits & upgrade',
      route: '/admin/subscriptions/crmplans',
      icon: Award,
      color: '#3b82f6',
      badge: myPlanData?.data?.currentSubscription?.status || 'Active',
    },
    {
      id: 'crm-transactions',
      title: 'CRM Transactions',
      subtitle: 'Company billing invoices, tax & receipts',
      route: '/admin/subscriptions/crmtransactions',
      icon: FileText,
      color: '#6366f1',
    },
  ];

  const partnerModules = [
    {
      id: 'my-plan',
      title: 'My Subscription Plan',
      subtitle: 'Active plan, trial duration, quotas & upgrade',
      route: '/admin/subscriptions/crmplans',
      icon: Award,
      color: '#3b82f6',
      badge: myPlanData?.data?.currentSubscription?.status || 'Active',
    },
    {
      id: 'my-transactions',
      title: 'My Transactions',
      subtitle: 'Payment history, references & receipts',
      route: '/admin/subscriptions/razorpay',
      icon: CreditCard,
      color: '#0284c7',
    },
    {
      id: 'my-refunds',
      title: 'My Refunds',
      subtitle: 'Track status of refund requests',
      route: '/admin/subscriptions/pendingrefunds',
      icon: RotateCcw,
      color: '#f59e0b',
    },
  ];

  const displayModules = isPartner ? partnerModules : adminModules;

  return (
    <View style={{ flex: 1, backgroundColor: theme.primaryBg }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: theme.secondaryBg,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: theme.inputBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary }}>
            Subscriptions & Billing
          </Text>
          <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
            {isPartner ? 'Partner Plan & Payment Management' : 'SaaS Plans, Transactions & Invoices'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomSpacing + 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* KPI Summary Cards (Admin Only) */}
        {!isPartner && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: theme.secondaryBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 12,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>
                Active Plans
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#10b981' }}>
                {activePlansCount}
              </Text>
              <Text style={{ fontSize: 10, color: theme.textMuted }}>Total SaaS & Partner</Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: theme.secondaryBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 12,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>
                Subscribers
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#a855f7' }}>
                {partnerSubsCount}
              </Text>
              <Text style={{ fontSize: 10, color: theme.textMuted }}>Active Partners</Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: theme.secondaryBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 12,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>
                Refunds
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: pendingRefundsCount > 0 ? '#ef4444' : '#10b981' }}>
                {pendingRefundsCount}
              </Text>
              <Text style={{ fontSize: 10, color: theme.textMuted }}>Pending Action</Text>
            </View>
          </View>
        )}

        {/* Section Title */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: theme.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: 12,
          }}
        >
          {isPartner ? 'Partner Modules' : 'All Subscription Modules'}
        </Text>

        {/* Modules List */}
        <View style={{ gap: 12 }}>
          {displayModules.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: theme.secondaryBg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: `${item.color}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={item.color} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
                      {item.title}
                    </Text>
                    {item.badge ? (
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                          backgroundColor: `${item.color}15`,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: item.color }}>
                          {item.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                    {item.subtitle}
                  </Text>
                </View>

                <ChevronRight size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
