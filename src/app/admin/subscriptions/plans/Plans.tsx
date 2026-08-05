import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Switch,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '@/theme/adminTheme';
import {
  Package,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  X,
  Users,
  HardDrive,
  Check,
  Zap,
  Eye,
} from 'lucide-react-native';
import {
  subscriptionService,
  SubscriptionPlanItem,
  PlanStats,
  CreatePlanPayload,
} from '../../../../admin/services/subscriptionService';

export default function PlansScreen() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [stats, setStats] = useState<PlanStats>({
    totalPlans: 0,
    activePlans: 0,
    inactivePlans: 0,
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // View Detail Modal State
  const [viewPlan, setViewPlan] = useState<SubscriptionPlanItem | null>(null);

  const [form, setForm] = useState<CreatePlanPayload>({
    planName: '',
    description: '',
    monthlyPrice: 500,
    yearlyPrice: 12000,
    maxAgents: 2,
    maxLeadsPerMonth: 500,
    maxStorageGB: 1,
    hasWhatsAppIntegration: true,
    hasFacebookIntegration: true,
    hasEmailIntegration: true,
    hasCustomAPIAccess: true,
    hasAdvancedReports: false,
    hasCustomReports: false,
    hasDataExport: true,
    hasPrioritySupport: false,
    hasPhoneSupport: false,
    hasDedicatedmanager: false,
    supportLevel: 'Email',
    planType: 'BASIC',
    isActive: true,
    sortOrder: 1,
  });

  const fetchPlans = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await subscriptionService.getPlans({ search });
      if (res && res.success && res.data) {
        const fetchedPlans = res.data.plans || [];
        setPlans(fetchedPlans);
        if (res.data.stats) {
          setStats(res.data.stats);
        } else {
          setStats({
            totalPlans: fetchedPlans.length,
            activePlans: fetchedPlans.filter((p) => p.isActive).length,
            inactivePlans: fetchedPlans.filter((p) => !p.isActive).length,
          });
        }
      } else {
        setPlans([]);
      }
    } catch (err: any) {
      console.error('Error fetching plans from API:', err?.message, err?.response?.data);
      Toast.show({
        type: 'error',
        text1: 'API Error',
        text2: err?.response?.data?.message || err?.message || 'Failed to fetch subscription plans from server',
      });
      setPlans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setForm({
      planName: '',
      description: '',
      monthlyPrice: 500,
      yearlyPrice: 12000,
      maxAgents: 2,
      maxLeadsPerMonth: 500,
      maxStorageGB: 1,
      hasWhatsAppIntegration: true,
      hasFacebookIntegration: true,
      hasEmailIntegration: true,
      hasCustomAPIAccess: true,
      hasAdvancedReports: false,
      hasCustomReports: false,
      hasDataExport: true,
      hasPrioritySupport: false,
      hasPhoneSupport: false,
      hasDedicatedmanager: false,
      supportLevel: 'Email',
      planType: 'BASIC',
      isActive: true,
      sortOrder: plans.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: SubscriptionPlanItem) => {
    setEditingPlan(plan);
    setForm({
      planName: plan.planName || '',
      description: plan.description || '',
      monthlyPrice: plan.monthlyPrice || 0,
      yearlyPrice: plan.yearlyPrice || 0,
      maxAgents: plan.maxAgents ?? 2,
      maxLeadsPerMonth: plan.maxLeadsPerMonth ?? 500,
      maxStorageGB: plan.maxStorageGB ?? 1,
      hasWhatsAppIntegration: !!plan.hasWhatsAppIntegration,
      hasFacebookIntegration: !!plan.hasFacebookIntegration,
      hasEmailIntegration: !!plan.hasEmailIntegration,
      hasCustomAPIAccess: !!plan.hasCustomAPIAccess,
      hasAdvancedReports: !!plan.hasAdvancedReports,
      hasCustomReports: !!plan.hasCustomReports,
      hasDataExport: !!plan.hasDataExport,
      hasPrioritySupport: !!plan.hasPrioritySupport,
      hasPhoneSupport: !!plan.hasPhoneSupport,
      hasDedicatedmanager: !!plan.hasDedicatedmanager,
      supportLevel: plan.supportLevel || 'Email',
      planType: plan.planType || 'BASIC',
      isActive: !!plan.isActive,
      sortOrder: plan.sortOrder || 1,
    });
    setIsModalOpen(true);
  };

  const handleSavePlan = async () => {
    if (!form.planName) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Plan Name is required.',
      });
      return;
    }

    setModalLoading(true);
    try {
      if (editingPlan) {
        await subscriptionService.updatePlan(editingPlan.planId, form);
        Toast.show({
          type: 'success',
          text1: 'Plan Updated',
          text2: `Plan "${form.planName}" updated successfully!`,
        });
      } else {
        await subscriptionService.createPlan(form);
        Toast.show({
          type: 'success',
          text1: 'Plan Created',
          text2: `Plan "${form.planName}" created successfully!`,
        });
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: err?.message || 'Error saving plan',
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (plan: SubscriptionPlanItem) => {
    try {
      if (plan.isActive) {
        await subscriptionService.deactivatePlan(plan.planId);
        Toast.show({
          type: 'info',
          text1: 'Plan Deactivated',
          text2: `${plan.planName} has been deactivated.`,
        });
      } else {
        await subscriptionService.activatePlan(plan.planId);
        Toast.show({
          type: 'success',
          text1: 'Plan Activated',
          text2: `${plan.planName} is now active.`,
        });
      }
      fetchPlans();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Action Failed',
        text2: err?.message || 'Failed to toggle plan status',
      });
    }
  };

  const handleDeletePlan = async (planId: number) => {
    try {
      await subscriptionService.deletePlan(planId);
      Toast.show({
        type: 'success',
        text1: 'Plan Deleted',
        text2: 'Subscription plan removed successfully.',
      });
      fetchPlans();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: err?.message || 'Failed to delete plan',
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Header Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: '#14b8a620',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Package size={20} color="#14b8a6" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Subscription Plans</Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenAdd}
          style={{
            backgroundColor: '#14b8a6',
            paddingHorizontal: 14,
            height: 38,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>Add Plan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchPlans(true)} />
        }
      >
        {/* KPI Stats Cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 11, color: subTextColor }}>Total Plans</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: textColor, marginTop: 4 }}>
              {stats.totalPlans}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 11, color: subTextColor }}>Active Plans</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#10b981', marginTop: 4 }}>
              {stats.activePlans}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 11, color: subTextColor }}>Inactive</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#ef4444', marginTop: 4 }}>
              {stats.inactivePlans}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={{
            height: 42,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: borderCol,
            backgroundColor: cardBg,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Search size={16} color={subTextColor} />
          <TextInput
            style={{ flex: 1, color: textColor, fontSize: 13 }}
            placeholder="Search plans by name or description..."
            placeholderTextColor={subTextColor}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Plans List */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#14b8a6" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Fetching subscription plans from API...</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Package size={36} color={subTextColor} />
            <Text style={{ marginTop: 10, color: subTextColor, fontSize: 14 }}>No subscription plans found</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {plans.map((plan) => (
              <View
                key={plan.planId}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: borderCol,
                  padding: 16,
                  gap: 12,
                }}
              >
                {/* Plan Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 17, fontWeight: '800', color: textColor }}>
                        {plan.planName}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                          backgroundColor: plan.isActive ? '#10b98115' : '#ef444415',
                          borderWidth: 1,
                          borderColor: plan.isActive ? '#10b98140' : '#ef444440',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: plan.isActive ? '#10b981' : '#ef4444',
                          }}
                        >
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>

                      {plan.planType && (
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 8,
                            backgroundColor: '#3b82f615',
                            borderWidth: 1,
                            borderColor: '#3b82f640',
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6' }}>
                            {plan.planType}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>
                      {plan.description || 'No description provided'}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#14b8a6' }}>
                      ₹{plan.monthlyPrice}
                    </Text>
                    <Text style={{ fontSize: 11, color: subTextColor }}>
                      ₹{plan.yearlyPrice} / yr
                    </Text>
                  </View>
                </View>

                {/* Metrics Badges */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bgColor, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Users size={13} color={subTextColor} />
                    <Text style={{ fontSize: 11, color: textColor, fontWeight: '600' }}>
                      {plan.maxAgents === -1 ? 'Unlimited Agents' : `${plan.maxAgents} Agents`}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bgColor, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Zap size={13} color={subTextColor} />
                    <Text style={{ fontSize: 11, color: textColor, fontWeight: '600' }}>
                      {plan.maxLeadsPerMonth === -1 ? 'Unlimited Leads' : `${plan.maxLeadsPerMonth} Leads/mo`}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bgColor, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <HardDrive size={13} color={subTextColor} />
                    <Text style={{ fontSize: 11, color: textColor, fontWeight: '600' }}>
                      {plan.maxStorageGB} GB Storage
                    </Text>
                  </View>
                </View>

                {/* Feature Chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {plan.hasWhatsAppIntegration && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10b98110', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Check size={12} color="#10b981" />
                      <Text style={{ fontSize: 10, color: '#10b981', fontWeight: '700' }}>WhatsApp</Text>
                    </View>
                  )}
                  {plan.hasFacebookIntegration && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3b82f610', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Check size={12} color="#3b82f6" />
                      <Text style={{ fontSize: 10, color: '#3b82f6', fontWeight: '700' }}>Facebook</Text>
                    </View>
                  )}
                  {plan.hasEmailIntegration && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#8b5cf610', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Check size={12} color="#8b5cf6" />
                      <Text style={{ fontSize: 10, color: '#8b5cf6', fontWeight: '700' }}>Email Campaigns</Text>
                    </View>
                  )}
                  {plan.hasCustomAPIAccess && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f59e0b10', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Check size={12} color="#f59e0b" />
                      <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '700' }}>API Access</Text>
                    </View>
                  )}
                </View>

                {/* Actions Row */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTopWidth: 1,
                    borderTopColor: borderCol,
                    paddingTop: 12,
                    marginTop: 4,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleToggleStatus(plan)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: plan.isActive ? '#ef444415' : '#10b98115',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: plan.isActive ? '#ef4444' : '#10b981',
                      }}
                    >
                      {plan.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => setViewPlan(plan)}
                      style={{ padding: 6, backgroundColor: bgColor, borderRadius: 8 }}
                    >
                      <Eye size={16} color="#14b8a6" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenEdit(plan)}
                      style={{ padding: 6, backgroundColor: bgColor, borderRadius: 8 }}
                    >
                      <Edit size={16} color="#3b82f6" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeletePlan(plan.planId)}
                      style={{ padding: 6, backgroundColor: bgColor, borderRadius: 8 }}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* VIEW PLAN DETAILS MODAL */}
      <Modal visible={!!viewPlan} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              maxHeight: '85%',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textColor }}>Plan Details</Text>
              <TouchableOpacity onPress={() => setViewPlan(null)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {viewPlan && (
              <ScrollView contentContainerStyle={{ gap: 14 }}>
                <View style={{ backgroundColor: bgColor, borderRadius: 12, padding: 14 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: textColor }}>
                    {viewPlan.planName}
                  </Text>
                  <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                    {viewPlan.description || 'No description'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#14b8a6' }}>
                      ₹{viewPlan.monthlyPrice} / mo
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: subTextColor }}>
                      ₹{viewPlan.yearlyPrice} / yr
                    </Text>
                  </View>
                </View>

                {/* Quotas */}
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>Limits & Quotas</Text>
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      • Agents Limit: <Text style={{ fontWeight: '700', color: textColor }}>{viewPlan.maxAgents === -1 ? 'Unlimited' : viewPlan.maxAgents}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      • Monthly Leads: <Text style={{ fontWeight: '700', color: textColor }}>{viewPlan.maxLeadsPerMonth === -1 ? 'Unlimited' : viewPlan.maxLeadsPerMonth}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      • Storage: <Text style={{ fontWeight: '700', color: textColor }}>{viewPlan.maxStorageGB} GB</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      • Support Level: <Text style={{ fontWeight: '700', color: textColor }}>{viewPlan.supportLevel || 'Email'}</Text>
                    </Text>
                  </View>
                </View>

                {/* Features Breakdown */}
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>Feature Breakdown</Text>
                  <View style={{ gap: 6 }}>
                    {[
                      { label: 'WhatsApp Integration', enabled: viewPlan.hasWhatsAppIntegration },
                      { label: 'Facebook Lead Integration', enabled: viewPlan.hasFacebookIntegration },
                      { label: 'Email Campaigns', enabled: viewPlan.hasEmailIntegration },
                      { label: 'Custom API Access', enabled: viewPlan.hasCustomAPIAccess },
                      { label: 'Advanced Analytics Reports', enabled: viewPlan.hasAdvancedReports },
                      { label: 'Custom Reports Generator', enabled: viewPlan.hasCustomReports },
                      { label: 'Data Export (CSV / Excel)', enabled: viewPlan.hasDataExport },
                      { label: 'Priority Support', enabled: viewPlan.hasPrioritySupport },
                      { label: 'Dedicated Account Manager', enabled: viewPlan.hasDedicatedmanager },
                    ].map((f, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {f.enabled ? (
                          <CheckCircle size={16} color="#10b981" />
                        ) : (
                          <XCircle size={16} color={subTextColor} />
                        )}
                        <Text style={{ fontSize: 12, color: f.enabled ? textColor : subTextColor }}>
                          {f.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setViewPlan(null)}
              style={{
                marginTop: 16,
                height: 42,
                borderRadius: 8,
                backgroundColor: '#14b8a6',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CREATE / EDIT PLAN MODAL */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              maxHeight: '90%',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>
                {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12 }}>
              {/* Basic Details */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Plan Name *
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    color: textColor,
                    backgroundColor: bgColor,
                    fontSize: 13,
                  }}
                  placeholder="e.g. Basic / Standard Growth / Enterprise Pro"
                  placeholderTextColor={subTextColor}
                  value={form.planName}
                  onChangeText={(val) => setForm({ ...form, planName: val })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Description
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    color: textColor,
                    backgroundColor: bgColor,
                    fontSize: 13,
                  }}
                  placeholder="Plan summary & description"
                  placeholderTextColor={subTextColor}
                  value={form.description}
                  onChangeText={(val) => setForm({ ...form, description: val })}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Plan Type
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    placeholder="BASIC / STANDARD / ENTERPRISE"
                    placeholderTextColor={subTextColor}
                    value={form.planType}
                    onChangeText={(val) => setForm({ ...form, planType: val })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Support Level
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    placeholder="Email / Chat & Email / Dedicated"
                    placeholderTextColor={subTextColor}
                    value={form.supportLevel}
                    onChangeText={(val) => setForm({ ...form, supportLevel: val })}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Monthly Price (₹)
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    keyboardType="number-pad"
                    value={String(form.monthlyPrice)}
                    onChangeText={(val) => setForm({ ...form, monthlyPrice: parseFloat(val) || 0 })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Yearly Price (₹)
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    keyboardType="number-pad"
                    value={String(form.yearlyPrice)}
                    onChangeText={(val) => setForm({ ...form, yearlyPrice: parseFloat(val) || 0 })}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Max Agents (-1 = Unltd)
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    keyboardType="number-pad"
                    value={String(form.maxAgents)}
                    onChangeText={(val) => setForm({ ...form, maxAgents: parseInt(val) || 1 })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Leads / Month (-1 = Unltd)
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    keyboardType="number-pad"
                    value={String(form.maxLeadsPerMonth)}
                    onChangeText={(val) => setForm({ ...form, maxLeadsPerMonth: parseInt(val) || 100 })}
                  />
                </View>
              </View>

              {/* Feature Toggles */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginTop: 6 }}>
                Features & Integrations
              </Text>

              {[
                { key: 'hasWhatsAppIntegration', label: 'WhatsApp Integration' },
                { key: 'hasFacebookIntegration', label: 'Facebook Integration' },
                { key: 'hasEmailIntegration', label: 'Email Integration' },
                { key: 'hasCustomAPIAccess', label: 'Custom API Access' },
                { key: 'hasAdvancedReports', label: 'Advanced Analytics Reports' },
                { key: 'hasCustomReports', label: 'Custom Reports Generator' },
                { key: 'hasDataExport', label: 'Data Export (CSV / Excel)' },
                { key: 'hasPrioritySupport', label: 'Priority Support' },
                { key: 'hasPhoneSupport', label: 'Phone Support' },
                { key: 'hasDedicatedmanager', label: 'Dedicated Account Manager' },
              ].map((item) => (
                <View
                  key={item.key}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, color: textColor }}>{item.label}</Text>
                  <Switch
                    value={(form as any)[item.key]}
                    onValueChange={(val) => setForm({ ...form, [item.key]: val })}
                    trackColor={{ false: borderCol, true: '#14b8a6' }}
                  />
                </View>
              ))}

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: borderCol,
                  marginTop: 6,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>Active Plan Status</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={(val) => setForm({ ...form, isActive: val })}
                  trackColor={{ false: borderCol, true: '#10b981' }}
                />
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: borderCol,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: subTextColor, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSavePlan}
                disabled={modalLoading}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  backgroundColor: '#14b8a6',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {modalLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Save Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
