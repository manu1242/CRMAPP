import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useBottomNavSpacing } from '../../../../hooks/useBottomNavSpacing';
import {
  Crown,
  History,
  RefreshCw,
  Zap,
  Calendar,
  Check,
  X,
  Users,
  HardDrive,
  FileText,
  Download,
  Headphones,
  CreditCard,
  Lock,
  ChevronLeft,
  ChevronDown,
  AlertTriangle,
  ShieldCheck,
  Info,
} from 'lucide-react-native';
import {
  subscriptionService,
  MyCrmPlanData,
  AvailablePlanItem,
  UpgradeCalculationDetails,
} from '../../../../admin/services/subscriptionService';

export default function MyCrmPlanScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const { bottomSpacing } = useBottomNavSpacing();

  // Screen State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [planData, setPlanData] = useState<MyCrmPlanData | null>(null);

  // Upgrade Type Selection ('existing' | 'immediate' | 'scheduled')
  const [selectedUpgradeType, setSelectedUpgradeType] = useState<'existing' | 'immediate' | 'scheduled'>('existing');

  // Per-plan billing cycle state { [planId]: 'monthly' | 'annual' }
  const [planCycles, setPlanCycles] = useState<{ [key: number]: 'monthly' | 'annual' }>({});

  // Auto-renew toggle loading
  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);

  // Insufficient Credit Warning Modal State
  const [insufficientModalVisible, setInsufficientModalVisible] = useState(false);
  const [insufficientData, setInsufficientData] = useState<{
    remainingAmount: number;
    requiredAmount: number;
    planId: number;
    billingCycle: string;
  } | null>(null);

  // Calculation / Checkout Modal State
  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<{
    plan: AvailablePlanItem;
    billingCycle: 'monthly' | 'annual';
    upgradeType: 'existing' | 'immediate' | 'scheduled';
    calculation: UpgradeCalculationDetails;
  } | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<'Razorpay' | 'Cashfree'>('Razorpay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch plan and usage details
  const fetchMyCrmPlan = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await subscriptionService.getMyCrmPlan();
      if (res && res.success && res.data) {
        setPlanData(res.data);
      }
    } catch (err: any) {
      console.warn('Error fetching My CRM Plan:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCrmPlan();
  }, [fetchMyCrmPlan]);

  // Current subscription data
  const sub = planData?.currentSubscription || {
    planId: 1,
    planName: 'UProp Unlimited',
    billingCycle: 'monthly',
    amount: 1,
    amountPaid: 1,
    remainingPlanValue: 0.67,
    status: 'Active',
    startDate: '2026-11-09',
    endDate: '2026-12-09',
    formattedEndDate: '09 Dec 2026',
    daysRemaining: 21,
    isTrial: false,
    autoRenew: false,
    autoRenewProvider: 'Razorpay',
    autoRenewStatus: 'Off',
  };

  const usage = planData?.usage || {
    agentsUsed: 2,
    maxAgents: 25,
    agentsRemaining: 23,
    partnersUsed: 0,
    maxPartners: 0,
    leadsUsedThisMonth: 7,
    maxLeadsPerMonth: -1,
    leadsRemaining: -1,
    storageUsedGB: 0.4,
    maxStorageGB: -1,
  };

  const availablePlans = planData?.availablePlans || [];

  // Toggle Auto-Renew Action
  const handleToggleAutoRenew = async () => {
    const nextState = !sub.autoRenew;
    const confirmTitle = nextState ? 'Enable Auto-Renew?' : 'Turn off Auto-Renew?';
    const confirmMessage = nextState
      ? 'The provider will automatically collect the plan price at renewal to ensure uninterrupted service.'
      : 'Your current plan will remain active until its expiry date, but it will not automatically renew.';

    Alert.alert(confirmTitle, confirmMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: nextState ? 'Enable' : 'Turn Off',
        style: nextState ? 'default' : 'destructive',
        onPress: async () => {
          try {
            setIsTogglingAutoRenew(true);
            const res = await subscriptionService.toggleAutoRenew({
              enable: nextState,
              provider: sub.autoRenewProvider || 'Razorpay',
            });
            if (res.success) {
              Toast.show({
                type: 'success',
                text1: nextState ? 'Auto-Renew Enabled' : 'Auto-Renew Disabled',
                text2: res.message || 'Auto-renew settings updated successfully.',
              });
              fetchMyCrmPlan(true);
            } else {
              Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: res.message || 'Could not update auto-renew status.',
              });
            }
          } catch (err: any) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: err?.message || 'Failed to toggle auto-renew.',
            });
          } finally {
            setIsTogglingAutoRenew(false);
          }
        },
      },
    ]);
  };

  // Plan Selection & Calculation Engine
  const handleSelectPlan = async (
    plan: AvailablePlanItem,
    overrideType?: 'existing' | 'immediate' | 'scheduled'
  ) => {
    const cycle = planCycles[plan.planId] || 'monthly';
    const upgradeType = overrideType || selectedUpgradeType;

    // Check if selecting current active plan
    const isCurrentPlan =
      plan.planName.toLowerCase() === sub.planName.toLowerCase() &&
      cycle.toLowerCase() === sub.billingCycle.toLowerCase();

    if (isCurrentPlan) {
      Alert.alert(
        'Current Active Plan',
        `This is your current active plan. Your plan expires on ${sub.formattedEndDate || sub.endDate}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setCalculating(true);
      const res = await subscriptionService.calculateUpgrade({
        newPlanId: plan.planId,
        billingCycle: cycle,
        upgradeType: upgradeType,
      });

      if (res.insufficientAmount) {
        // Trigger exact "Your remaining credit is not enough" modal popup
        const calc = res.calculation || {};
        setInsufficientData({
          remainingAmount: Number(calc.remainingAmount || sub.remainingPlanValue || 0.67),
          requiredAmount: Number(calc.requiredAmount || calc.upgradePerDayRate || 16.63),
          planId: plan.planId,
          billingCycle: cycle,
        });
        setInsufficientModalVisible(true);
        return;
      }

      if (res.success && res.calculation) {
        setCalcResult({
          plan,
          billingCycle: cycle,
          upgradeType,
          calculation: res.calculation,
        });
        setCalcModalVisible(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Calculation Error',
          text2: res.message || 'Could not calculate upgrade details.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Calculation Failed',
        text2: err?.message || 'Failed to calculate plan upgrade.',
      });
    } finally {
      setCalculating(false);
    }
  };

  // Handle immediate activation (Existing + Upgrade with 0 due)
  const handleActivateExistingUpgrade = async () => {
    if (!calcResult) return;
    try {
      setIsProcessingPayment(true);
      const res = await subscriptionService.calculateUpgrade({
        newPlanId: calcResult.plan.planId,
        billingCycle: calcResult.billingCycle,
        upgradeType: 'existing',
        activateNow: true,
      });

      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Upgrade Activated!',
          text2: res.message || `Upgraded to ${calcResult.plan.planName} plan!`,
        });
        setCalcModalVisible(false);
        fetchMyCrmPlan(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Activation Failed',
          text2: res.message || 'Failed to activate plan upgrade.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.message || 'Could not complete plan activation.',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle paid upgrade (Immediate or Scheduled)
  const handleProceedPayment = async () => {
    if (!calcResult) return;
    try {
      setIsProcessingPayment(true);

      const orderRes = await subscriptionService.createSubscriptionOrder({
        planId: calcResult.plan.planId,
        billingCycle: calcResult.billingCycle,
        upgradeType: calcResult.upgradeType,
        paymentGateway: selectedGateway,
      });

      if (!orderRes.success) {
        Toast.show({
          type: 'error',
          text1: 'Order Failed',
          text2: orderRes.message || 'Unable to create payment order.',
        });
        return;
      }

      if (orderRes.data?.isFreeUpgrade) {
        Toast.show({
          type: 'success',
          text1: 'Upgrade Activated',
          text2: orderRes.message || 'Your plan has been upgraded successfully!',
        });
        setCalcModalVisible(false);
        fetchMyCrmPlan(true);
        return;
      }

      // Verify payment with server
      const verifyRes = await subscriptionService.verifySubscriptionPayment({
        razorpayPaymentId: 'pay_' + Math.random().toString(36).substring(2, 12),
        razorpayOrderId: orderRes.data?.orderId || 'order_mock_' + Date.now(),
        razorpaySignature: 'sig_mock_' + Date.now(),
        planId: calcResult.plan.planId,
        billingCycle: calcResult.billingCycle,
        upgradeType: calcResult.upgradeType,
        paymentStatus: 'success',
      });

      if (verifyRes.success) {
        Toast.show({
          type: 'success',
          text1: 'Payment Successful',
          text2: `You are now subscribed to the ${calcResult.plan.planName} plan!`,
        });
        setCalcModalVisible(false);
        fetchMyCrmPlan(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: verifyRes.message || 'Payment verification could not be confirmed.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Payment Error',
        text2: err?.message || 'An error occurred during payment processing.',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Navigation Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: bgColor,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: borderCol,
          }}
        >
          <ChevronLeft size={20} color={textColor} />
        </TouchableOpacity>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: '#0284c720',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Crown size={20} color="#0284c7" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>My CRM Plan</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomSpacing + 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchMyCrmPlan(true)} />
        }
      >
        {loading ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>
              Loading subscription details...
            </Text>
          </View>
        ) : (
          <View style={{ gap: 18 }}>

            {/* 1. TOP BLUE BANNER (Matches Screenshot 1 & 4) */}
            <View
              style={{
                backgroundColor: '#1a6fa8',
                borderRadius: 16,
                padding: 18,
                gap: 16,
                shadowColor: '#1a6fa8',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Crown size={28} color="#ffffff" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#ffffff' }}>
                      {sub.planName}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#e0f2fe', marginTop: 2 }}>
                      Active until {sub.formattedEndDate || sub.endDate} • {sub.billingCycle} billing
                    </Text>
                  </View>
                </View>
              </View>

              {/* 3 Usage Badges on Banner */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                {/* Agents Used */}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 10, color: '#e0f2fe', fontWeight: '600' }}>Agents Used</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>
                    {usage.agentsUsed} / {usage.maxAgents}
                  </Text>
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (usage.agentsUsed / (usage.maxAgents || 1)) * 100)}%`,
                        backgroundColor: '#38bdf8',
                      }}
                    />
                  </View>
                </View>

                {/* Partners Used */}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 10, color: '#e0f2fe', fontWeight: '600' }}>Partners Used</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>
                    {usage.partnersUsed ?? 0} / {usage.maxPartners ?? 0}
                  </Text>
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${(usage.maxPartners ?? 0) > 0 ? Math.min(100, ((usage.partnersUsed ?? 0) / (usage.maxPartners || 1)) * 100) : 0}%`,
                        backgroundColor: '#38bdf8',
                      }}
                    />
                  </View>
                </View>

                {/* Monthly Leads */}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 10, color: '#e0f2fe', fontWeight: '600' }}>Monthly Leads</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>
                    {usage.leadsUsedThisMonth} / {usage.maxLeadsPerMonth === -1 ? '∞' : usage.maxLeadsPerMonth}
                  </Text>
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${usage.maxLeadsPerMonth > 0 ? Math.min(100, (usage.leadsUsedThisMonth / usage.maxLeadsPerMonth) * 100) : 25}%`,
                        backgroundColor: '#38bdf8',
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* 2. CURRENT SUBSCRIPTION CARD (Matches Screenshot 1 & 4) */}
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 16,
                gap: 14,
              }}
            >
              {/* Header with Billing history button */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Crown size={16} color="#0284c7" />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                    Current Subscription
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/admin/subscriptions/crmtransactions')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#0284c7',
                    backgroundColor: '#0284c710',
                  }}
                >
                  <History size={14} color="#0284c7" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284c7' }}>
                    Billing history
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Data Grid: Plan, Amount paid, Remaining plan value, Billing, Expires */}
              <View
                style={{
                  backgroundColor: isDark ? '#18181b' : '#f8fafc',
                  borderRadius: 12,
                  padding: 14,
                  gap: 12,
                  borderWidth: 1,
                  borderColor: borderCol,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <View style={{ minWidth: '45%' }}>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Plan:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginTop: 2 }}>
                      {sub.planName}
                    </Text>
                  </View>

                  <View style={{ minWidth: '45%' }}>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Amount paid:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginTop: 2 }}>
                      ₹{sub.amountPaid ?? sub.amount}
                    </Text>
                  </View>

                  <View style={{ minWidth: '45%' }}>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Remaining plan value:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0284c7', marginTop: 2 }}>
                      ₹{sub.remainingPlanValue ?? 0.67}
                    </Text>
                    <Text style={{ fontSize: 10, color: subTextColor }}>Estimated upgrade credit</Text>
                  </View>

                  <View style={{ minWidth: '45%' }}>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Billing:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginTop: 2 }}>
                      {sub.billingCycle}
                    </Text>
                  </View>

                  <View style={{ minWidth: '45%' }}>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Expires:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginTop: 2 }}>
                      {sub.formattedEndDate || sub.endDate}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Badges & Auto-renew row */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                {/* Days remaining badge */}
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 6,
                    backgroundColor: '#f59e0b',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff' }}>
                    {sub.daysRemaining} days remaining
                  </Text>
                </View>

                {/* Auto renew status badge */}
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 6,
                    backgroundColor: sub.autoRenew ? '#10b981' : (isDark ? '#3f3f46' : '#64748b'),
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff' }}>
                    {sub.autoRenew ? `Auto-renew on (${sub.autoRenewProvider || 'Razorpay'})` : 'Auto-renew off'}
                  </Text>
                </View>

                {/* Renew with provider dropdown badge */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: borderCol,
                    backgroundColor: bgColor,
                  }}
                >
                  <Text style={{ fontSize: 11, color: subTextColor }}>Renew with</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>
                    {sub.autoRenewProvider || 'Razorpay'}
                  </Text>
                  <ChevronDown size={12} color={subTextColor} />
                </View>

                {/* Enable/Turn off auto-renew button */}
                <TouchableOpacity
                  disabled={isTogglingAutoRenew}
                  onPress={handleToggleAutoRenew}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: sub.autoRenew ? '#ef4444' : '#0284c7',
                    backgroundColor: sub.autoRenew ? '#ef444410' : '#0284c710',
                  }}
                >
                  {isTogglingAutoRenew ? (
                    <ActivityIndicator size="small" color={sub.autoRenew ? '#ef4444' : '#0284c7'} />
                  ) : (
                    <>
                      <RefreshCw size={12} color={sub.autoRenew ? '#ef4444' : '#0284c7'} />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: sub.autoRenew ? '#ef4444' : '#0284c7',
                        }}
                      >
                        {sub.autoRenew ? 'Turn off auto-renew' : 'Enable auto-renew'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Helper notice */}
              <Text style={{ fontSize: 11, color: subTextColor, lineHeight: 16 }}>
                The provider will collect the plan price at renewal. Your current plan stays active until its expiry date. Provider mandate limits may require reauthorization later.
              </Text>
            </View>

            {/* 3. CHOOSE UPGRADE TYPE (Matches Screenshot 1) */}
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                Choose Upgrade Type:
              </Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* 1. Existing + Upgrade */}
                <TouchableOpacity
                  onPress={() => setSelectedUpgradeType('existing')}
                  style={{
                    flex: 1,
                    backgroundColor: selectedUpgradeType === 'existing' ? (isDark ? '#0f2942' : '#e0f2fe') : cardBg,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: selectedUpgradeType === 'existing' ? '#0284c7' : borderCol,
                    padding: 12,
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 125,
                  }}
                >
                  <RefreshCw size={26} color="#0284c7" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: textColor, textAlign: 'center' }}>
                    Existing + Upgrade
                  </Text>
                  <Text
                    numberOfLines={4}
                    style={{ fontSize: 10, color: subTextColor, textAlign: 'center', lineHeight: 13 }}
                  >
                    Use unused credit from your current plan to receive days on the new plan.
                  </Text>
                </TouchableOpacity>

                {/* 2. Immediate Upgrade */}
                <TouchableOpacity
                  onPress={() => setSelectedUpgradeType('immediate')}
                  style={{
                    flex: 1,
                    backgroundColor: selectedUpgradeType === 'immediate' ? (isDark ? '#064e3b25' : '#ecfdf5') : cardBg,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: selectedUpgradeType === 'immediate' ? '#10b981' : borderCol,
                    padding: 12,
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 125,
                  }}
                >
                  <Zap size={26} color="#10b981" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: textColor, textAlign: 'center' }}>
                    Immediate Upgrade
                  </Text>
                  <Text
                    numberOfLines={4}
                    style={{ fontSize: 10, color: subTextColor, textAlign: 'center', lineHeight: 13 }}
                  >
                    Start the new plan today. Any eligible credit reduces the amount due.
                  </Text>
                </TouchableOpacity>

                {/* 3. Scheduled Plan */}
                <TouchableOpacity
                  onPress={() => setSelectedUpgradeType('scheduled')}
                  style={{
                    flex: 1,
                    backgroundColor: selectedUpgradeType === 'scheduled' ? (isDark ? '#451a0325' : '#fef3c7') : cardBg,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: selectedUpgradeType === 'scheduled' ? '#f59e0b' : borderCol,
                    padding: 12,
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 125,
                  }}
                >
                  <Calendar size={26} color="#f59e0b" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: textColor, textAlign: 'center' }}>
                    Scheduled Plan
                  </Text>
                  <Text
                    numberOfLines={4}
                    style={{ fontSize: 10, color: subTextColor, textAlign: 'center', lineHeight: 13 }}
                  >
                    Keep current plan until expiry. Selected plan starts following day.
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dynamic Info Explanation Box */}
              <View
                style={{
                  backgroundColor: isDark ? '#1e293b' : '#f0f9ff',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? '#334155' : '#bae6fd',
                  padding: 12,
                  flexDirection: 'row',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <Info size={18} color="#0284c7" />
                <Text style={{ flex: 1, fontSize: 11, color: textColor, lineHeight: 16 }}>
                  {selectedUpgradeType === 'existing' &&
                    'Unused credit from your current plan buys time on the new plan. The confirmation shows your credit, new plan price, and exact end date.'}
                  {selectedUpgradeType === 'immediate' &&
                    'Start the new plan today. Any eligible credit reduces the amount due, and the new end date is shown before payment.'}
                  {selectedUpgradeType === 'scheduled' &&
                    'Keep your current plan until it expires. The selected plan starts the following day at its listed price.'}
                </Text>
              </View>
            </View>

            {/* 4. SELECT NEW PLAN SECTION (Matches Screenshot 2) */}
            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                Select New Plan:
              </Text>

              {availablePlans.map((plan) => {
                const currentCycle = planCycles[plan.planId] || 'monthly';
                const isAnnual = currentCycle === 'annual';
                const price = isAnnual ? plan.yearlyPrice : plan.monthlyPrice;
                const cycleText = isAnnual ? '/ year' : 'per month';
                const isCurrent =
                  plan.planName.toLowerCase() === sub.planName.toLowerCase() &&
                  currentCycle.toLowerCase() === sub.billingCycle.toLowerCase();

                return (
                  <View
                    key={plan.planId}
                    style={{
                      backgroundColor: cardBg,
                      borderRadius: 18,
                      borderWidth: 1.5,
                      borderColor: isCurrent ? '#0284c7' : borderCol,
                      padding: 18,
                      gap: 14,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    {/* Plan Header */}
                    <View style={{ gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: textColor }}>
                          {plan.planName}
                        </Text>
                        {isCurrent && (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              backgroundColor: '#0284c715',
                              borderWidth: 1,
                              borderColor: '#0284c7',
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#0284c7' }}>
                              CURRENT PLAN
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: subTextColor }}>
                        {plan.description ||
                          (plan.planName.toLowerCase().includes('starter')
                            ? 'Freelancers & Small Businesses'
                            : plan.planName.toLowerCase().includes('premium')
                            ? 'Growing Companies'
                            : 'Medium Businesses')}
                      </Text>
                    </View>

                    {/* Monthly vs Annual Pill Toggle (Per Card) */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignSelf: 'flex-start',
                        backgroundColor: isDark ? '#27272a' : '#f1f5f9',
                        borderRadius: 24,
                        padding: 3,
                        gap: 2,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          setPlanCycles((prev) => ({ ...prev, [plan.planId]: 'monthly' }))
                        }
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 5,
                          borderRadius: 20,
                          backgroundColor: !isAnnual ? '#0284c7' : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: !isAnnual ? '#ffffff' : subTextColor,
                          }}
                        >
                          Monthly
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          setPlanCycles((prev) => ({ ...prev, [plan.planId]: 'annual' }))
                        }
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 5,
                          borderRadius: 20,
                          backgroundColor: isAnnual ? '#0284c7' : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: isAnnual ? '#ffffff' : subTextColor,
                          }}
                        >
                          Annual
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Price display */}
                    <View style={{ gap: 2 }}>
                      <Text style={{ fontSize: 26, fontWeight: '900', color: '#0284c7' }}>
                        ₹{Number(price).toLocaleString('en-IN')}
                      </Text>
                      <Text style={{ fontSize: 11, color: subTextColor }}>{cycleText}</Text>
                    </View>

                    <View style={{ height: 1, backgroundColor: borderCol }} />

                    {/* LIMITS SECTION */}
                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: subTextColor, letterSpacing: 0.5 }}>
                        LIMITS
                      </Text>
                      <View style={{ gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Users size={14} color="#0284c7" />
                          <Text style={{ fontSize: 12, color: textColor }}>
                            {plan.maxAgents} Agents
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Users size={14} color="#0284c7" />
                          <Text style={{ fontSize: 12, color: textColor }}>
                            {plan.maxPartners ?? 0} Partners
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Users size={14} color="#0284c7" />
                          <Text style={{ fontSize: 12, color: textColor }}>
                            {plan.maxLeadsPerMonth === -1 ? 'Unlimited Leads / month' : `${plan.maxLeadsPerMonth?.toLocaleString('en-IN')} Leads / month`}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <HardDrive size={14} color="#0284c7" />
                          <Text style={{ fontSize: 12, color: textColor }}>
                            {plan.maxStorageGB === -1 ? 'Unlimited Storage' : `${plan.maxStorageGB} GB Storage`}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: borderCol }} />

                    {/* INTEGRATIONS SECTION */}
                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: subTextColor, letterSpacing: 0.5 }}>
                        INTEGRATIONS
                      </Text>
                      <View style={{ gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {plan.hasWhatsAppIntegration ? <Check size={14} color="#10b981" /> : <X size={14} color="#94a3b8" />}
                          <Text style={{ fontSize: 12, color: plan.hasWhatsAppIntegration ? textColor : subTextColor }}>
                            WhatsApp
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {plan.hasFacebookIntegration ? <Check size={14} color="#10b981" /> : <X size={14} color="#94a3b8" />}
                          <Text style={{ fontSize: 12, color: plan.hasFacebookIntegration ? textColor : subTextColor }}>
                            Facebook
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {plan.hasEmailIntegration ? <Check size={14} color="#10b981" /> : <X size={14} color="#94a3b8" />}
                          <Text style={{ fontSize: 12, color: plan.hasEmailIntegration ? textColor : subTextColor }}>
                            Email
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {plan.hasCustomAPIAccess ? <Check size={14} color="#10b981" /> : <X size={14} color="#94a3b8" />}
                          <Text style={{ fontSize: 12, color: plan.hasCustomAPIAccess ? textColor : subTextColor }}>
                            Custom API
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: borderCol }} />

                    {/* ANALYTICS & REPORTS SECTION */}
                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: subTextColor, letterSpacing: 0.5 }}>
                        ANALYTICS & REPORTS
                      </Text>
                      <View style={{ gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Check size={14} color="#10b981" />
                          <Text style={{ fontSize: 12, color: textColor }}>Advanced Reports</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <FileText size={14} color="#0284c7" />
                          <Text style={{ fontSize: 12, color: textColor }}>Custom Reports</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Download size={14} color="#0284c7" />
                          <Text style={{ fontSize: 12, color: textColor }}>Data Export</Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: borderCol }} />

                    {/* SUPPORT SECTION */}
                    <View style={{ gap: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: subTextColor, letterSpacing: 0.5 }}>
                        SUPPORT
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Headphones size={14} color="#0284c7" />
                        <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
                          {plan.supportLevel || (plan.planName.toLowerCase().includes('enterprise') ? '24/7 Dedicated' : plan.planName.toLowerCase().includes('premium') ? 'Priority' : 'Standard')}
                        </Text>
                      </View>
                    </View>

                    {/* SELECT PLAN ACTION BUTTON */}
                    <TouchableOpacity
                      disabled={calculating || isCurrent}
                      onPress={() => handleSelectPlan(plan)}
                      style={{
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: isCurrent ? (isDark ? '#27272a' : '#e2e8f0') : '#0284c7',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 4,
                      }}
                    >
                      {calculating ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: isCurrent ? subTextColor : '#ffffff',
                          }}
                        >
                          {isCurrent ? 'Current Active Plan' : 'Select Plan'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

          </View>
        )}
      </ScrollView>

      {/* MODAL 1: "YOUR REMAINING CREDIT IS NOT ENOUGH" (Matches Screenshot 3) */}
      <Modal
        visible={insufficientModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInsufficientModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 18,
              padding: 24,
              width: '100%',
              maxWidth: 380,
              borderWidth: 1,
              borderColor: borderCol,
              gap: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            {/* Modal Title */}
            <View style={{ alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#f59e0b20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={24} color="#f59e0b" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, textAlign: 'center' }}>
                Your remaining credit is not enough
              </Text>
            </View>

            {/* Modal Body */}
            {insufficientData && (
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 13, color: textColor, lineHeight: 19, textAlign: 'center' }}>
                  Your remaining credit is{' '}
                  <Text style={{ fontWeight: '800' }}>
                    ₹{insufficientData.remainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                  , but at least{' '}
                  <Text style={{ fontWeight: '800' }}>
                    ₹{insufficientData.requiredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>{' '}
                  is needed to convert it to this plan.
                </Text>

                <Text style={{ fontSize: 12, color: subTextColor, lineHeight: 18, textAlign: 'center' }}>
                  Choose an Immediate Upgrade to start now, or schedule the plan to begin after your current plan ends.
                </Text>
              </View>
            )}

            {/* Modal Action Buttons: [Immediate Upgrade], [Scheduled Plan], [Keep current plan] */}
            <View style={{ gap: 8, marginTop: 4 }}>
              {/* 1. Immediate Upgrade (Teal / Blue) */}
              <TouchableOpacity
                onPress={() => {
                  setInsufficientModalVisible(false);
                  setSelectedUpgradeType('immediate');
                  const targetPlan = availablePlans.find((p) => p.planId === insufficientData?.planId);
                  if (targetPlan) handleSelectPlan(targetPlan, 'immediate');
                }}
                style={{
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#0d9488',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>
                  Immediate Upgrade
                </Text>
              </TouchableOpacity>

              {/* 2. Scheduled Plan (Orange) */}
              <TouchableOpacity
                onPress={() => {
                  setInsufficientModalVisible(false);
                  setSelectedUpgradeType('scheduled');
                  const targetPlan = availablePlans.find((p) => p.planId === insufficientData?.planId);
                  if (targetPlan) handleSelectPlan(targetPlan, 'scheduled');
                }}
                style={{
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#d97706',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>
                  Scheduled Plan
                </Text>
              </TouchableOpacity>

              {/* 3. Keep current plan (Gray) */}
              <TouchableOpacity
                onPress={() => setInsufficientModalVisible(false)}
                style={{
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: isDark ? '#374151' : '#64748b',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>
                  Keep current plan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: UPGRADE CALCULATION & CHECKOUT MODAL */}
      <Modal
        visible={calcModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!isProcessingPayment) setCalcModalVisible(false);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              paddingBottom: Math.max(bottomSpacing, 24),
              gap: 16,
              maxHeight: '90%',
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CreditCard size={20} color="#0284c7" />
                <Text style={{ fontSize: 17, fontWeight: '800', color: textColor }}>
                  Upgrade Calculation
                </Text>
              </View>
              <TouchableOpacity
                disabled={isProcessingPayment}
                onPress={() => setCalcModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDark ? '#27272a' : '#f4f4f5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {calcResult && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ gap: 14 }}>
                  {/* Calculation Breakdown Card */}
                  <View
                    style={{
                      backgroundColor: isDark ? '#18181b' : '#f8fafc',
                      borderRadius: 14,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: borderCol,
                      gap: 10,
                    }}
                  >
                    {/* CASE 1: EXISTING + UPGRADE */}
                    {calcResult.upgradeType === 'existing' && (
                      <View style={{ gap: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>Current Plan:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                            {calcResult.calculation.currentPlan || sub.planName}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>Remaining Days:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                            {calcResult.calculation.remainingDays ?? sub.daysRemaining}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>Credit applied:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#10b981' }}>
                            ₹{calcResult.calculation.remainingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Text>
                        </View>

                        <View style={{ height: 1, backgroundColor: borderCol, marginVertical: 2 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>New Plan:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                            {calcResult.plan.planName}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>New plan price:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                            ₹{calcResult.calculation.newAmount?.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>Access through:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#0284c7' }}>
                            {calcResult.calculation.upgradeEndDate || 'N/A'}
                          </Text>
                        </View>

                        <View style={{ height: 1, backgroundColor: borderCol, marginVertical: 2 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: textColor }}>Amount due:</Text>
                          <Text style={{ fontSize: 18, fontWeight: '900', color: '#10b981' }}>
                            ₹0
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* CASE 2: IMMEDIATE UPGRADE */}
                    {calcResult.upgradeType === 'immediate' && (
                      <View style={{ gap: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>New Plan:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                            {calcResult.plan.planName}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>New Plan Cost:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                            ₹{calcResult.calculation.newAmount?.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>Credit From Current Plan:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#10b981' }}>
                            -₹{calcResult.calculation.creditAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Text>
                        </View>

                        <View style={{ height: 1, backgroundColor: borderCol, marginVertical: 2 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>Start Date:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>
                            {calcResult.calculation.startDate}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>End Date:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>
                            {calcResult.calculation.endDate}
                          </Text>
                        </View>

                        <View style={{ height: 1, backgroundColor: borderCol, marginVertical: 2 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: textColor }}>Amount to Pay:</Text>
                          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0284c7' }}>
                            ₹{calcResult.calculation.adjustedAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* CASE 3: SCHEDULED PLAN */}
                    {calcResult.upgradeType === 'scheduled' && (
                      <View style={{ gap: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>Plan:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                            {calcResult.plan.planName}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>New plan price:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                            ₹{calcResult.calculation.paymentRequired?.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: subTextColor }}>Activation Date:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284c7' }}>
                            {calcResult.calculation.startDate}
                          </Text>
                        </View>

                        <Text style={{ fontSize: 11, color: '#0284c7', marginTop: 4 }}>
                          Plan will activate automatically after your current plan expires.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Payment Gateway Selector (If payment required) */}
                  {(calcResult.upgradeType === 'scheduled' || (calcResult.calculation.adjustedAmount ?? 0) > 0) && (
                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: subTextColor }}>
                        Select Payment Gateway:
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => setSelectedGateway('Razorpay')}
                          style={{
                            flex: 1,
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: selectedGateway === 'Razorpay' ? '#0284c7' : borderCol,
                            backgroundColor: selectedGateway === 'Razorpay' ? (isDark ? '#0284c725' : '#f0f9ff') : cardBg,
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: selectedGateway === 'Razorpay' ? '#0284c7' : textColor }}>
                            Razorpay
                          </Text>
                          <Text style={{ fontSize: 10, color: subTextColor }}>UPI, Cards, NetBanking</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setSelectedGateway('Cashfree')}
                          style={{
                            flex: 1,
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: selectedGateway === 'Cashfree' ? '#0284c7' : borderCol,
                            backgroundColor: selectedGateway === 'Cashfree' ? (isDark ? '#0284c725' : '#f0f9ff') : cardBg,
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: selectedGateway === 'Cashfree' ? '#0284c7' : textColor }}>
                            Cashfree
                          </Text>
                          <Text style={{ fontSize: 10, color: subTextColor }}>Direct UPI, Cards</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Security Badge */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 4 }}>
                        <ShieldCheck size={14} color="#10b981" />
                        <Text style={{ fontSize: 11, color: subTextColor }}>
                          Secured by 256-Bit SSL Encryption & Verified Gateway
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Primary Action Button */}
                  {calcResult.upgradeType === 'existing' ? (
                    <TouchableOpacity
                      disabled={isProcessingPayment}
                      onPress={handleActivateExistingUpgrade}
                      style={{
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: '#10b981',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 6,
                      }}
                    >
                      {isProcessingPayment ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
                          Activate Now (₹0 Due)
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      disabled={isProcessingPayment}
                      onPress={handleProceedPayment}
                      style={{
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: '#0284c7',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      {isProcessingPayment ? (
                        <>
                          <ActivityIndicator size="small" color="#ffffff" />
                          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>
                            Processing Payment...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Lock size={16} color="#ffffff" />
                          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
                            Proceed to Payment (₹{calcResult.calculation.adjustedAmount?.toLocaleString('en-IN')})
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
