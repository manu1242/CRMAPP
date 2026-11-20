import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Search,
  X,
  Users,
  Briefcase,
  TrendingUp,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Mail,
  Download,
  ShieldAlert,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme, AdminThemeTokens } from '../../../theme/adminTheme';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';
import { useAuthStore } from '../../../auth/store/authStore';
import { attendanceService, AgentOverviewItem } from '../../../Services/attendanceService';

const PAGE_SIZE = 10;

// Web cards show the agent type (Salary / Commission / Hybrid) as the role
const ROLES = [
  { label: 'All Roles', value: '' },
  { label: 'Salary', value: 'Salary' },
  { label: 'Commission', value: 'Commission' },
  { label: 'Hybrid', value: 'Hybrid' },
];

const PERFORMANCE = [
  { label: 'All Performance', value: '' },
  { label: 'Excellent (90%+)', value: 'excellent' },
  { label: 'Good (75-89%)', value: 'good' },
  { label: 'Average (60-74%)', value: 'average' },
  { label: 'Poor (<60%)', value: 'poor' },
];

// Web From/To filter = agent join date range
type JoinRange = '' | 'month' | '3m' | 'year';
const JOIN_RANGES: { label: string; value: JoinRange }[] = [
  { label: 'Any join date', value: '' },
  { label: 'Joined this month', value: 'month' },
  { label: 'Joined last 3 months', value: '3m' },
  { label: 'Joined this year', value: 'year' },
];

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const joinRangeDates = (r: JoinRange): { fromDate?: string; toDate?: string } => {
  const now = new Date();
  if (r === 'month') return { fromDate: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), toDate: ymd(now) };
  if (r === '3m') return { fromDate: ymd(new Date(now.getFullYear(), now.getMonth() - 2, 1)), toDate: ymd(now) };
  if (r === 'year') return { fromDate: ymd(new Date(now.getFullYear(), 0, 1)), toDate: ymd(now) };
  return {};
};

// Web thresholds: Excellent ≥90, Good ≥75, Average ≥60, else Poor
const perfTone = (key: string, t: AdminThemeTokens) =>
  key === 'excellent' || key === 'good' ? t.brand : key === 'average' ? '#f59e0b' : '#ef4444';

type Sheet = 'month' | 'role' | 'perf' | 'join' | null;

/* ── Agent card ───────────────────────────────────────────────────── */
const AgentCard = memo(function AgentCard({
  a,
  t,
  onOpen,
}: {
  a: AgentOverviewItem;
  t: AdminThemeTokens;
  onOpen: (a: AgentOverviewItem) => void;
}) {
  const rate = Math.min(100, Math.max(0, a.attendancePercentage || 0));
  const tone = perfTone(a.performanceKey, t);
  const initials = (a.username || 'AG')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onOpen(a)}
      style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}
    >
      <View style={styles.rowCenter}>
        <View style={[styles.avatar, { backgroundColor: t.badgeBg }]}>
          {a.profileImage ? (
            <Image source={{ uri: a.profileImage }} style={styles.avatarImg} />
          ) : (
            <Text style={{ color: t.badgeText, fontSize: 14, fontWeight: '800' }}>{initials}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: t.textPrimary }]} numberOfLines={1}>
            {a.username}
          </Text>
          <View style={[styles.rowCenter, { gap: 6, marginTop: 3 }]}>
            <View style={[styles.rolePill, { backgroundColor: t.inputBg }]}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: t.textSecondary }}>{a.role || 'Agent'}</Text>
            </View>
            {!!a.email && (
              <View style={[styles.rowCenter, { gap: 4, flex: 1 }]}>
                <Mail size={11} color={t.textMuted} />
                <Text style={{ fontSize: 11, color: t.textMuted, flex: 1 }} numberOfLines={1}>
                  {a.email}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.perfPill, { backgroundColor: `${tone}1A` }]}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: tone }}>{a.performance}</Text>
        </View>
      </View>

      {/* Attendance rate */}
      <View style={[styles.rowBetween, { marginTop: 14 }]}>
        <Text style={[styles.smallLabel, { color: t.textMuted }]}>ATTENDANCE RATE</Text>
        <Text style={{ fontSize: 14, fontWeight: '800', color: t.textPrimary }}>{rate.toFixed(1)}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: t.inputBg }]}>
        <View style={[styles.fill, { width: `${rate}%`, backgroundColor: tone }]} />
      </View>

      {/* Present / Absent / Total */}
      <View style={[styles.countsRow, { borderTopColor: t.border }]}>
        {[
          { label: 'Present', value: a.presentDays },
          { label: 'Absent', value: a.absentDays },
          { label: 'Total', value: a.workingDays },
        ].map((c, i) => (
          <View key={c.label} style={[styles.countCell, i > 0 && { borderLeftWidth: 1, borderLeftColor: t.border }]}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: t.textPrimary }}>{c.value}</Text>
            <Text style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>{c.label}</Text>
          </View>
        ))}
        <View style={[styles.calBtn, { backgroundColor: t.badgeBg }]}>
          <CalendarDays size={15} color={t.brand} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

