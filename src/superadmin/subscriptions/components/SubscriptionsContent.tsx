import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  FlatList,
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

// ─── Lightweight inline date picker ───────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface DatePickerModalProps {
  visible: boolean;
  title: string;
  initialValue: string; // ISO yyyy-mm-dd or ''
  isDark: boolean;
  onConfirm: (isoDate: string) => void;
  onCancel: () => void;
}

function DatePickerModal({ visible, title, initialValue, isDark, onConfirm, onCancel }: DatePickerModalProps) {
  const now = new Date();
  const init = initialValue ? new Date(initialValue) : now;
  const [day, setDay] = useState(init.getDate());
  const [month, setMonth] = useState(init.getMonth()); // 0-indexed
  const [year, setYear] = useState(init.getFullYear());

  useEffect(() => {
    if (visible) {
      const d = initialValue ? new Date(initialValue) : new Date();
      setDay(d.getDate()); setMonth(d.getMonth()); setYear(d.getFullYear());
    }
  }, [visible, initialValue]);

  const YEARS = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const bg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subText = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const selBg = isDark ? '#0f172a' : '#eff6ff';

  function Column<T extends number | string>({
    items, selected, onSelect, label,
  }: { items: T[]; selected: T; onSelect: (v: T) => void; label: string }) {
    return (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ color: subText, fontSize: 10, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
        <View style={{ height: 200, width: '100%', overflow: 'hidden', borderRadius: 10, borderWidth: 1, borderColor: border }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
            {items.map((item) => (
              <TouchableOpacity
                key={String(item)}
                onPress={() => onSelect(item)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  backgroundColor: item === selected ? selBg : 'transparent',
                  alignItems: 'center',
                  borderRadius: 8,
                  marginHorizontal: 4,
                  marginVertical: 1,
                }}
              >
                <Text style={{ color: item === selected ? '#1e73be' : textColor, fontWeight: item === selected ? '700' : '400', fontSize: 14 }}>
                  {typeof item === 'number' ? String(item).padStart(2, '0') : item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }} onPress={onCancel}>
        <Pressable style={{ width: '100%', maxWidth: 360, backgroundColor: bg, borderRadius: 20, padding: 20 }} onPress={(e) => e.stopPropagation()}>
          <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginBottom: 16, textAlign: 'center' }}>{title}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Column items={DAYS} selected={Math.min(day, daysInMonth)} onSelect={setDay} label="Day" />
            <Column items={MONTHS} selected={MONTHS[month]} onSelect={(v) => setMonth(MONTHS.indexOf(v))} label="Month" />
            <Column items={YEARS} selected={year} onSelect={setYear} label="Year" />
          </View>
          <Text style={{ color: '#1e73be', fontWeight: '700', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
            {String(Math.min(day, daysInMonth)).padStart(2,'0')}/{String(month + 1).padStart(2,'0')}/{year}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity onPress={onCancel} style={{ flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: border, alignItems: 'center' }}>
              <Text style={{ color: subText, fontWeight: '700', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const d = Math.min(day, daysInMonth);
                const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                onConfirm(iso);
              }}
              style={{ flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: '#1e73be', alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

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
  const [fromDate, setFromDate] = useState(''); // ISO yyyy-mm-dd
  const [toDate, setToDate] = useState('');     // ISO yyyy-mm-dd
  const [datePickerOpen, setDatePickerOpen] = useState<'from' | 'to' | null>(null);

  function displayDate(iso: string) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

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
        {/* Title Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ backgroundColor: '#1e73be', padding: 10, borderRadius: 12 }}>
            <Ionicons name="card" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textColor, fontWeight: '800', fontSize: 18 }}>Tenant Subscriptions</Text>
            <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2 }}>Manage and provision subscription plans for tenant workspaces</Text>
          </View>
        </View>

        {/* Filter Card Container */}
        <View style={{ marginHorizontal: 16, marginVertical: 12, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Ionicons name="filter" size={16} color="#1e73be" />
            <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>Search & Filters</Text>
          </View>

          <View style={{ gap: 10 }}>
            {/* Search Input */}
            <View style={{ height: 40, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="search-outline" size={16} color={isDark ? '#64748b' : '#94a3b8'} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search tenant..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                style={{ flex: 1, height: 40, marginLeft: 8, color: textColor, fontSize: 13 }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, zIndex: 40 }}>
              {/* Plans Dropdown Filter */}
              <View style={{ flex: 1, position: 'relative' }}>
                <TouchableOpacity
                  onPress={() => {
                    setPlanDropdownOpen(!planDropdownOpen);
                    setBillingDropdownOpen(false);
                  }}
                  style={{ height: 40, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ color: textColor, fontSize: 13 }} numberOfLines={1}>
                    {selectedPlanId === 'all'
                      ? 'All Plans'
                      : plans.find((p) => String(p.planId) === selectedPlanId)?.planName || 'Plan'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={isDark ? '#cbd5e1' : '#64748b'} />
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
              <View style={{ flex: 1, position: 'relative', zIndex: 40 }}>
                <TouchableOpacity
                  onPress={() => {
                    setBillingDropdownOpen(!billingDropdownOpen);
                    setPlanDropdownOpen(false);
                  }}
                  style={{ height: 40, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ color: textColor, fontSize: 13 }} numberOfLines={1}>
                    {selectedBilling === 'all'
                      ? 'All Billing'
                      : selectedBilling}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={isDark ? '#cbd5e1' : '#64748b'} />
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
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* From Date Picker Button */}
              <TouchableOpacity
                onPress={() => setDatePickerOpen('from')}
                style={{ flex: 1, height: 40, backgroundColor: fromDate ? (isDark ? '#1e3a8a30' : '#eff6ff') : inputBg, borderWidth: 1, borderColor: fromDate ? '#1e73be' : inputBorder, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Ionicons name="calendar-outline" size={14} color={fromDate ? '#1e73be' : (isDark ? '#64748b' : '#94a3b8')} />
                <Text style={{ color: fromDate ? '#1e73be' : (isDark ? '#64748b' : '#94a3b8'), fontSize: 13, fontWeight: fromDate ? '600' : '400' }} numberOfLines={1}>
                  {fromDate ? displayDate(fromDate) : 'From date'}
                </Text>
                {fromDate ? (
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); setFromDate(''); }} style={{ marginLeft: 'auto' }}>
                    <Ionicons name="close-circle" size={14} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>

              {/* To Date Picker Button */}
              <TouchableOpacity
                onPress={() => setDatePickerOpen('to')}
                style={{ flex: 1, height: 40, backgroundColor: toDate ? (isDark ? '#1e3a8a30' : '#eff6ff') : inputBg, borderWidth: 1, borderColor: toDate ? '#1e73be' : inputBorder, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Ionicons name="calendar-outline" size={14} color={toDate ? '#1e73be' : (isDark ? '#64748b' : '#94a3b8')} />
                <Text style={{ color: toDate ? '#1e73be' : (isDark ? '#64748b' : '#94a3b8'), fontSize: 13, fontWeight: toDate ? '600' : '400' }} numberOfLines={1}>
                  {toDate ? displayDate(toDate) : 'To date'}
                </Text>
                {toDate ? (
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); setToDate(''); }} style={{ marginLeft: 'auto' }}>
                    <Ionicons name="close-circle" size={14} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                onPress={handleApplyFilters}
                style={{ flex: 1, height: 40, backgroundColor: '#1e73be', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Filter</Text>
              </TouchableOpacity>

              {(search || selectedPlanId !== 'all' || selectedBilling !== 'all' || fromDate || toDate) ? (
                <TouchableOpacity
                  onPress={handleResetFilters}
                  style={{ height: 40, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderWidth: 1, borderColor: borderCol, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>Reset</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* Subscriptions List */}
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
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {filteredSubs.map((sub) => {
              const planColors = getPlanColors(sub.planName);
              const billingColors = getBillingColors(sub.billingCycle);
              const isSubExpired = isExpired(sub.endDate);
              const initials = sub.companyName
                ? sub.companyName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                : 'T';

              return (
                <View
                  key={sub.subscriptionId}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: borderCol,
                    padding: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.2 : 0.015,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  {/* Row 1: Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e73be15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e73be30' }}>
                      <Text style={{ color: '#1e73be', fontWeight: '700', fontSize: 15 }}>
                        {initials}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontWeight: '700', fontSize: 15 }}>{sub.companyName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        {/* Plan Tag */}
                        <View style={{ backgroundColor: planColors.bg, borderColor: planColors.border, borderWidth: 0.5, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 20 }}>
                          <Text style={{ color: planColors.text, fontSize: 10, fontWeight: '700' }}>
                            {sub.planName}
                          </Text>
                        </View>
                        {/* Billing Tag */}
                        <View style={{ backgroundColor: billingColors.bg, borderColor: billingColors.border, borderWidth: 0.5, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 20 }}>
                          <Text style={{ color: billingColors.text, fontSize: 10, fontWeight: '700' }}>
                            {sub.billingCycle}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Amount */}
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: sub.amount > 0 ? '#10b981' : subTextColor }}>
                        {formatPrice(sub.amount)}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: Dates Grid */}
                  <View style={{ flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: borderCol, paddingTop: 12, marginTop: 4 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>Start Date</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="calendar-outline" size={12} color={subTextColor} />
                        <Text style={{ color: textColor, fontSize: 12, fontWeight: '500' }}>
                          {formatDateDDMMYYYY(sub.startDate)}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>End Date</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="calendar-outline" size={12} color={isSubExpired ? '#ef4444' : subTextColor} />
                        <Text style={{ color: isSubExpired ? '#ef4444' : textColor, fontSize: 12, fontWeight: '500' }}>
                          {formatDateDDMMYYYY(sub.endDate)}
                        </Text>
                        {isSubExpired && (
                          <View style={{ backgroundColor: isDark ? '#7f1d1d40' : '#fee2e2', borderColor: isDark ? '#7f1d1d' : '#fca5a5', borderWidth: 0.5, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                            <Text style={{ color: '#ef4444', fontSize: 8, fontWeight: '700', textTransform: 'uppercase' }}>Expired</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Row 3: Action Button */}
                  <TouchableOpacity
                    onPress={() => openAssignModal(sub)}
                    style={{
                      backgroundColor: '#1e73be',
                      paddingVertical: 10,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      marginTop: 14
                    }}
                  >
                    <Ionicons name="create-outline" size={14} color="#fff" />
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>
                      Assign Subscription Plan
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
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
      {/* Date Picker Modals */}
      <DatePickerModal
        visible={datePickerOpen === 'from'}
        title="Select From Date"
        initialValue={fromDate}
        isDark={isDark}
        onConfirm={(iso) => { setFromDate(iso); setDatePickerOpen(null); }}
        onCancel={() => setDatePickerOpen(null)}
      />
      <DatePickerModal
        visible={datePickerOpen === 'to'}
        title="Select To Date"
        initialValue={toDate}
        isDark={isDark}
        onConfirm={(iso) => { setToDate(iso); setDatePickerOpen(null); }}
        onCancel={() => setDatePickerOpen(null)}
      />
    </View>
  );
}
