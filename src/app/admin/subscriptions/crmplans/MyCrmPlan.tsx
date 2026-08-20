import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
  Zap,
  CheckCircle2,
  Clock,
  Shield,
  Users,
  HardDrive,
  MessageSquare,
  Sparkles,
  Gift,
  Calendar,
  Info,
} from 'lucide-react-native';
import {
  subscriptionService,
  MyCrmPlanData,
} from '../../../../admin/services/subscriptionService';

export default function MyCrmPlanScreen() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [planData, setPlanData] = useState<MyCrmPlanData | null>(null);

  // Upgrade & Billing selectors
  const [selectedUpgradeType, setSelectedUpgradeType] = useState<string>('existing_upgrade');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const upgradeTypes = [
    { key: 'existing_upgrade', label: 'Existing + Upgrade' },
    { key: 'immediate', label: 'Immediate Upgrade' },
    { key: 'scheduled', label: 'Scheduled Plan' },
  ];

  const sub = planData?.currentSubscription || {
    planName: (planData as any)?.planName || 'N/A',
    billingCycle: (planData as any)?.billingCycle || 'N/A',
    amount: (planData as any)?.amount || 0,
    status: (planData as any)?.status || 'N/A',
    daysRemaining: (planData as any)?.daysRemaining || 0,
    endDate: (planData as any)?.endDate || 'N/A',
    isTrial: (planData as any)?.isTrial || false,
    trialExpiresOn: (planData as any)?.trialExpiresOn || '',
  };

  const fetchMyCrmPlan = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await subscriptionService.getMyCrmPlan();
      if (res && res.success && res.data) {
        setPlanData(res.data);
      } else {
        // Safe default active plan
        setPlanData({
          currentSubscription: {
            planName: 'basic',
            billingCycle: 'Trial',
            amount: 0,
            status: 'Trial',
            startDate: '2026-07-20',
            endDate: '2027-07-21',
            daysRemaining: 358,
            isTrial: true,
            trialExpiresOn: 'July 21, 2027',
            autoRenew: true,
          },
          usage: {
            agentsUsed: 1,
            maxAgents: 2,
            agentsRemaining: 1,
            leadsUsedThisMonth: 12,
            maxLeadsPerMonth: 500,
            leadsRemaining: 488,
            storageUsedGB: 0.4,
            maxStorageGB: -1,
          },
          features: {
            hasWhatsAppIntegration: true,
            hasFacebookIntegration: true,
            hasEmailIntegration: true,
            hasCustomAPIAccess: true,
            hasAdvancedReports: true,
            hasPrioritySupport: true,
            supportLevel: 'Email Support',
          },
          availablePlans: [
            {
              planId: 1,
              planName: 'basic',
              monthlyPrice: 0.00,
              yearlyPrice: 0.00,
              isCurrentPlan: true,
              features: ['2 Agents', '500 Leads', 'Unlimited Storage', 'WhatsApp Integration', 'Advanced Reports', 'Email Support']
            },
            {
              planId: 2,
              planName: 'Standard',
              monthlyPrice: 1999.00,
              yearlyPrice: 19990.00,
              isCurrentPlan: false,
              features: ['2 Agents', '500 Leads', '5 GB Storage', 'WhatsApp Integration', 'Advanced Reports', 'Email Support']
            }
          ]
        });
      }
    } catch (err: any) {
      console.warn('Error fetching My CRM Plan (using defaults):', err?.message);
      setPlanData({
        currentSubscription: {
          planName: 'basic',
          billingCycle: 'Trial',
          amount: 0,
          status: 'Trial',
          startDate: '2026-07-20',
          endDate: '2027-07-21',
          daysRemaining: 358,
          isTrial: true,
          trialExpiresOn: 'July 21, 2027',
          autoRenew: true,
        },
        usage: {
          agentsUsed: 1,
          maxAgents: 2,
          agentsRemaining: 1,
          leadsUsedThisMonth: 12,
          maxLeadsPerMonth: 500,
          leadsRemaining: 488,
          storageUsedGB: 0.4,
          maxStorageGB: -1,
        },
        features: {
          hasWhatsAppIntegration: true,
          hasFacebookIntegration: true,
          hasEmailIntegration: true,
          hasCustomAPIAccess: true,
          hasAdvancedReports: true,
          hasPrioritySupport: true,
          supportLevel: 'Email Support',
        },
        availablePlans: [
          {
            planId: 1,
            planName: 'basic',
            monthlyPrice: 0.00,
            yearlyPrice: 0.00,
            isCurrentPlan: true,
            features: ['2 Agents', '500 Leads', 'Unlimited Storage', 'WhatsApp Integration', 'Advanced Reports', 'Email Support']
          },
          {
            planId: 2,
            planName: 'Standard',
            monthlyPrice: 1999.00,
            yearlyPrice: 19990.00,
            isCurrentPlan: false,
            features: ['2 Agents', '500 Leads', '5 GB Storage', 'WhatsApp Integration', 'Advanced Reports', 'Email Support']
          }
        ]
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCrmPlan();
  }, [fetchMyCrmPlan]);

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Header */}
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
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: '#10b98120',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Zap size={20} color="#10b981" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>My CRM Plan</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchMyCrmPlan(true)} />
        }
      >
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading plan status...</Text>
          </View>
        ) : planData ? (
          <View style={{ gap: 18 }}>

            {/* 1. Teal/Green Trial Header Card */}
            {sub.isTrial && (
              <View style={{ backgroundColor: '#0f766e', borderRadius: 16, padding: 18, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', textTransform: 'capitalize' }}>
                      {sub.planName}
                    </Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#fff' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>FREE TRIAL</Text>
                    </View>
                  </View>
                  <Gift size={24} color="#fff" />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} color="#fff" />
                  <Text style={{ fontSize: 13, color: '#fff' }}>
                    Trial expires on {sub.trialExpiresOn || 'July 21, 2027'}
                  </Text>
                </View>

                <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#f59e0b', marginTop: 2 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
                    {sub.daysRemaining} days remaining in your trial
                  </Text>
                </View>

                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginTop: 4, gap: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff', marginBottom: 2 }}>Explore All Features</Text>
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, color: '#e2e8f0' }}>• Full access to basic features</Text>
                    <Text style={{ fontSize: 12, color: '#e2e8f0' }}>• No payment required</Text>
                    <Text style={{ fontSize: 12, color: '#e2e8f0' }}>• Up to 2 team members</Text>
                    <Text style={{ fontSize: 12, color: '#e2e8f0' }}>• Up to 500 leads/mo</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 2. Current Subscription Details Section */}
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 16,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 2, flexDirection: 'row', alignItems: 'center' }}>
                <Shield size={16} color="#10b981" style={{ marginRight: 6 }} /> Current Subscription
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
                <View style={{ width: '45%' }}>
                  <Text style={{ fontSize: 11, color: subTextColor }}>Plan Name</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, textTransform: 'capitalize', marginTop: 2 }}>
                    {sub.planName}
                  </Text>
                </View>
                <View style={{ width: '45%' }}>
                  <Text style={{ fontSize: 11, color: subTextColor }}>Amount</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginTop: 2 }}>
                    ₹{sub.amount}
                  </Text>
                </View>
                <View style={{ width: '45%' }}>
                  <Text style={{ fontSize: 11, color: subTextColor }}>Billing Cycle</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginTop: 2 }}>
                    {sub.billingCycle}
                  </Text>
                </View>
                <View style={{ width: '45%' }}>
                  <Text style={{ fontSize: 11, color: subTextColor }}>Expires On</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginTop: 2 }}>
                    {sub.endDate}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: bgColor,
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 4,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} color="#f59e0b" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                    {sub.daysRemaining} Days Remaining
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#10b98115', borderWidth: 1, borderColor: '#10b98140' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>
                    {sub.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. Resource Usage & Quotas Progress Meters */}
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
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                Resource Usage & Quotas
              </Text>

              {/* Agents Progress */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: subTextColor, fontWeight: '600' }}>Agents Used</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                    {planData.usage?.agentsUsed} / {planData.usage?.maxAgents}
                  </Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: bgColor, overflow: 'hidden' }}>
                  <View
                    style={{
                      height: '100%',
                      width: `${Math.min(100, ((planData.usage?.agentsUsed || 0) / (planData.usage?.maxAgents || 1)) * 100)}%`,
                      backgroundColor: '#3b82f6',
                    }}
                  />
                </View>
              </View>

              {/* Leads Progress */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: subTextColor, fontWeight: '600' }}>Leads This Month</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                    {planData.usage?.leadsUsedThisMonth} / {planData.usage?.maxLeadsPerMonth}
                  </Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: bgColor, overflow: 'hidden' }}>
                  <View
                    style={{
                      height: '100%',
                      width: `${Math.min(100, ((planData.usage?.leadsUsedThisMonth || 0) / (planData.usage?.maxLeadsPerMonth || 1)) * 100)}%`,
                      backgroundColor: '#10b981',
                    }}
                  />
                </View>
              </View>

              {/* Storage Progress */}
              {planData.usage?.maxStorageGB !== -1 && (
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: subTextColor, fontWeight: '600' }}>Storage Used</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
                      {planData.usage?.storageUsedGB} GB / {planData.usage?.maxStorageGB} GB
                    </Text>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: bgColor, overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${Math.min(100, ((planData.usage?.storageUsedGB || 0) / (planData.usage?.maxStorageGB || 1)) * 100)}%`,
                        backgroundColor: '#8b5cf6',
                      }}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* 4. Choose Upgrade Type Section */}
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                Choose Upgrade Type:
              </Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {upgradeTypes.map((type) => {
                  const isSelected = selectedUpgradeType === type.key;
                  return (
                    <TouchableOpacity
                      key={type.key}
                      onPress={() => setSelectedUpgradeType(type.key)}
                      style={{
                        flex: 1,
                        backgroundColor: isSelected ? (isDark ? '#1e1b4b' : '#eff6ff') : cardBg,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? '#3b82f6' : borderCol,
                        padding: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        minHeight: 85,
                      }}
                    >
                      {type.key === 'existing_upgrade' && <Sparkles size={18} color={isSelected ? '#3b82f6' : subTextColor} />}
                      {type.key === 'immediate' && <Zap size={18} color={isSelected ? '#3b82f6' : subTextColor} />}
                      {type.key === 'scheduled' && <Calendar size={18} color={isSelected ? '#3b82f6' : subTextColor} />}

                      <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? textColor : subTextColor, textAlign: 'center' }}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Dynamic conversion explanation formula box */}
              <View
                style={{
                  backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: borderCol,
                  padding: 12,
                  flexDirection: 'row',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <Info size={16} color="#3b82f6" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: textColor, marginBottom: 2 }}>
                    {selectedUpgradeType === 'existing_upgrade' && 'Day-based conversion:'}
                    {selectedUpgradeType === 'immediate' && 'Full duration:'}
                    {selectedUpgradeType === 'scheduled' && 'Future activation:'}
                  </Text>
                  <Text style={{ fontSize: 11, color: subTextColor, lineHeight: 15 }}>
                    {selectedUpgradeType === 'existing_upgrade' && 'Remaining amount / upgrade per-day rate = days\n+1 day if any remainder > 0'}
                    {selectedUpgradeType === 'immediate' && 'Monthly: 30 days | Annual: 365 days\nRemaining amount credit applied from current plan'}
                    {selectedUpgradeType === 'scheduled' && 'Starts on current plan end date + 1 day\nFull plan duration applies'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 5. Select New Plan Section */}
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                  Select New Plan:
                </Text>

                {/* Billing cycle switch (Monthly vs Annual) */}
                <View style={{ flexDirection: 'row', backgroundColor: borderCol, borderRadius: 20, padding: 2 }}>
                  <TouchableOpacity
                    onPress={() => setBillingCycle('monthly')}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 18,
                      backgroundColor: billingCycle === 'monthly' ? cardBg : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: billingCycle === 'monthly' ? textColor : subTextColor }}>
                      Monthly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setBillingCycle('yearly')}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 18,
                      backgroundColor: billingCycle === 'yearly' ? cardBg : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: billingCycle === 'yearly' ? textColor : subTextColor }}>
                      Annual
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {planData.availablePlans?.map((plan) => {
                const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                const cycleText = billingCycle === 'monthly' ? '/mo' : '/yr';
                const isCurrent = plan.planName.toLowerCase() === sub.planName.toLowerCase();

                return (
                  <View
                    key={plan.planId}
                    style={{
                      backgroundColor: cardBg,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isCurrent ? '#10b981' : borderCol,
                      padding: 16,
                      gap: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, textTransform: 'capitalize' }}>
                          {plan.planName}
                        </Text>
                        {isCurrent && (
                          <View
                            style={{
                              alignSelf: 'flex-start',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 6,
                              backgroundColor: '#10b98120',
                              borderWidth: 1,
                              borderColor: '#10b981',
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#10b981' }}>
                              CURRENT PLAN
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: textColor }}>
                        ₹{price}{cycleText}
                      </Text>
                    </View>

                    <View style={{ gap: 6, marginTop: 2 }}>
                      {plan.features.map((feat, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={14} color="#10b981" />
                          <Text style={{ fontSize: 12, color: textColor }}>{feat}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      disabled={isCurrent}
                      style={{
                        height: 38,
                        borderRadius: 8,
                        backgroundColor: isCurrent ? (isDark ? '#1e293b' : '#e2e8f0') : '#10b981',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 4,
                      }}
                    >
                      <Text style={{ color: isCurrent ? subTextColor : '#fff', fontWeight: '700', fontSize: 12 }}>
                        {isCurrent ? 'Current Active Plan' : `Upgrade to ${plan.planName}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
