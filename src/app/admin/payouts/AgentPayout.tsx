import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  Alert,
  Share,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Search,
  X,
  Users,
  ShoppingBag,
  BadgePercent,
  Wallet,
  ChevronDown,
  Check,
  Download,
  Play,
  RotateCcw,
  Eye,
  CheckCircle2,
  FileText,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme, AdminThemeTokens } from '../../../theme/adminTheme';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';
import { useAuthStore } from '../../../auth/store/authStore';
import { usePermissions } from '../../../authorization/hooks/usePermission';
import {
  payoutService,
  AgentPayoutItem,
  AgentPayoutDetailsData,
  AgentPayslipData,
} from '../../../admin/services/payoutService';

const MONTHS: [string, string][] = [
  ['Jan', 'January'], ['Feb', 'February'], ['Mar', 'March'], ['Apr', 'April'], ['May', 'May'], ['Jun', 'June'],
  ['Jul', 'July'], ['Aug', 'August'], ['Sep', 'September'], ['Oct', 'October'], ['Nov', 'November'], ['Dec', 'December'],
];
const STATUSES = ['', 'Pending', 'Approved', 'Processed', 'Paid'];

const inr = (n?: number | null) => `₹${Math.round(n ?? 0).toLocaleString('en-IN')}`;
const days = (n?: number | null) => {
  const v = Number(n ?? 0);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};

// Web status colours, mapped onto the mobile theme
const statusTone = (s: string, t: AdminThemeTokens) =>
  s === 'Paid' ? t.brand : s === 'Processed' || s === 'Approved' ? '#3b82f6' : '#f59e0b';

type Sheet = 'month' | 'year' | 'status' | null;

