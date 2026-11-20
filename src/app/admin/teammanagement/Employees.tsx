import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  X,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Mail,
  Phone,
  CalendarDays,
  Clock,
  ChevronDown,
  Check,
  ExternalLink,
  UserCog,
  ShieldAlert,
  Briefcase,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme, AdminThemeTokens } from '../../../theme/adminTheme';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';
import { useEmployeesQuery, EmployeeItem } from '../../../admin/hooks/useEmployees';

const GREEN = '#10b981';
const RED = '#ef4444';
const AMBER = '#f59e0b';
const BLUE = '#3b82f6';
const PAGE_SIZE = 20;

type DateRange = 'any' | 'today' | '7d' | '30d' | 'month';
const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: 'Any time', value: 'any' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This month', value: 'month' },
];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const rangeToDates = (r: DateRange): { fromDate?: string; toDate?: string } => {
  const now = new Date();
  if (r === 'any') return {};
  if (r === 'today') return { fromDate: iso(now), toDate: iso(now) };
  if (r === 'month') return { fromDate: iso(new Date(now.getFullYear(), now.getMonth(), 1)), toDate: iso(now) };
  const days = r === '7d' ? 6 : 29;
  const from = new Date(now);
  from.setDate(now.getDate() - days);
  return { fromDate: iso(from), toDate: iso(now) };
};

const fmtDate = (v?: string | null) => {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

type Picker = 'role' | 'status' | 'date' | null;

/* ── Employee card (web: name, role badge, Active, email, phone, created, last activity, account status, View Details) ── */
const EmployeeCard = memo(function EmployeeCard({
  item,
  t,
  onView,
}: {
  item: EmployeeItem;
  t: AdminThemeTokens;
  onView: (e: EmployeeItem) => void;
}) {
  const initial = (item.username || '?').charAt(0).toUpperCase();
  return (
    <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: t.badgeBg }]}>
          <Text style={{ color: t.badgeText, fontSize: 16, fontWeight: '800' }}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: t.textPrimary }]} numberOfLines={1}>
            {item.username}
          </Text>
          <View style={[styles.row, { gap: 6, marginTop: 5 }]}>
            <View style={[styles.pill, { backgroundColor: `${BLUE}1A` }]}>
              <Text style={[styles.pillText, { color: BLUE }]}>{(item.role || '').toUpperCase()}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: item.isActive ? `${GREEN}1A` : `${RED}1A` }]}>
              <Text style={[styles.pillText, { color: item.isActive ? GREEN : RED }]}>{item.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.grid, { borderTopColor: t.border }]}>
        <TouchableOpacity
          style={styles.cell}
          disabled={!item.email}
          onPress={() => item.email && Linking.openURL(`mailto:${item.email}`)}
        >
          <Mail size={13} color={t.textMuted} />
          <Text style={[styles.cellText, { color: t.textSecondary }]} numberOfLines={1}>{item.email || '-'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cell}
          disabled={!item.phone}
          onPress={() => item.phone && Linking.openURL(`tel:${item.phone}`)}
        >
          <Phone size={13} color={t.textMuted} />
          <Text style={[styles.cellText, { color: t.textPrimary, fontWeight: '600' }]} numberOfLines={1}>{item.phone || '-'}</Text>
        </TouchableOpacity>
        <View style={styles.cell}>
          <CalendarDays size={13} color={t.textMuted} />
          <Text style={[styles.cellText, { color: t.textSecondary }]}>{fmtDate(item.createdDate)}</Text>
        </View>
        <View style={styles.cell}>
          <Clock size={13} color={t.textMuted} />
          <Text style={[styles.cellText, { color: t.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
            {item.lastActivity ? fmtDate(item.lastActivity) : 'No activity'}
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: t.border }]}>
        <View style={[styles.row, { gap: 6, flex: 1 }]}>
          <ShieldCheck size={13} color={item.isActive ? AMBER : RED} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: item.isActive ? AMBER : RED }}>
            {item.isActive ? 'Account active' : 'Account inactive'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onView(item)} style={[styles.viewBtn, { borderColor: t.border }]}>
          <ExternalLink size={13} color={t.brand} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.brand }}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

