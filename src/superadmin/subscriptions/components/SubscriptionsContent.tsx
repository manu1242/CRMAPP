import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscriptionsQuery, useAssignSubscriptionMutation } from '@/superadmin/subscriptions/hooks/useSubscriptions';
import { usePlansQuery } from '@/superadmin/plans/hooks/usePlans';
import { TenantSubscription } from '@/superadmin/subscriptions/api/subscriptions.api';
import { useTheme } from '../../../contexts/ThemeContext';

// Date utility functions
function formatDateDDMMYYYY(dateString: string | null) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

function isExpired(endDateString: string | null) {
  if (!endDateString) return false;
  try {
    const d = new Date(endDateString);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  } catch {
    return false;
  }
}

// Plan Badge Colors Helper
const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Basic:      { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  Standard:   { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  Advance:    { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5' },
  Premium:    { bg: '#fdf4ff', text: '#9333ea', border: '#f3e8ff' },
  Enterprise: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
};

const PLAN_DARK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Basic:      { bg: '#78350f20', text: '#f59e0b', border: '#d9770680' },
  Standard:   { bg: '#1e3a8a30', text: '#3b82f6', border: '#1d4ed850' },
  Advance:    { bg: '#7c2d1230', text: '#f97316', border: '#ea580c50' },
  Premium:    { bg: '#581c8730', text: '#a855f7', border: '#7e22ce50' },
  Enterprise: { bg: '#064e3b30', text: '#10b981', border: '#05966950' },
};

// Billing Cycle Badge Colors Helper
const BILLING_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  monthly: { bg: '#eff6ff', text: '#3b82f6', border: '#dbeafe' },
  annual:  { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  Trial:   { bg: '#f0f9ff', text: '#0284c7', border: '#e0f2fe' },
};

const BILLING_DARK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  monthly: { bg: '#1e3a8a30', text: '#3b82f6', border: '#1d4ed850' },
  annual:  { bg: '#064e3b30', text: '#10b981', border: '#05966950' },
  Trial:   { bg: '#08334430', text: '#06b6d4', border: '#0891b250' },
};