/* ── Screen ───────────────────────────────────────────────────────── */
export default function AgentAttendance() {
  const router = useRouter();
  const { isDark } = useTheme();
  const t = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const user = useAuthStore((s) => s.user);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [perf, setPerf] = useState('');
  const [join, setJoin] = useState<JoinRange>('');
  const [page, setPage] = useState(1);
  const [sheet, setSheet] = useState<Sheet>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      search: search || undefined,
      role: role || undefined,
      performance: perf || undefined,
      year,
      month,
      ...joinRangeDates(join),
      page,
      pageSize: PAGE_SIZE,
    }),
    [search, role, perf, year, month, join, page]
  );

  const { data, isLoading, isError, error, refetch, isRefetching, isFetching } = useQuery({
    queryKey: ['agentAttendanceOverview', user?.userId, user?.tenantId, params],
    queryFn: () => attendanceService.getAgentOverview(params).then((r) => r.data),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const stats = data?.headerStats;
  const agents = data?.agents ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = !!(search || role || perf || join);

  const monthOptions = useMemo(() => {
    const list: { label: string; year: number; month: number }[] = [];
    const base = new Date();
    for (let i = 0; i < 18; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      list.push({ label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }), year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return list;
  }, []);

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setRole('');
    setPerf('');
    setJoin('');
    setPage(1);
  };

  const openCalendar = useCallback(
    (a: AgentOverviewItem) =>
      router.push({
        pathname: '/admin/attendance/AgentCalender',
        params: { agentId: a.encodedAgentId || String(a.userId ?? a.agentId), month: String(month), year: String(year) },
      } as any),
    [router, month, year]
  );

  const handleExport = async () => {
    if (!agents.length) {
      Toast.show({ type: 'info', text1: 'No Records', text2: 'No agent attendance records to export.' });
      return;
    }
    const header = 'Agent Name,Email,Role,Present Days,Absent Days,Working Days,Attendance %,Performance\n';
    const rows = agents
      .map((a) => `"${a.username}","${a.email}","${a.role}",${a.presentDays},${a.absentDays},${a.workingDays},"${a.attendancePercentage.toFixed(1)}%","${a.performance}"`)
      .join('\n');
    try {
      await Share.share({ title: `Agent_Attendance_${year}_${month}.csv`, message: header + rows });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Export Error', text2: e?.message || 'Failed to export.' });
    }
  };

  const sheetOptions: { label: string; selected: boolean; onPick: () => void }[] =
    sheet === 'month'
      ? monthOptions.map((m) => ({
          label: m.label,
          selected: m.year === year && m.month === month,
          onPick: () => { setYear(m.year); setMonth(m.month); setPage(1); },
        }))
      : sheet === 'role'
      ? ROLES.map((r) => ({ label: r.label, selected: role === r.value, onPick: () => { setRole(r.value); setPage(1); } }))
      : sheet === 'perf'
      ? PERFORMANCE.map((p) => ({ label: p.label, selected: perf === p.value, onPick: () => { setPerf(p.value); setPage(1); } }))
      : sheet === 'join'
      ? JOIN_RANGES.map((j) => ({ label: j.label, selected: join === j.value, onPick: () => { setJoin(j.value); setPage(1); } }))
      : [];

  const statCards = [
    { label: 'Total Agents', value: String(stats?.totalAgents ?? 0), icon: Users },
    { label: 'Working Days', value: String(stats?.workingDays ?? 0), icon: Briefcase },
    { label: 'Avg Attendance', value: `${(stats?.avgAttendancePercentage ?? 0).toFixed(1)}%`, icon: TrendingUp },
    { label: 'Current Month', value: stats?.currentMonthShort ? `${stats.currentMonthShort} ${stats.year}` : monthLabel, icon: CalendarDays },
  ];

  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? t.badgeBg : t.cardBg, borderColor: active ? t.brand : t.border }]}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: active ? t.badgeText : t.textPrimary }} numberOfLines={1}>
        {label}
      </Text>
      <ChevronDown size={13} color={active ? t.brand : t.textSecondary} />
    </TouchableOpacity>
  );

  const Header = (
    <View style={{ gap: 14, marginBottom: 12 }}>
      {/* Stats — one horizontal row */}
      <View style={styles.statsRow}>
        {statCards.map((s) => {
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

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }} style={{ marginHorizontal: -16, paddingLeft: 16 }}>
        <Chip label={monthLabel} active onPress={() => setSheet('month')} />
        <Chip label={ROLES.find((r) => r.value === role)?.label || 'All Roles'} active={!!role} onPress={() => setSheet('role')} />
        <Chip
          label={perf ? PERFORMANCE.find((p) => p.value === perf)!.label.split(' (')[0] : 'All Performance'}
          active={!!perf}
          onPress={() => setSheet('perf')}
        />
        <Chip label={JOIN_RANGES.find((j) => j.value === join)!.label} active={!!join} onPress={() => setSheet('join')} />
      </ScrollView>

      <View style={styles.rowBetween}>
        <View style={[styles.rowCenter, { gap: 8 }]}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>Agents</Text>
          <View style={[styles.countChip, { backgroundColor: t.badgeBg }]}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: t.badgeText }}>{totalCount}</Text>
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
      <Text style={{ marginTop: 10, color: t.textSecondary, fontSize: 13 }}>Loading attendance records...</Text>
    </View>
  ) : isError ? (
    <View style={[styles.empty, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <ShieldAlert size={32} color="#ef4444" />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>Couldn't load attendance</Text>
      <Text style={{ fontSize: 12, color: t.textSecondary, textAlign: 'center' }}>
        {(error as any)?.response?.data?.message || (error as any)?.message || 'Something went wrong.'}
      </Text>
      <TouchableOpacity onPress={() => refetch()} style={[styles.primaryBtn, { backgroundColor: t.brand }]}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={[styles.empty, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <Users size={32} color={t.textMuted} />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No Agents Found</Text>
      <Text style={{ fontSize: 12, color: t.textSecondary, textAlign: 'center' }}>
        No approved agents matched your search and filter criteria.
      </Text>
    </View>
  );

  const Footer =
    totalPages > 1 ? (
      <View style={[styles.rowBetween, { marginTop: 14 }]}>
        <TouchableOpacity
          disabled={page <= 1 || isFetching}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          style={[styles.pageBtn, { borderColor: t.border, backgroundColor: t.cardBg, opacity: page <= 1 ? 0.45 : 1 }]}
        >
          <ChevronLeft size={16} color={t.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 12, fontWeight: '600', color: t.textSecondary }}>
          Page {page} of {totalPages}
        </Text>
        <TouchableOpacity
          disabled={page >= totalPages || isFetching}
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          style={[styles.pageBtn, { borderColor: t.border, backgroundColor: t.cardBg, opacity: page >= totalPages ? 0.45 : 1 }]}
        >
          <ChevronRight size={16} color={t.textPrimary} />
        </TouchableOpacity>
      </View>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: t.primaryBg }}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: t.cardBg, borderBottomColor: t.border }]}>
        <View style={[styles.rowCenter, { gap: 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: t.inputBg }]} hitSlop={6}>
            <ArrowLeft size={18} color={t.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: t.textPrimary }}>Agent Attendance</Text>
            <Text style={{ fontSize: 12, color: t.textSecondary }} numberOfLines={1}>
              Monitor approved agent attendance, working days and performance metrics
            </Text>
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
            placeholder="Search by name, email, phone..."
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
        data={isLoading || isError ? [] : agents}
        keyExtractor={(a) => String(a.agentId)}
        renderItem={({ item }) => <AgentCard a={item} t={t} onOpen={openCalendar} />}
        ListHeaderComponent={Header}
        ListEmptyComponent={Empty}
        ListFooterComponent={Footer}
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
            <View style={[styles.rowBetween, { marginBottom: 8 }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }}>
                {sheet === 'month' ? 'Select Month' : sheet === 'role' ? 'Role' : sheet === 'perf' ? 'Performance' : 'Join Date'}
              </Text>
              <TouchableOpacity onPress={() => setSheet(null)} hitSlop={8}>
                <X size={20} color={t.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  search: { height: 42, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },

  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 14, borderWidth: 1 },
  statIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 34, borderRadius: 17, borderWidth: 1 },
  countChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },

  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImg: { width: 42, height: 42 },
  name: { fontSize: 15, fontWeight: '700' },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  perfPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, marginLeft: 8 },
  smallLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  track: { height: 6, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  countsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  countCell: { flex: 1, alignItems: 'center' },
  calBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },

  empty: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  primaryBtn: { paddingHorizontal: 20, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  pageBtn: { width: 40, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 },
});