/* ── Screen ── */
export default function EmployeesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const t = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<'' | 'Active' | 'Inactive'>('');
  const [range, setRange] = useState<DateRange>('any');
  const [page, setPage] = useState(1);
  const [picker, setPicker] = useState<Picker>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filters = useMemo(
    () => ({ search, role, status, ...rangeToDates(range), page, pageSize: PAGE_SIZE }),
    [search, role, status, range, page]
  );
  const { data, isLoading, isError, error, refetch, isRefetching, isFetching } = useEmployeesQuery(filters);

  const items = data?.items ?? [];
  const stats = data?.stats;
  const roles = data?.roles ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = !!(search || role || status || range !== 'any');

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setRole('');
    setStatus('');
    setRange('any');
    setPage(1);
  };

  const openDetails = (e: EmployeeItem) =>
    router.push({
      pathname: '/admin/usemanagement/EditUser',
      params: {
        userId: String(e.userId),
        username: e.username || '',
        email: e.email || '',
        phone: e.phone || '',
        role: e.role || '',
        isActive: String(e.isActive),
      },
    } as any);

  const pickerOptions: { label: string; selected: boolean; onPick: () => void }[] =
    picker === 'role'
      ? [{ label: 'All Custom Roles', value: '' }, ...roles.map((r) => ({ label: r, value: r }))].map((o) => ({
          label: o.label,
          selected: role === o.value,
          onPick: () => { setRole(o.value); setPage(1); },
        }))
      : picker === 'status'
      ? ([['All Status', ''], ['Active', 'Active'], ['Inactive', 'Inactive']] as const).map(([label, value]) => ({
          label,
          selected: status === value,
          onPick: () => { setStatus(value); setPage(1); },
        }))
      : picker === 'date'
      ? DATE_RANGES.map((d) => ({
          label: d.label,
          selected: range === d.value,
          onPick: () => { setRange(d.value); setPage(1); },
        }))
      : [];

  const statCards = [
    { label: 'TOTAL', value: stats?.total ?? 0, icon: <Users size={15} color={BLUE} />, tint: `${BLUE}1A` },
    { label: 'ACTIVE', value: stats?.active ?? 0, icon: <UserCheck size={15} color={GREEN} />, tint: `${GREEN}1A` },
    { label: 'INACTIVE', value: stats?.inactive ?? 0, icon: <UserX size={15} color={RED} />, tint: `${RED}1A` },
    { label: 'CUSTOM ROLES', value: stats?.customRoles ?? 0, icon: <UserCog size={15} color={AMBER} />, tint: `${AMBER}1A` },
  ];

  const FilterBtn = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterBtn, { backgroundColor: active ? t.badgeBg : t.cardBg, borderColor: active ? t.brand : t.border }]}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: active ? t.badgeText : t.textPrimary }} numberOfLines={1}>
        {label}
      </Text>
      <ChevronDown size={13} color={active ? t.brand : t.textSecondary} />
    </TouchableOpacity>
  );

  const Header = (
    <View style={{ gap: 12, marginBottom: 12 }}>
      <View style={styles.statsRow}>
        {statCards.map((s) => (
          <View key={s.label} style={[styles.stat, { backgroundColor: t.cardBg, borderColor: t.border }]}>
            <View style={[styles.statIcon, { backgroundColor: s.tint }]}>{s.icon}</View>
            <Text style={[styles.statValue, { color: t.textPrimary }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]} numberOfLines={1}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <FilterBtn label={role || 'All Custom Roles'} active={!!role} onPress={() => setPicker('role')} />
        <FilterBtn label={status || 'All Status'} active={!!status} onPress={() => setPicker('status')} />
        <FilterBtn
          label={DATE_RANGES.find((d) => d.value === range)?.label ?? 'Any time'}
          active={range !== 'any'}
          onPress={() => setPicker('date')}
        />
      </View>

      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={{ fontSize: 12, color: t.textSecondary }}>
          {totalCount > 0
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} employees`
            : 'No employees'}
        </Text>
        {hasFilters && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.brand }}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const Empty = isLoading ? (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator size="large" color={t.brand} />
      <Text style={{ color: t.textSecondary, marginTop: 12, fontSize: 13 }}>Loading employees...</Text>
    </View>
  ) : isError ? (
    <View style={[styles.empty, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <ShieldAlert size={34} color={RED} />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>Couldn't load employees</Text>
      <Text style={{ fontSize: 12, color: t.textSecondary, textAlign: 'center' }}>
        {(error as any)?.response?.data?.message || 'Something went wrong.'}
      </Text>
    </View>
  ) : (
    <View style={[styles.empty, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <Briefcase size={34} color={t.textMuted} />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No employees found</Text>
      <Text style={{ fontSize: 12, color: t.textSecondary, textAlign: 'center' }}>
        {hasFilters ? 'Try adjusting your filters.' : 'Users assigned to custom roles will appear here.'}
      </Text>
    </View>
  );

  const Footer =
    totalPages > 1 ? (
      <View style={[styles.row, { justifyContent: 'space-between', marginTop: 14 }]}>
        <TouchableOpacity
          disabled={page <= 1 || isFetching}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          style={[styles.pageBtn, { borderColor: t.border, backgroundColor: t.cardBg, opacity: page <= 1 ? 0.5 : 1 }]}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: t.textPrimary }}>Prev</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 12, color: t.textSecondary }}>Page {page} of {totalPages}</Text>
        <TouchableOpacity
          disabled={page >= totalPages || isFetching}
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          style={[styles.pageBtn, { borderColor: t.border, backgroundColor: t.cardBg, opacity: page >= totalPages ? 0.5 : 1 }]}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: t.textPrimary }}>Next</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: t.primaryBg }}>
      {/* Top bar: back · title · Manage Users */}
      <View style={[styles.topBar, { backgroundColor: t.cardBg, borderBottomColor: t.border }]}>
        <View style={[styles.row, { gap: 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: t.inputBg }]}>
            <ArrowLeft size={18} color={t.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: t.textPrimary }}>Employee List</Text>
            <Text style={{ fontSize: 12, color: t.textSecondary }}>Manage staff assigned to custom roles</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/admin/usemanagement/ManageUsers' as any)}
            style={[styles.manageBtn, { backgroundColor: t.badgeBg, borderColor: t.brand }]}
          >
            <UserCog size={14} color={t.brand} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.brand }}>Manage Users</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.search, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <Search size={16} color={t.textSecondary} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search name, email, phone..."
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
        data={isLoading || isError ? [] : items}
        keyExtractor={(e) => String(e.userId)}
        renderItem={({ item }) => <EmployeeCard item={item} t={t} onView={openDetails} />}
        ListHeaderComponent={Header}
        ListEmptyComponent={Empty}
        ListFooterComponent={Footer}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomSpacing + 20, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[t.brand]} tintColor={t.brand} />}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        windowSize={7}
      />

      {/* Filter options sheet */}
      <Modal visible={picker !== null} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setPicker(null)}>
          <View style={[styles.sheet, { backgroundColor: t.cardBg }]}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.textPrimary, marginBottom: 8 }}>
              {picker === 'role' ? 'Role' : picker === 'status' ? 'Status' : 'Created Date'}
            </Text>
            {pickerOptions.map((o) => (
              <TouchableOpacity
                key={o.label}
                onPress={() => { o.onPick(); setPicker(null); }}
                style={[styles.option, o.selected && { backgroundColor: t.badgeBg }]}
              >
                <Text style={{ flex: 1, fontSize: 14, fontWeight: o.selected ? '700' : '500', color: o.selected ? t.badgeText : t.textPrimary }}>
                  {o.label}
                </Text>
                {o.selected && <Check size={16} color={t.brand} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 34, borderRadius: 17, borderWidth: 1 },
  search: { height: 42, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },

  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2, borderRadius: 14, borderWidth: 1 },
  statIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', marginTop: 2 },

  filterBtn: { flex: 1, height: 38, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },

  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { fontSize: 15, fontWeight: '700' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTopWidth: 1, rowGap: 8 },
  cell: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 8 },
  cellText: { fontSize: 12, flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 34, borderRadius: 10, borderWidth: 1 },

  empty: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  pageBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 },
});