/* ── Payout card (web row: agent, attendance, sales & commission, base salary, final payout) ── */
const PayoutCard = memo(function PayoutCard({
  p,
  t,
  canManage,
  busy,
  onDetails,
  onPaid,
}: {
  p: AgentPayoutItem;
  t: AdminThemeTokens;
  canManage: boolean;
  busy: boolean;
  onDetails: (p: AgentPayoutItem) => void;
  onPaid: (p: AgentPayoutItem) => void;
}) {
  const tone = statusTone(p.status, t);
  return (
    <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.name, { color: t.textPrimary }]} numberOfLines={1}>
            {p.agentName}
          </Text>
          <View style={[styles.rowCenter, { gap: 6, marginTop: 4 }]}>
            {!!p.agentType && (
              <View style={[styles.pill, { backgroundColor: t.inputBg }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: t.textSecondary }}>{p.agentType}</Text>
              </View>
            )}
            <CalendarDays size={11} color={t.textMuted} />
            <Text style={{ fontSize: 11, color: t.textMuted }}>
              {p.month} {p.year}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: t.textMuted }}>FINAL PAYOUT</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.textPrimary, marginTop: 1 }}>{inr(p.finalPayout)}</Text>
          <View style={[styles.pill, { backgroundColor: `${tone}1A`, marginTop: 4 }]}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: tone }}>{p.status}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.grid, { borderTopColor: t.border }]}>
        <View style={styles.gridCell}>
          <Text style={[styles.label, { color: t.textMuted }]}>ATTENDANCE</Text>
          <Text style={[styles.value, { color: t.textPrimary }]}>
            {days(p.presentDays)} / {p.workingDays} days
          </Text>
          <Text style={[styles.sub, { color: t.textMuted }]}>Absent: {days(p.absentDays ?? Math.max(0, p.workingDays - p.presentDays))}</Text>
          {p.attendanceDeduction > 0 && <Text style={[styles.sub, { color: '#ef4444' }]}>-{inr(p.attendanceDeduction)}</Text>}
        </View>
        <View style={[styles.gridCell, styles.gridDivider, { borderLeftColor: t.border }]}>
          <Text style={[styles.label, { color: t.textMuted }]}>SALES & COMMISSION</Text>
          <Text style={[styles.value, { color: t.textPrimary }]}>{p.totalSales} Sales</Text>
          <Text style={[styles.sub, { color: t.brand }]}>+{inr(p.commissionAmount)}</Text>
        </View>
        <View style={[styles.gridCell, styles.gridDivider, { borderLeftColor: t.border }]}>
          <Text style={[styles.label, { color: t.textMuted }]}>BASE SALARY</Text>
          <Text style={[styles.value, { color: t.textPrimary }]}>{inr(p.baseSalary)}</Text>
        </View>
      </View>

      <View style={[styles.actions, { borderTopColor: t.border }]}>
        <TouchableOpacity onPress={() => onDetails(p)} style={[styles.actionBtn, { backgroundColor: t.inputBg, flex: 1 }]}>
          <Eye size={14} color={t.textPrimary} />
          <Text style={[styles.actionText, { color: t.textPrimary }]}>View Details</Text>
        </TouchableOpacity>
        {canManage && p.status !== 'Paid' && (
          <TouchableOpacity
            onPress={() => onPaid(p)}
            disabled={busy}
            style={[styles.actionBtn, { backgroundColor: t.badgeBg, flex: 1, opacity: busy ? 0.6 : 1 }]}
          >
            {busy ? <ActivityIndicator size="small" color={t.brand} /> : <CheckCircle2 size={14} color={t.brand} />}
            <Text style={[styles.actionText, { color: t.badgeText }]}>Mark as Paid</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

/* ── Screen ───────────────────────────────────────────────────────── */
export default function AgentPayout() {
  const router = useRouter();
  const { isDark } = useTheme();
  const t = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const user = useAuthStore((s) => s.user);
  const { role } = usePermissions();
  const roleLc = (role || user?.role || '').toLowerCase();
  const canManage = roleLc === 'admin' || roleLc === 'partner';
  const qc = useQueryClient();

  const now = new Date();
  const [month, setMonth] = useState<string>(MONTHS[now.getMonth()][0]); // '' = All Months
  const [year, setYear] = useState<number | ''>(now.getFullYear()); // '' = All Years
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [details, setDetails] = useState<AgentPayoutDetailsData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [payslip, setPayslip] = useState<AgentPayslipData | null>(null);
  const [payslipLoading, setPayslipLoading] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const allPeriods = !month || !year;
  const params = useMemo(
    () => ({
      month: month || undefined,
      year: year || undefined,
      search: search || undefined,
      status: status || undefined,
      allPeriods: allPeriods || undefined,
    }),
    [month, year, search, status, allPeriods]
  );

  const queryKey = ['agentPayouts', user?.userId, user?.tenantId, params];
  const { data, isLoading, isError, error, refetch, isRefetching, isFetching } = useQuery({
    queryKey,
    queryFn: () => payoutService.getAgentPayouts(params as any),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const payouts = data?.data ?? [];
  const summary = data?.summary;
  const invalidate = () => qc.invalidateQueries({ queryKey: ['agentPayouts'] });

  const processMut = useMutation({
    mutationFn: () => payoutService.processAgentPayouts({ month, year: Number(year) }),
    onSuccess: (res: any) => {
      Toast.show({ type: res?.success === false ? 'error' : 'success', text1: res?.message || 'Payouts processed successfully' });
      invalidate();
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Process Failed', text2: e?.response?.data?.message || e?.message }),
  });

  const resetMut = useMutation({
    mutationFn: () => payoutService.resetAgentPayoutStatuses(),
    onSuccess: (res: any) => {
      Toast.show({ type: 'success', text1: 'Success!', text2: res?.message });
      invalidate();
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Reset Failed', text2: e?.response?.data?.message || e?.message }),
  });

  const handleProcess = () => {
    if (!month || !year) {
      Toast.show({ type: 'info', text1: 'Select a month and year', text2: 'Payouts are processed for one month at a time.' });
      return;
    }
    const full = MONTHS.find((m) => m[0] === month)?.[1];
    Alert.alert(
      'Process Payouts?',
      `Process payouts for ${full} ${year} for ${data?.eligibleAgents ?? 'all'} approved agent(s)?`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Process', onPress: () => processMut.mutate() }]
    );
  };

  const handleReset = () =>
    Alert.alert('Reset Statuses?', 'All payouts that are not Paid will be set back to Pending.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, reset!', style: 'destructive', onPress: () => resetMut.mutate() },
    ]);

  const markPaid = useCallback(
    (p: AgentPayoutItem) =>
      Alert.alert('Mark as Paid?', `Mark ${p.agentName}'s payout of ${inr(p.finalPayout)} as Paid?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: async () => {
            try {
              setBusyId(p.payoutId);
              const res = await payoutService.updateAgentPayoutStatus({ payoutId: p.payoutId, status: 'Paid' });
              Toast.show({ type: 'success', text1: res?.message || 'Status updated successfully' });
              invalidate();
            } catch (e: any) {
              Toast.show({ type: 'error', text1: 'Update Failed', text2: e?.response?.data?.message || e?.message });
            } finally {
              setBusyId(null);
            }
          },
        },
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const openDetails = useCallback(async (p: AgentPayoutItem) => {
    setDetailsLoading(true);
    setDetails(null);
    try {
      const full = MONTHS.find((m) => m[0] === p.month || m[1] === p.month)?.[1] ?? p.month;
      const res = await payoutService.getAgentPayoutDetails(p.agentId, { month: full, year: p.year });
      setDetails(res);
      // Details recalculates live attendance on the server (web parity) — refresh the list values
      qc.invalidateQueries({ queryKey: ['agentPayouts'] });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message || 'Unable to load payout details' });
    } finally {
      setDetailsLoading(false);
    }
  }, [qc]);

  const openPayslip = async () => {
    if (!details) return;
    setPayslipLoading(true);
    try {
      const res = await payoutService.getAgentPayslip({
        agentId: details.payout.agentId,
        month: details.payout.month,
        year: details.payout.year,
      });
      setPayslip(res);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message || 'Unable to load payslip' });
    } finally {
      setPayslipLoading(false);
    }
  };

  const handleExport = async () => {
    if (!payouts.length) {
      Toast.show({ type: 'info', text1: 'No payouts to export' });
      return;
    }
    const header = 'Agent,Type,Month,Year,Present Days,Working Days,Absent Days,Attendance Deduction,Total Sales,Commission,Base Salary,Final Payout,Status\n';
    const rows = payouts
      .map((p) => `"${p.agentName}","${p.agentType}","${p.month}",${p.year},${days(p.presentDays)},${p.workingDays},${days(p.absentDays)},${p.attendanceDeduction},${p.totalSales},${p.commissionAmount},${p.baseSalary},${p.finalPayout},"${p.status}"`)
      .join('\n');
    try {
      await Share.share({ title: `Agent_Payouts_${month || 'All'}_${year || 'All'}.csv`, message: header + rows });
    } catch {}
  };

  const yearOptions = useMemo(() => {
    const y = now.getFullYear();
    return ['', ...Array.from({ length: 6 }, (_, i) => y - i)] as (number | '')[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sheetOptions: { label: string; selected: boolean; onPick: () => void }[] =
    sheet === 'month'
      ? [['', 'All Months'] as [string, string], ...MONTHS].map(([v, l]) => ({ label: l, selected: month === v, onPick: () => setMonth(v) }))
      : sheet === 'year'
      ? yearOptions.map((y) => ({ label: y === '' ? 'All Years' : String(y), selected: year === y, onPick: () => setYear(y) }))
      : sheet === 'status'
      ? STATUSES.map((s) => ({ label: s || 'All Status', selected: status === s, onPick: () => setStatus(s) }))
      : [];

  const hasFilters = !!(search || status) || month !== MONTHS[now.getMonth()][0] || year !== now.getFullYear();
  const clearFilters = () => {
    setMonth(MONTHS[now.getMonth()][0]);
    setYear(now.getFullYear());
    setStatus('');
    setSearchInput('');
    setSearch('');
  };

  const stats = [
    { label: 'Total Agents', value: String(summary?.totalAgents ?? 0), icon: Users },
    { label: 'Total Sales', value: String(summary?.totalSales ?? 0), icon: ShoppingBag },
    { label: 'Commission', value: inr(summary?.totalCommission), icon: BadgePercent },
    { label: 'Total Payouts', value: inr(summary?.totalPayouts), icon: Wallet },
  ];

  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={[styles.chip, { backgroundColor: active ? t.badgeBg : t.cardBg, borderColor: active ? t.brand : t.border }]}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: active ? t.badgeText : t.textPrimary }}>{label}</Text>
      <ChevronDown size={13} color={active ? t.brand : t.textSecondary} />
    </TouchableOpacity>
  );

  const Header = (
    <View style={{ gap: 14, marginBottom: 12 }}>
      {canManage && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={handleProcess}
            disabled={processMut.isPending}
            style={[styles.bigBtn, { flex: 1, backgroundColor: t.brand, opacity: processMut.isPending ? 0.7 : 1 }]}
          >
            {processMut.isPending ? <ActivityIndicator color="#fff" /> : <Play size={15} color="#fff" />}
            <Text style={styles.bigBtnText}>Process Payouts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleReset}
            disabled={resetMut.isPending}
            style={[styles.bigBtn, { borderWidth: 1, borderColor: t.border, backgroundColor: t.cardBg }]}
          >
            {resetMut.isPending ? <ActivityIndicator color={t.textPrimary} /> : <RotateCcw size={15} color={t.textPrimary} />}
            <Text style={[styles.bigBtnText, { color: t.textPrimary }]}>Reset Statuses</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <View key={s.label} style={[styles.stat, { backgroundColor: t.cardBg, borderColor: t.border }]}>
              <View style={[styles.statIcon, { backgroundColor: t.badgeBg }]}>
                <Icon size={15} color={t.brand} />
              </View>
              <Text style={[styles.statValue, { color: t.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: t.textSecondary }]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }} style={{ marginHorizontal: -16, paddingLeft: 16 }}>
        <Chip label={MONTHS.find((m) => m[0] === month)?.[1] ?? 'All Months'} active={!!month} onPress={() => setSheet('month')} />
        <Chip label={year ? String(year) : 'All Years'} active={!!year} onPress={() => setSheet('year')} />
        <Chip label={status || 'All Status'} active={!!status} onPress={() => setSheet('status')} />
      </ScrollView>

      <View style={styles.rowBetween}>
        <View style={[styles.rowCenter, { gap: 8 }]}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>Payouts</Text>
          <View style={[styles.countChip, { backgroundColor: t.badgeBg }]}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: t.badgeText }}>{payouts.length}</Text>
          </View>
          {isFetching && !isRefetching && <ActivityIndicator size="small" color={t.brand} />}
        </View>
        {hasFilters && (
          <TouchableOpacity onPress={clearFilters} hitSlop={8}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.brand }}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const Empty = isLoading ? (
    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
      <ActivityIndicator size="large" color={t.brand} />
      <Text style={{ marginTop: 10, color: t.textSecondary, fontSize: 13 }}>Loading payouts...</Text>
    </View>
  ) : isError ? (
    <View style={[styles.empty, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <ShieldAlert size={32} color="#ef4444" />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>Couldn't load payouts</Text>
      <Text style={{ fontSize: 12, color: t.textSecondary, textAlign: 'center' }}>
        {(error as any)?.response?.data?.message || (error as any)?.message}
      </Text>
    </View>
  ) : (
    <View style={[styles.empty, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <Wallet size={32} color={t.textMuted} />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No payouts found</Text>
      <Text style={{ fontSize: 12, color: t.textSecondary, textAlign: 'center' }}>
        {canManage ? 'Select a month and tap Process Payouts to generate them.' : 'No payouts for the selected period.'}
      </Text>
    </View>
  );

  const d = details?.payout;
  const presentRecs = details?.attendanceSummary.attendanceRecords ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: t.primaryBg }}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: t.cardBg, borderBottomColor: t.border }]}>
        <View style={[styles.rowCenter, { gap: 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: t.inputBg }]} hitSlop={6}>
            <ArrowLeft size={18} color={t.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: t.textPrimary }}>Agent Payouts</Text>
            <Text style={{ fontSize: 12, color: t.textSecondary }}>Manage agent salaries and commissions</Text>
          </View>
          <TouchableOpacity onPress={handleExport} style={[styles.iconBtn, { backgroundColor: t.inputBg }]} hitSlop={6}>
            <Download size={17} color={t.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={[styles.search, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <Search size={16} color={t.textSecondary} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search by agent name..."
            placeholderTextColor={t.textMuted}
            style={{ flex: 1, color: t.textPrimary, fontSize: 14, paddingVertical: 0 }}
          />
          {searchInput !== '' && (
            <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={8}>
              <X size={16} color={t.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={isLoading || isError ? [] : payouts}
        keyExtractor={(p) => String(p.payoutId)}
        renderItem={({ item }) => (
          <PayoutCard p={item} t={t} canManage={canManage} busy={busyId === item.payoutId} onDetails={openDetails} onPaid={markPaid} />
        )}
        ListHeaderComponent={Header}
        ListEmptyComponent={Empty}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomSpacing + 20, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[t.brand]} tintColor={t.brand} />}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        windowSize={7}
      />

      {/* Filter sheet */}
      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <View style={styles.overlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheet(null)} />
          <View style={[styles.sheet, { backgroundColor: t.cardBg }]}>
            <View style={[styles.handle, { backgroundColor: t.border }]} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary, marginBottom: 8 }}>
              {sheet === 'month' ? 'Month' : sheet === 'year' ? 'Year' : 'Status'}
            </Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {sheetOptions.map((o) => (
                <TouchableOpacity
                  key={o.label}
                  onPress={() => { o.onPick(); setSheet(null); }}
                  style={[styles.option, o.selected && { backgroundColor: t.badgeBg }]}
                >
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: o.selected ? '700' : '500', color: o.selected ? t.badgeText : t.textPrimary }}>
                    {o.label}
                  </Text>
                  {o.selected && <Check size={16} color={t.brand} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Details sheet (web Details page) */}
      <Modal visible={!!details || detailsLoading} transparent animationType="slide" onRequestClose={() => setDetails(null)}>
        <View style={styles.overlay}>
          <Pressable style={{ flex: 1 }} onPress={() => { setDetails(null); setDetailsLoading(false); }} />
          <View style={[styles.sheet, { backgroundColor: t.cardBg, maxHeight: '88%' }]}>
            <View style={[styles.handle, { backgroundColor: t.border }]} />
            {detailsLoading || !d ? (
              <ActivityIndicator color={t.brand} style={{ marginVertical: 40 }} />
            ) : (
              <>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: t.textPrimary }}>{d.agentName}</Text>
                    <Text style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
                      {d.agentType} · {d.month} {d.year}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetails(null)} hitSlop={8}>
                    <X size={20} color={t.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ marginTop: 14 }} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
                  {/* Breakdown */}
                  <View style={[styles.box, { backgroundColor: t.inputBg }]}>
                    {[
                      ['Base Salary', inr(d.baseSalary), t.textPrimary],
                      ['Attendance Deduction', `-${inr(d.attendanceDeduction)}`, '#ef4444'],
                      ['Commission', `+${inr(d.commissionAmount)}`, t.brand],
                    ].map(([l, v, c]) => (
                      <View key={l} style={[styles.rowBetween, { paddingVertical: 5 }]}>
                        <Text style={{ fontSize: 13, color: t.textSecondary }}>{l}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: c }}>{v}</Text>
                      </View>
                    ))}
                    <View style={[styles.rowBetween, { borderTopWidth: 1, borderTopColor: t.border, paddingTop: 10, marginTop: 6 }]}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>Final Payout</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: t.textPrimary }}>{inr(d.finalPayout)}</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: `${statusTone(d.status, t)}1A`, alignSelf: 'flex-end', marginTop: 6 }]}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: statusTone(d.status, t) }}>{d.status}</Text>
                    </View>
                  </View>

                  {/* Attendance */}
                  <Text style={[styles.label, { color: t.textMuted }]}>ATTENDANCE SUMMARY</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[
                      ['Working Days', String(details!.attendanceSummary.workingDays)],
                      ['Present', days(details!.attendanceSummary.presentEquivalentDays)],
                      ['Absent', days(details!.attendanceSummary.absentEquivalentDays)],
                    ].map(([l, v]) => (
                      <View key={l} style={[styles.miniStat, { borderColor: t.border }]}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: t.textPrimary }}>{v}</Text>
                        <Text style={{ fontSize: 11, color: t.textMuted }}>{l}</Text>
                      </View>
                    ))}
                  </View>
                  {presentRecs.length > 0 && (
                    <View style={styles.dayGrid}>
                      {presentRecs.map((r) => {
                        const ok = r.status === 'Present';
                        const half = r.status === 'Half Day' || r.status === 'HalfDay';
                        const c = ok ? t.brand : half ? '#f59e0b' : '#ef4444';
                        return (
                          <View key={r.date} style={[styles.dayCell, { backgroundColor: `${c}1A` }]}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: c }}>{Number(r.date.slice(8, 10))}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Commission logs */}
                  <Text style={[styles.label, { color: t.textMuted }]}>COMMISSION ({details!.commissionLogs.length})</Text>
                  {details!.commissionLogs.length === 0 ? (
                    <Text style={{ fontSize: 12, color: t.textMuted }}>No commission for this month.</Text>
                  ) : (
                    details!.commissionLogs.map((c) => (
                      <View key={c.logId} style={[styles.rowBetween, styles.logRow, { borderColor: t.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary }} numberOfLines={1}>
                            {c.propertyName}{c.flatName && c.flatName !== 'N/A' ? ` · ${c.flatName}` : ''}
                          </Text>
                          <Text style={{ fontSize: 11, color: t.textMuted }}>
                            {c.saleDate}
                            {c.saleAmount ? ` · Sale ${inr(c.saleAmount)}` : ''}
                            {c.commissionPercentage ? ` · ${c.commissionPercentage}%` : ''}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: t.brand }}>+{inr(c.commissionAmount)}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>

                <TouchableOpacity onPress={openPayslip} disabled={payslipLoading} style={[styles.bigBtn, { backgroundColor: t.brand, marginTop: 12 }]}>
                  {payslipLoading ? <ActivityIndicator color="#fff" /> : <FileText size={15} color="#fff" />}
                  <Text style={styles.bigBtnText}>View Payslip</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Payslip */}
      <Modal visible={!!payslip} transparent animationType="fade" onRequestClose={() => setPayslip(null)}>
        <View style={[styles.overlay, { justifyContent: 'center', padding: 20 }]}>
          <View style={[styles.payslip, { backgroundColor: t.cardBg }]}>
            <View style={styles.rowBetween}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: t.textPrimary }}>Payslip</Text>
              <TouchableOpacity onPress={() => setPayslip(null)} hitSlop={8}>
                <X size={20} color={t.textSecondary} />
              </TouchableOpacity>
            </View>
            {payslip && (
              <>
                <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 4 }}>
                  {payslip.agentName} · {payslip.designation} · {payslip.month} {payslip.year}
                </Text>
                <Text style={[styles.label, { color: t.textMuted, marginTop: 16 }]}>EARNINGS</Text>
                {[
                  ['Base Salary', payslip.earnings.baseSalary],
                  ['Commission Earned', payslip.earnings.commissionEarned],
                  ['Gross Earnings', payslip.earnings.grossEarnings],
                ].map(([l, v]) => (
                  <View key={l as string} style={[styles.rowBetween, { paddingVertical: 5 }]}>
                    <Text style={{ fontSize: 13, color: t.textSecondary }}>{l}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: t.textPrimary }}>{inr(v as number)}</Text>
                  </View>
                ))}
                <Text style={[styles.label, { color: t.textMuted, marginTop: 12 }]}>DEDUCTIONS</Text>
                <View style={[styles.rowBetween, { paddingVertical: 5 }]}>
                  <Text style={{ fontSize: 13, color: t.textSecondary }}>Attendance Deduction</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>-{inr(payslip.deductions.attendanceDeduction)}</Text>
                </View>
                <View style={[styles.rowBetween, { borderTopWidth: 1, borderTopColor: t.border, paddingTop: 12, marginTop: 8 }]}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>Net Salary</Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: t.brand }}>{inr(payslip.netSalary)}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  search: { height: 42, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },

  bigBtn: { height: 44, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bigBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  stat: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 14, borderWidth: 1 },
  statIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 34, borderRadius: 17, borderWidth: 1 },
  countChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },

  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  name: { fontSize: 15, fontWeight: '700' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  grid: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  gridCell: { flex: 1, paddingHorizontal: 4 },
  gridDivider: { borderLeftWidth: 1, paddingLeft: 10 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  value: { fontSize: 13, fontWeight: '700', marginTop: 3 },
  sub: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  actionBtn: { height: 36, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '700' },

  empty: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 },
  box: { borderRadius: 14, padding: 14 },
  miniStat: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayCell: { width: 34, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logRow: { paddingVertical: 10, borderBottomWidth: 1 },
  payslip: { borderRadius: 20, padding: 20 },
});