function formatPrice(price: number) {
  return '₹' + (price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SubscriptionsContent() {
  const { isDark } = useTheme();

  // Theme colors
  const bgColor = isDark ? '#0f172a' : '#f3f4f6';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#f1f5f9';
  const tableHeaderBg = isDark ? '#0f172a' : '#f1f5f9';
  const inputBg = isDark ? '#0f172a' : '#ffffff';
  const inputBorder = isDark ? '#334155' : '#cbd5e1';
  const filterBarBg = isDark ? '#0f172a' : '#f8fafc';
  const modalBg = isDark ? '#1e293b' : '#ffffff';
  const staticLabelBg = isDark ? '#0f172a' : '#f1f5f9';

  const getPlanColors = useCallback((planName: string) => {
    const config = isDark ? PLAN_DARK_COLORS : PLAN_COLORS;
    const key = Object.keys(config).find((k) =>
      planName.toLowerCase().includes(k.toLowerCase())
    );
    return key ? config[key] : { bg: isDark ? '#1e293b' : '#f1f5f9', text: isDark ? '#cbd5e1' : '#475569', border: isDark ? '#334155' : '#cbd5e1' };
  }, [isDark]);

  const getBillingColors = useCallback((cycle: string) => {
    const config = isDark ? BILLING_DARK_COLORS : BILLING_COLORS;
    const key = Object.keys(config).find((k) =>
      cycle.toLowerCase().includes(k.toLowerCase())
    );
    return key ? config[key] : { bg: isDark ? '#1e293b' : '#f8fafc', text: isDark ? '#94a3b8' : '#64748b', border: isDark ? '#334155' : '#f1f5f9' };
  }, [isDark]);

  // Queries & Mutations
  const { data: subsResponse, isLoading, isError, refetch, isRefetching } = useSubscriptionsQuery();
  const { data: plansResponse } = usePlansQuery();
  const assignPlanMutation = useAssignSubscriptionMutation();

  const subscriptions: TenantSubscription[] = useMemo(() => subsResponse?.data ?? [], [subsResponse?.data]);
  const plans = useMemo(() => plansResponse?.data ?? [], [plansResponse?.data]);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all');
  const [selectedBilling, setSelectedBilling] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Applied Filters State
  const [filteredSubs, setFilteredSubs] = useState<TenantSubscription[]>([]);

  useEffect(() => {
    if (subscriptions) {
      setFilteredSubs(subscriptions);
    }
  }, [subscriptions]);

  const handleApplyFilters = useCallback(() => {
    let result = [...subscriptions];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.companyName.toLowerCase().includes(q) ||
          s.planName.toLowerCase().includes(q)
      );
    }

    if (selectedPlanId !== 'all') {
      const planIdNum = parseInt(selectedPlanId, 10);
      result = result.filter((s) => s.planId === planIdNum);
    }

    if (selectedBilling !== 'all') {
      result = result.filter(
        (s) => s.billingCycle.toLowerCase() === selectedBilling.toLowerCase()
      );
    }

    if (fromDate.trim()) {
      try {
        const fDate = new Date(fromDate);
        if (!isNaN(fDate.getTime())) {
          result = result.filter((s) => new Date(s.startDate) >= fDate);
        }
      } catch {}
    }

    if (toDate.trim()) {
      try {
        const tDate = new Date(toDate);
        if (!isNaN(tDate.getTime())) {
          result = result.filter((s) => new Date(s.endDate) <= tDate);
        }
      } catch {}
    }

    setFilteredSubs(result);
  }, [subscriptions, search, selectedPlanId, selectedBilling, fromDate, toDate]);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setSelectedPlanId('all');
    setSelectedBilling('all');
    setFromDate('');
    setToDate('');
    setFilteredSubs(subscriptions);
  }, [subscriptions]);

  // Assign Plan Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTenantForAssign, setSelectedTenantForAssign] = useState<{
    tenantId: number;
    companyName: string;
  } | null>(null);
  const [assignPlanId, setAssignPlanId] = useState<number>(0);
  const [assignBillingCycle, setAssignBillingCycle] = useState('Monthly');

  const openAssignModal = useCallback((sub: TenantSubscription) => {
    setSelectedTenantForAssign({
      tenantId: sub.tenantId,
      companyName: sub.companyName,
    });
    const firstPlan = plans.find((p) => p.isActive);
    setAssignPlanId(firstPlan ? firstPlan.planId : 0);
    setAssignBillingCycle('Monthly');
    setAssignModalOpen(true);
  }, [plans]);

  const handleAssignPlanSubmit = useCallback(() => {
    if (!selectedTenantForAssign || assignPlanId === 0) return;

    assignPlanMutation.mutate(
      {
        tenantId: selectedTenantForAssign.tenantId,
        planId: assignPlanId,
        billingCycle: assignBillingCycle,
      },
      {
        onSuccess: () => {
          setAssignModalOpen(false);
        },
      }
    );
  }, [selectedTenantForAssign, assignPlanId, assignBillingCycle, assignPlanMutation]);

  // Filter Dropdown state helper
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
  const [billingDropdownOpen, setBillingDropdownOpen] = useState(false);

  // Assign Plan Dropdowns
  const [assignPlanDropdownOpen, setAssignPlanDropdownOpen] = useState(false);
  const [assignCycleDropdownOpen, setAssignCycleDropdownOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#1e73be']} />
        }
      >
        <View style={{ margin: 16, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 3, overflow: 'hidden' }}>
          <View style={{ backgroundColor: '#1e73be', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 }}>
              <Ionicons name="card" size={20} color="#fff" />
            </View>
            <View>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>Tenant Subscriptions</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 }}>Manage and provision subscription plans for tenant workspaces</Text>
            </View>
          </View>

          {/* Filter Bar */}
          <View style={{ padding: 16, backgroundColor: filterBarBg, borderBottomWidth: 1, borderBottomColor: borderCol, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, zIndex: 30 }}>
            <View style={{ flex: 1, minWidth: 200, height: 40, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="search-outline" size={16} color={isDark ? '#64748b' : '#94a3b8'} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search tenant..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={{ flex: 1, height: 40, marginLeft: 8, color: textColor, fontSize: 13 }}
              />
            </View>

            {/* Plans Dropdown Filter */}
            <View style={{ position: 'relative', zIndex: 40 }}>
              <TouchableOpacity
                onPress={() => {
                  setPlanDropdownOpen(!planDropdownOpen);
                  setBillingDropdownOpen(false);
                }}
                style={{ height: 40, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minWidth: 130 }}
              >
                <Text style={{ color: textColor, fontSize: 13 }}>
                  {selectedPlanId === 'all'
                    ? 'All Plans'
                    : plans.find((p) => String(p.planId) === selectedPlanId)?.planName || 'Plan'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={isDark ? '#cbd5e1' : '#64748b'} style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              {planDropdownOpen && (
                <View style={{ position: 'absolute', top: 44, left: 0, right: 0, backgroundColor: cardBg, borderWidth: 1, borderColor: borderCol, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, zIndex: 50, paddingVertical: 4 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPlanId('all');
                      setPlanDropdownOpen(false);
                    }}
                    style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                  >
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: '700' }}>All Plans</Text>
                  </TouchableOpacity>
                  {plans.map((p) => (
                    <TouchableOpacity
                      key={p.planId}
                      onPress={() => {
                        setSelectedPlanId(String(p.planId));
                        setPlanDropdownOpen(false);
                      }}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: borderCol }}
                    >
                      <Text style={{ color: textColor, fontSize: 13 }}>{p.planName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Billing Cycle Dropdown Filter */}
            <View style={{ position: 'relative', zIndex: 40 }}>
              <TouchableOpacity
                onPress={() => {
                  setBillingDropdownOpen(!billingDropdownOpen);
                  setPlanDropdownOpen(false);
                }}
                style={{ height: 40, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minWidth: 130 }}
              >
                <Text style={{ color: textColor, fontSize: 13 }}>
                  {selectedBilling === 'all'
                    ? 'All Billing'
                    : selectedBilling}
                </Text>
                <Ionicons name="chevron-down" size={14} color={isDark ? '#cbd5e1' : '#64748b'} style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              {billingDropdownOpen && (
                <View style={{ position: 'absolute', top: 44, left: 0, right: 0, backgroundColor: cardBg, borderWidth: 1, borderColor: borderCol, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, zIndex: 50, paddingVertical: 4 }}>
                  {['All Billing', 'Monthly', 'Annual', 'Trial'].map((b) => (
                    <TouchableOpacity
                      key={b}
                      onPress={() => {
                        setSelectedBilling(b === 'All Billing' ? 'all' : b);
                        setBillingDropdownOpen(false);
                      }}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: borderCol }}
                    >
                      <Text style={{ color: textColor, fontSize: 13 }}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* From Date */}
            <View style={{ height: 40, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', minWidth: 120 }}>
              <TextInput
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="From date"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={{ flex: 1, height: 40, color: textColor, fontSize: 13 }}
              />
              <Ionicons name="calendar-outline" size={14} color={isDark ? '#64748b' : '#94a3b8'} />
            </View>

            {/* To Date */}
            <View style={{ height: 40, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', minWidth: 120 }}>
              <TextInput
                value={toDate}
                onChangeText={setToDate}
                placeholder="To date"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={{ flex: 1, height: 40, color: textColor, fontSize: 13 }}
              />
              <Ionicons name="calendar-outline" size={14} color={isDark ? '#64748b' : '#94a3b8'} />
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleApplyFilters}
                style={{ height: 40, backgroundColor: '#1e73be', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' }}
              >
                <Text style={{ color: '#white', fontWeight: '700', fontSize: 13 }}>Filter</Text>
              </TouchableOpacity>

              {(search || selectedPlanId !== 'all' || selectedBilling !== 'all' || fromDate || toDate) ? (
                <TouchableOpacity
                  onPress={handleResetFilters}
                  style={{ height: 40, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderWidth: 1, borderColor: borderCol, paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' }}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>Reset</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Table Content Container */}
          {isLoading ? (
            <View style={{ paddingVertical: 80, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#1e73be" />
              <Text style={{ color: subTextColor, fontSize: 12, marginTop: 8, fontWeight: '600' }}>Loading subscriptions...</Text>
            </View>
          ) : isError ? (
            <View style={{ paddingVertical: 80, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 14, marginTop: 12 }}>Failed to load subscriptions</Text>
              <TouchableOpacity
                onPress={() => refetch()}
                style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#ef4444', borderRadius: 12 }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredSubs.length === 0 ? (
            <View style={{ paddingVertical: 80, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
              <Ionicons name="cube-outline" size={48} color={isDark ? '#475569' : '#cbd5e1'} />
              <Text style={{ color: subTextColor, fontWeight: '700', fontSize: 14, marginTop: 12 }}>No subscriptions match filters</Text>
            </View>
          ) : (
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={{ zIndex: 10 }}>
              <View style={{ minWidth: 960, flexDirection: 'column' }}>
                <View style={{ backgroundColor: tableHeaderBg, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: borderCol, paddingHorizontal: 16, paddingVertical: 12 }}>
                  <Text style={{ width: '18%', color: subTextColor, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tenant</Text>
                  <Text style={{ width: '12%', color: subTextColor, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>Plan</Text>
                  <Text style={{ width: '12%', color: subTextColor, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>Billing</Text>
                  <Text style={{ width: '12%', color: subTextColor, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>Amount</Text>
                  <Text style={{ width: '15%', color: subTextColor, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>Start Date</Text>
                  <Text style={{ width: '15%', color: subTextColor, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>End Date</Text>
                  <Text style={{ width: '16%', color: subTextColor, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>Actions</Text>
                </View>

                {filteredSubs.map((sub, idx) => {
                  const planColors = getPlanColors(sub.planName);
                  const billingColors = getBillingColors(sub.billingCycle);
                  const isSubExpired = isExpired(sub.endDate);

                  return (
                    <View
                      key={sub.subscriptionId}
                      style={{
                        flexDirection: 'row',
                        paddingVertical: 14,
                        alignItems: 'center',
                        borderBottomWidth: 1,
                        borderBottomColor: borderCol,
                        paddingHorizontal: 16,
                        backgroundColor: idx % 2 === 1 ? (isDark ? '#0f172a' : '#f8fafc') : cardBg,
                      }}
                    >
                      <View style={{ width: '18%' }}>
                        <Text style={{ color: '#1e73be', fontWeight: '700', fontSize: 13 }}>
                          {sub.companyName}
                        </Text>
                      </View>

                      <View style={{ width: '12%', alignItems: 'center' }}>
                        <View
                          style={{ backgroundColor: planColors.bg, borderColor: planColors.border, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20 }}
                        >
                          <Text style={{ color: planColors.text, fontSize: 11, fontWeight: '700' }}>
                            {sub.planName}
                          </Text>
                        </View>
                      </View>

                      <View style={{ width: '12%', alignItems: 'center' }}>
                        <View
                          style={{ backgroundColor: billingColors.bg, borderColor: billingColors.border, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20 }}
                        >
                          <Text style={{ color: billingColors.text, fontSize: 11, fontWeight: '700' }}>
                            {sub.billingCycle}
                          </Text>
                        </View>
                      </View>

                      <View style={{ width: '12%', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: sub.amount > 0 ? '#10b981' : subTextColor }}>
                          {formatPrice(sub.amount)}
                        </Text>
                      </View>

                      <View style={{ width: '15%', alignItems: 'center' }}>
                        <Text style={{ color: textColor, fontSize: 13 }}>
                          {formatDateDDMMYYYY(sub.startDate)}
                        </Text>
                      </View>

                      <View style={{ width: '15%', alignItems: 'center', flexDirection: 'column', gap: 2 }}>
                        <Text style={{ color: textColor, fontSize: 13 }}>
                          {formatDateDDMMYYYY(sub.endDate)}
                        </Text>
                        {isSubExpired && (
                          <View style={{ backgroundColor: isDark ? '#7f1d1d40' : '#fee2e2', borderColor: isDark ? '#7f1d1d' : '#fca5a5', borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text style={{ color: '#ef4444', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Expired</Text>
                          </View>
                        )}
                      </View>

                      <View style={{ width: '16%', alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => openAssignModal(sub)}
                          style={{ backgroundColor: '#f0ad4e', borderColor: '#eea236', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        >
                          <Ionicons name="add-circle" size={12} color="#fff" />
                          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 11 }}>+ Assign Plan</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Assign Plan Modal */}
      <Modal
        visible={assignModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAssignModalOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setAssignModalOpen(false)}
        >
          <View style={{ backgroundColor: modalBg, borderRadius: 24, width: '90%', maxWidth: 450, height: '70%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#1e73be', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16, flex: 1 }}>Assign Subscription Plan</Text>
              <TouchableOpacity onPress={() => setAssignModalOpen(false)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <View>
                <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>Tenant Workspace</Text>
                <View style={{ backgroundColor: staticLabelBg, borderWidth: 1, borderColor: borderCol, borderRadius: 12, padding: 12 }}>
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>
                    {selectedTenantForAssign?.companyName}
                  </Text>
                </View>
              </View>

              <View style={{ position: 'relative', zIndex: 50 }}>
                <Text style={{ color: textColor, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>Choose Plan</Text>
                <TouchableOpacity
                  onPress={() => {
                    setAssignPlanDropdownOpen(!assignPlanDropdownOpen);
                    setAssignCycleDropdownOpen(false);
                  }}
                  style={{ height: 44, borderWidth: 1, borderColor: borderCol, backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>
                    {plans.find((p) => p.planId === assignPlanId)?.planName || 'Select a plan'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
                </TouchableOpacity>

                {assignPlanDropdownOpen && (
                  <View style={{ position: 'absolute', top: 70, left: 0, right: 0, backgroundColor: cardBg, borderWidth: 1, borderColor: borderCol, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4, zIndex: 50, paddingVertical: 6, maxHeight: 160 }}>
                    <ScrollView nestedScrollEnabled={true}>
                      {plans.filter((p) => p.isActive).map((p) => (
                        <TouchableOpacity
                          key={p.planId}
                          onPress={() => {
                            setAssignPlanId(p.planId);
                            setAssignPlanDropdownOpen(false);
                          }}
                          style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: borderCol }}
                        >
                          <Text style={{ color: textColor, fontSize: 14, fontWeight: '500' }}>{p.planName}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={{ position: 'relative', zIndex: 40 }}>
                <Text style={{ color: textColor, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>Billing Cycle</Text>
                <TouchableOpacity
                  onPress={() => {
                    setAssignCycleDropdownOpen(!assignCycleDropdownOpen);
                    setAssignPlanDropdownOpen(false);
                  }}
                  style={{ height: 44, borderWidth: 1, borderColor: borderCol, backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{assignBillingCycle}</Text>
                  <Ionicons name="chevron-down" size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
                </TouchableOpacity>

                {assignCycleDropdownOpen && (
                  <View style={{ position: 'absolute', top: 70, left: 0, right: 0, backgroundColor: cardBg, borderWidth: 1, borderColor: borderCol, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4, zIndex: 50, paddingVertical: 6 }}>
                    {['Monthly', 'Annual', 'Trial'].map((cycle) => (
                      <TouchableOpacity
                        key={cycle}
                        onPress={() => {
                          setAssignBillingCycle(cycle);
                          setAssignCycleDropdownOpen(false);
                        }}
                        style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: borderCol }}
                      >
                        <Text style={{ color: textColor, fontSize: 14, fontWeight: '500' }}>{cycle}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: borderCol, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              <TouchableOpacity
                onPress={() => setAssignModalOpen(false)}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                }}
              >
                <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontWeight: '700', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAssignPlanSubmit}
                disabled={assignPlanMutation.isPending}
                style={{
                  flex: 1,
                  backgroundColor: '#1e73be',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                {assignPlanMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Assign Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
