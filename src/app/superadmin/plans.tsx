import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  BackHandler
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../superadmin/components/Header';
import SidebarDrawer from '../../auth/components/SidebarDrawer';
import { usePlansQuery, useDeletePlanMutation } from '../../superadmin/plans/hooks/usePlans';
import { Plan } from '../../superadmin/plans/models/Plan';
import { useTheme } from '../../contexts/ThemeContext';

const PLAN_TYPE_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  Basic: { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a', text: '#15803d' },
  Standard: { bg: '#eff6ff', border: '#93c5fd', badge: '#2563eb', text: '#1d4ed8' },
  Enterprise: { bg: '#fdf4ff', border: '#c4b5fd', badge: '#9333ea', text: '#7e22ce' },
};

const PLAN_TYPE_DARK_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  Basic: { bg: '#062f17', border: '#15803d', badge: '#16a34a', text: '#86efac' },
  Standard: { bg: '#0f2042', border: '#1d4ed8', badge: '#2563eb', text: '#93c5fd' },
  Enterprise: { bg: '#240b36', border: '#7e22ce', badge: '#9333ea', text: '#c4b5fd' },
};

function formatPrice(price: number) {
  return '₹' + price.toLocaleString('en-IN');
}

export default function PlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Handle Android physical back button override to go to subscriptions hub
  useEffect(() => {
    const backAction = () => {
      router.replace('/superadmin/subscriptions-hub');
      return true; // prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [router]);
  const { data, isLoading, isError, refetch, isRefetching } = usePlansQuery();
  const deleteMutation = useDeletePlanMutation();
  const plans: Plan[] = data?.data ?? [];
  const { isDark } = useTheme();

  // Theme colors
  const bgColor = isDark ? '#0f172a' : '#f3f4f6';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#f1f5f9';

  const getColors = (planType: string) => {
    const config = isDark ? PLAN_TYPE_DARK_COLORS : PLAN_TYPE_COLORS;
    return config[planType] ?? config['Standard'];
  };

  const handleDeletePlan = (plan: Plan) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete the plan "${plan.planName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(plan.planId);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: insets.top }} edges={['bottom', 'left', 'right']}>
      <View style={{ flex: 1, backgroundColor: bgColor }}>

        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>Subscription Plans</Text>
            <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
              Manage SaaS pricing tiers
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/superadmin/create-plan')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e73be', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}
          >
            <Ionicons name="add-circle" size={16} color="#fff" />
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>New Plan</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 80, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#0284c7']} />
          }
        >
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 64 }} size="large" color="#0284c7" />
          ) : isError ? (
            <View style={{ padding: 16, backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2', borderWidth: 1, borderColor: isDark ? '#7f1d1d' : '#fecaca', borderRadius: 12, alignItems: 'center', marginTop: 24 }}>
              <Text style={{ color: '#dc2626', fontWeight: '600', marginBottom: 8 }}>Failed to load plans</Text>
              <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#dc2626', borderRadius: 12 }} onPress={() => refetch()}>
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : plans.length === 0 ? (
            <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 32, alignItems: 'center', marginTop: 16 }}>
              <FontAwesome name="cubes" size={48} color="#94a3b8" />
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginTop: 16 }}>No Plans Found</Text>
              <Text style={{ color: subTextColor, fontSize: 12, textAlign: 'center', marginTop: 8, paddingHorizontal: 24 }}>
                Create your first subscription plan to get started.
              </Text>
            </View>
          ) : (
            plans.map((plan) => {
              const colors = getColors(plan.planType);
              return (
                <View
                  key={plan.planId}
                  style={{ borderColor: colors.border, backgroundColor: colors.bg, borderWidth: 1, borderRadius: 16, padding: 16 }}
                >
                  {/* Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }}>{plan.planName}</Text>
                        <View
                          style={{
                            backgroundColor: plan.isActive ? (isDark ? '#064e3b40' : '#dcfce7') : (isDark ? '#7f1d1d40' : '#fee2e2'),
                            borderColor: plan.isActive ? (isDark ? '#064e3b' : '#86efac') : (isDark ? '#7f1d1d' : '#fca5a5'),
                            borderWidth: 1,
                            borderRadius: 20,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}
                        >
                          <Text style={{ color: plan.isActive ? '#16a34a' : '#dc2626', fontSize: 10, fontWeight: '700' }}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                      {plan.description ? (
                        <Text style={{ color: subTextColor, fontSize: 12, marginTop: 2 }}>{plan.description}</Text>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: '/superadmin/create-plan', params: { id: plan.planId } })}
                        style={{ padding: 8, backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#334155' : '#cbd5e1' }}
                      >
                        <Ionicons name="create-outline" size={16} color={isDark ? '#cbd5e1' : '#475569'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeletePlan(plan)}
                        style={{ padding: 8, backgroundColor: isDark ? '#7f1d1d30' : '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#7f1d1d' : '#fca5a5' }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Pricing Row */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#ffffff', borderWidth: 1, borderColor: borderCol, borderRadius: 12, padding: 10, alignItems: 'center' }}>
                      <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Monthly</Text>
                      <Text style={{ color: textColor, fontWeight: '700', fontSize: 14, marginTop: 2 }}>{formatPrice(plan.monthlyPrice)}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#ffffff', borderWidth: 1, borderColor: borderCol, borderRadius: 12, padding: 10, alignItems: 'center' }}>
                      <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Yearly</Text>
                      <Text style={{ color: textColor, fontWeight: '700', fontSize: 14, marginTop: 2 }}>{formatPrice(plan.yearlyPrice)}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#ffffff', borderWidth: 1, borderColor: borderCol, borderRadius: 12, padding: 10, alignItems: 'center' }}>
                      <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Support</Text>
                      <Text style={{ color: textColor, fontWeight: '700', fontSize: 12, marginTop: 2 }}>{plan.supportLevel}</Text>
                    </View>
                  </View>

                  {/* Limits Grid */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Users', value: plan.maxUsers === -1 ? '∞' : plan.maxUsers },
                      { label: 'Agents', value: plan.maxAgents === -1 ? '∞' : plan.maxAgents },
                      { label: 'Leads/mo', value: plan.maxLeadsPerMonth === -1 ? '∞' : plan.maxLeadsPerMonth.toLocaleString() },
                      { label: 'Partners', value: plan.maxPartners === -1 ? '∞' : plan.maxPartners },
                      { label: 'Storage', value: plan.maxStorageGB === -1 ? '∞' : `${plan.maxStorageGB}GB` },
                    ].map((item) => (
                      <View key={item.label} style={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderWidth: 1, borderColor: borderCol, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' }}>
                        <Text style={{ color: textColor, fontWeight: '700', fontSize: 12 }}>{item.value}</Text>
                        <Text style={{ color: subTextColor, fontSize: 10 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Feature Chips */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {plan.hasWhatsAppIntegration && <Chip label="WhatsApp" color={colors.badge} />}
                    {plan.hasFacebookIntegration && <Chip label="Facebook" color={colors.badge} />}
                    {plan.hasEmailIntegration && <Chip label="Email" color={colors.badge} />}
                    {plan.hasAdvancedReports && <Chip label="Reports" color={colors.badge} />}
                    {plan.hasCustomBranding && <Chip label="Branding" color={colors.badge} />}
                    {plan.hasPrioritySupport && <Chip label="Priority Support" color={colors.badge} />}
                    {plan.hasCustomAPIAccess && <Chip label="API Access" color={colors.badge} />}
                    {plan.hasImpersonation && <Chip label="Impersonation" color={colors.badge} />}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  const { isDark } = useTheme();
  return (
    <View style={{
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    }}>
      <Ionicons name="checkmark-circle" size={10} color={color} />
      <Text style={{ color, fontSize: 10, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
