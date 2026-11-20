import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Modal,
  Alert,
  Share,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Share2,
  Settings,
  Zap,
  Trash2,
  Building,
  Layers,
  Key,
  Phone,
  Tag,
  Home,
  Grid,
  Globe,
  X,
  Eye,
  EyeOff,
  FlaskConical,
  Link,
  Clock,
  Users,
  Factory,
  Handshake,
  Building2,
  ShieldAlert,
  Plug,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme, AdminThemeTokens } from '../../../theme/adminTheme';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';
import { IntegrationItem } from '../../../admin/models/IntegrationTypes';
import {
  useIntegrationsQuery,
  useSaveIntegrationMutation,
  useToggleIntegrationMutation,
  useSyncIntegrationMutation,
  useTestSyncMutation,
  useSyncAllMutation,
  useClearTestLeadsMutation,
} from '../../../admin/hooks/useIntegrations';

const DANGER = '#ef4444';
const AMBER = '#f59e0b';

type StatusFilter = 'all' | 'active' | 'configured' | 'notset';
const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Configured', value: 'configured' },
  { label: 'Not Set', value: 'notset' },
];

const errMsg = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback;

const formatSync = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
};

/* ── Platform icon tile ─────────────────────────────────────────────── */
const PlatformIcon = ({ icon, color, size = 20 }: { icon: string; color: string; size?: number }) => {
  const letter = icon === 'facebook' ? 'f' : icon === 'google' ? 'G' : null;
  if (letter) {
    return <Text style={{ color, fontSize: size, fontWeight: '900', lineHeight: size + 4 }}>{letter}</Text>;
  }
  const p = { size, color };
  switch (icon) {
    case 'building': return <Building2 {...p} />;
    case 'home': return <Home {...p} />;
    case 'grid': return <Grid {...p} />;
    case 'phone': return <Phone {...p} />;
    case 'factory': return <Factory {...p} />;
    case 'handshake': return <Handshake {...p} />;
    case 'city': return <Building {...p} />;
    case 'key': return <Key {...p} />;
    case 'tag': return <Tag {...p} />;
    default: return <Globe {...p} />;
  }
};

/* ── Status pill ────────────────────────────────────────────────────── */
const StatusPill = ({ item, t }: { item: IntegrationItem; t: AdminThemeTokens }) => {
  const s = item.isEnabled
    ? { label: 'Active', fg: t.brand, bg: t.badgeBg, dot: true }
    : item.isConfigured
    ? { label: 'Configured', fg: AMBER, bg: `${AMBER}1A`, dot: false }
    : { label: 'Not Set', fg: t.textMuted, bg: t.inputBg, dot: false };
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      {s.dot && <View style={[styles.pillDot, { backgroundColor: s.fg }]} />}
      <Text style={[styles.pillText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
};

/* ── Platform card (memoized) ───────────────────────────────────────── */
type CardProps = {
  item: IntegrationItem;
  t: AdminThemeTokens;
  busy: string | null;
  onToggle: (item: IntegrationItem, value: boolean) => void;
  onConfigure: (item: IntegrationItem) => void;
  onTest: (item: IntegrationItem) => void;
  onSync: (item: IntegrationItem) => void;
};

const PlatformCard = memo(function PlatformCard({ item, t, busy, onToggle, onConfigure, onTest, onSync }: CardProps) {
  const lastSync = formatSync(item.lastSyncedAt);
  const testing = busy === `test:${item.platform}`;
  const syncing = busy === `sync:${item.platform}`;

  return (
    <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: item.isEnabled ? `${item.color}55` : t.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.iconTile, { backgroundColor: `${item.color}18` }]}>
          <PlatformIcon icon={item.icon} color={item.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: t.textPrimary }]} numberOfLines={1}>
            {item.displayName}
          </Text>
          <Text style={[styles.cardDesc, { color: t.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <Switch
          value={item.isEnabled}
          onValueChange={(v) => onToggle(item, v)}
          trackColor={{ false: t.border, true: t.brand }}
          thumbColor="#ffffff"
          ios_backgroundColor={t.border}
        />
      </View>

      <View style={styles.metaRow}>
        <StatusPill item={item} t={t} />
        {item.leadsSynced > 0 && (
          <View style={[styles.pill, { backgroundColor: '#3b82f61A' }]}>
            <Users size={10} color="#3b82f6" />
            <Text style={[styles.pillText, { color: '#3b82f6' }]}>{item.leadsSynced} leads</Text>
          </View>
        )}
        {lastSync && (
          <View style={[styles.rowCenter, { gap: 4, marginLeft: 'auto' }]}>
            <Clock size={11} color={t.textMuted} />
            <Text style={{ fontSize: 11, color: t.textMuted }}>{lastSync}</Text>
          </View>
        )}
      </View>

      <View style={[styles.actions, { borderTopColor: t.border }]}>
        <TouchableOpacity
          onPress={() => onConfigure(item)}
          style={[styles.actionBtn, { flex: 1, backgroundColor: t.inputBg }]}
          activeOpacity={0.7}
        >
          <Settings size={14} color={t.textPrimary} />
          <Text style={[styles.actionText, { color: t.textPrimary }]}>{item.isConfigured ? 'Configure' : 'Set up'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onTest(item)}
          disabled={!!busy}
          style={[styles.actionBtn, { backgroundColor: `${AMBER}1A`, opacity: busy && !testing ? 0.5 : 1 }]}
          activeOpacity={0.7}
        >
          {testing ? <ActivityIndicator size="small" color={AMBER} /> : <FlaskConical size={14} color={AMBER} />}
          <Text style={[styles.actionText, { color: AMBER }]}>Test</Text>
        </TouchableOpacity>
        {item.isEnabled && (
          <TouchableOpacity
            onPress={() => onSync(item)}
            disabled={!!busy}
            style={[styles.actionBtn, { backgroundColor: t.badgeBg, opacity: busy && !syncing ? 0.5 : 1 }]}
            activeOpacity={0.7}
          >
            {syncing ? <ActivityIndicator size="small" color={t.brand} /> : <RefreshCw size={14} color={t.brand} />}
            <Text style={[styles.actionText, { color: t.badgeText }]}>Sync</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

/* ── Screen ─────────────────────────────────────────────────────────── */
export default function LeadIntegrationsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const t = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  const { data, isLoading, isError, error, refetch, isRefetching } = useIntegrationsQuery();
  const saveMut = useSaveIntegrationMutation();
  const toggleMut = useToggleIntegrationMutation();
  const syncMut = useSyncIntegrationMutation();
  const testMut = useTestSyncMutation();
  const syncAllMut = useSyncAllMutation();
  const clearMut = useClearTestLeadsMutation();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [busy, setBusy] = useState<string | null>(null);

  // Config sheet
  const [editing, setEditing] = useState<IntegrationItem | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [pollInterval, setPollInterval] = useState('');
  const [extraConfig, setExtraConfig] = useState('');
  const [enableOnSave, setEnableOnSave] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const summary = data?.data?.summary;
  const all = data?.data?.integrations ?? [];

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((i) => {
      if (q && !i.displayName.toLowerCase().includes(q) && !i.description.toLowerCase().includes(q)) return false;
      if (status === 'active') return i.isEnabled;
      if (status === 'configured') return i.isConfigured && !i.isEnabled;
      if (status === 'notset') return !i.isConfigured;
      return true;
    });
  }, [all, search, status]);

  const notify = (res: any, okTitle: string, failTitle: string) => {
    if (res?.success) Toast.show({ type: 'success', text1: okTitle, text2: res.message });
    else Toast.show({ type: 'error', text1: failTitle, text2: res?.message || 'Something went wrong.' });
  };

  /* Config sheet */
  const openConfig = useCallback((item: IntegrationItem, enableIntent: boolean = false) => {
    const c = item.config ?? {};
    const values: Record<string, string> = {};
    item.fields.forEach((f) => {
      values[f.key] = ((c as any)[f.key] ?? '') as string;
    });
    setForm(values);
    setPollInterval(c.pollIntervalMinutes ? String(c.pollIntervalMinutes) : '');
    setExtraConfig(c.extraConfig ?? '');
    setEnableOnSave(enableIntent || !!item.isEnabled);
    setRevealed({});
    setEditing(item);
  }, []);

  const submitConfig = () => {
    if (!editing) return;
    const missing = editing.fields.filter((f) => f.required && !form[f.key]?.trim());
    if (missing.length) {
      Toast.show({ type: 'error', text1: 'Required fields missing', text2: missing.map((m) => m.label.split(' (')[0]).join(', ') });
      return;
    }
    const interval = parseInt(pollInterval, 10);
    saveMut.mutate(
      {
        platformName: editing.platform,
        ...form,
        extraConfig: extraConfig || undefined,
        pollIntervalMinutes: Number.isFinite(interval) && interval > 0 ? interval : 5,
        isEnabled: enableOnSave,
      },
      {
        onSuccess: (res) => {
          notify(res, 'Saved', 'Save failed');
          if (res?.success) setEditing(null);
        },
        onError: (e) => Toast.show({ type: 'error', text1: 'Save failed', text2: errMsg(e, 'Could not save configuration.') }),
      }
    );
  };

  /* Card actions */
  const handleToggle = useCallback(
    (item: IntegrationItem, value: boolean) => {
      if (value && !item.isConfigured) {
        openConfig(item, true); // web behaviour: configure first
        return;
      }
      toggleMut.mutate(
        { platform: item.platform, enable: value },
        {
          onSuccess: (res) => notify(res, value ? 'Enabled' : 'Disabled', 'Update failed'),
          onError: (e) => Toast.show({ type: 'error', text1: 'Update failed', text2: errMsg(e, 'Could not update.') }),
        }
      );
    },
    [toggleMut, openConfig]
  );

  const handleTest = useCallback(
    (item: IntegrationItem) => {
      if (!item.isConfigured) {
        Toast.show({ type: 'info', text1: 'Set up first', text2: `Configure ${item.displayName} before testing.` });
        openConfig(item);
        return;
      }
      Alert.alert(
        `Test ${item.displayName}?`,
        'This generates sample leads marked as [TEST]. You can clear them anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            onPress: () => {
              setBusy(`test:${item.platform}`);
              testMut.mutate(item.platform, {
                onSuccess: (res) => notify(res, 'Test complete', 'Test failed'),
                onError: (e) => Toast.show({ type: 'error', text1: 'Test failed', text2: errMsg(e, 'Test sync failed.') }),
                onSettled: () => setBusy(null),
              });
            },
          },
        ]
      );
    },
    [testMut, openConfig]
  );

  const handleSync = useCallback(
    (item: IntegrationItem) => {
      setBusy(`sync:${item.platform}`);
      syncMut.mutate(item.platform, {
        onSuccess: (res) => notify(res, 'Sync complete', 'Sync failed'),
        onError: (e) => Toast.show({ type: 'error', text1: 'Sync failed', text2: errMsg(e, 'Sync failed.') }),
        onSettled: () => setBusy(null),
      });
    },
    [syncMut]
  );

  const handleSyncAll = () =>
    syncAllMut.mutate(undefined, {
      onSuccess: (res) => notify(res, 'Sync complete', 'Nothing to sync'),
      onError: (e) => Toast.show({ type: 'error', text1: 'Sync failed', text2: errMsg(e, 'Sync failed.') }),
    });

  const handleClearTest = () =>
    Alert.alert('Clear all test leads?', 'All [TEST] sample leads will be deleted. Real leads are not affected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          clearMut.mutate(undefined, {
            onSuccess: (res) => notify(res, 'Cleared', 'Clear failed'),
            onError: (e) => Toast.show({ type: 'error', text1: 'Clear failed', text2: errMsg(e, 'Could not clear.') }),
          }),
      },
    ]);

  const renderItem = useCallback(
    ({ item }: { item: IntegrationItem }) => (
      <PlatformCard
        item={item}
        t={t}
        busy={busy}
        onToggle={handleToggle}
        onConfigure={openConfig}
        onTest={handleTest}
        onSync={handleSync}
      />
    ),
    [t, busy, handleToggle, openConfig, handleTest, handleSync]
  );

  const stats = [
    { label: 'Platforms', value: summary?.totalPlatforms ?? 0, icon: <Layers size={15} color="#3b82f6" />, tint: '#3b82f61A' },
    { label: 'Active', value: summary?.activePlatforms ?? 0, icon: <Zap size={15} color={t.brand} />, tint: t.badgeBg },
    { label: 'Leads Synced', value: (summary?.totalLeadsSynced ?? 0).toLocaleString(), icon: <Users size={15} color={AMBER} />, tint: `${AMBER}1A` },
  ];

  const Header = (
    <View style={{ gap: 14, marginBottom: 12 }}>
      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.stat, { backgroundColor: t.cardBg, borderColor: t.border }]}>
            <View style={[styles.statIcon, { backgroundColor: s.tint }]}>{s.icon}</View>
            <Text style={[styles.statValue, { color: t.textPrimary }]} numberOfLines={1}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]} numberOfLines={1}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Bulk actions */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={handleSyncAll}
          disabled={syncAllMut.isPending || !summary?.activePlatforms}
          style={[styles.bigBtn, { flex: 1, backgroundColor: t.brand, opacity: syncAllMut.isPending || !summary?.activePlatforms ? 0.55 : 1 }]}
          activeOpacity={0.8}
        >
          {syncAllMut.isPending ? <ActivityIndicator size="small" color="#fff" /> : <RefreshCw size={15} color="#fff" />}
          <Text style={styles.bigBtnText}>Sync All Active</Text>
        </TouchableOpacity>
        {summary?.hasTestData && (
          <TouchableOpacity
            onPress={handleClearTest}
            disabled={clearMut.isPending}
            style={[styles.bigBtn, { backgroundColor: `${DANGER}14`, borderWidth: 1, borderColor: `${DANGER}40` }]}
            activeOpacity={0.8}
          >
            {clearMut.isPending ? <ActivityIndicator size="small" color={DANGER} /> : <Trash2 size={15} color={DANGER} />}
            <Text style={[styles.bigBtnText, { color: DANGER }]}>Clear Test</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: t.cardBg, borderColor: t.border }]}>
        <Search size={16} color={t.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search platforms..."
          placeholderTextColor={t.textMuted}
          style={{ flex: 1, color: t.textPrimary, fontSize: 14, paddingVertical: 0 }}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <X size={16} color={t.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status segment */}
      <View style={[styles.segment, { backgroundColor: t.inputBg }]}>
        {STATUS_FILTERS.map((f) => {
          const active = status === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setStatus(f.value)}
              style={[styles.segmentItem, active && { backgroundColor: t.cardBg, borderColor: t.border, borderWidth: 1 }]}
            >
              <Text style={{ fontSize: 12, fontWeight: active ? '700' : '500', color: active ? t.textPrimary : t.textSecondary }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const Empty = isLoading ? (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator size="large" color={t.brand} />
      <Text style={{ color: t.textSecondary, marginTop: 12, fontSize: 13 }}>Loading integrations...</Text>
    </View>
  ) : isError ? (
    <View style={[styles.empty, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <ShieldAlert size={34} color={DANGER} />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>Couldn't load integrations</Text>
      <Text style={[styles.emptyText, { color: t.textSecondary }]}>{errMsg(error, 'Something went wrong.')}</Text>
      <TouchableOpacity onPress={() => refetch()} style={[styles.bigBtn, { backgroundColor: t.brand, marginTop: 6 }]}>
        <Text style={styles.bigBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={[styles.empty, { backgroundColor: t.cardBg, borderColor: t.border }]}>
      <Plug size={34} color={t.textMuted} />
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No platforms match</Text>
      <Text style={[styles.emptyText, { color: t.textSecondary }]}>Try a different search or filter.</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.primaryBg }}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: t.cardBg, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: t.inputBg }]} hitSlop={6}>
          <ArrowLeft size={18} color={t.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.topTitle, { color: t.textPrimary }]}>Lead Integrations</Text>
          <Text style={{ fontSize: 12, color: t.textSecondary }}>Connect lead sources to auto-import leads</Text>
        </View>
      </View>

      <FlatList
        data={isLoading || isError ? [] : list}
        keyExtractor={(i) => i.platform}
        renderItem={renderItem}
        extraData={busy}
        ListHeaderComponent={Header}
        ListEmptyComponent={Empty}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomSpacing + 20, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[t.brand]} tintColor={t.brand} />}
        initialNumToRender={6}
        windowSize={7}
      />

      {/* Configure bottom sheet */}
      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.overlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setEditing(null)} />
            <View style={[styles.sheet, { backgroundColor: t.cardBg }]}>
              <View style={[styles.handle, { backgroundColor: t.border }]} />
              {editing && (
                <>
                  <View style={[styles.rowCenter, { gap: 12 }]}>
                    <View style={[styles.iconTile, { backgroundColor: `${editing.color}18` }]}>
                      <PlatformIcon icon={editing.icon} color={editing.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: t.textPrimary }}>{editing.displayName}</Text>
                      <Text style={{ fontSize: 12, color: t.textSecondary }}>Configuration</Text>
                    </View>
                    <TouchableOpacity onPress={() => setEditing(null)} hitSlop={8}>
                      <X size={20} color={t.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ marginTop: 16 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
                    <Text style={[styles.section, { color: t.textMuted }]}>API CREDENTIALS</Text>
                    {editing.fields.map((f) => {
                      const show = revealed[f.key];
                      return (
                        <View key={f.key} style={{ marginBottom: 12 }}>
                          <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>
                            {f.label}
                            {f.required && <Text style={{ color: DANGER }}> *</Text>}
                          </Text>
                          <View style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border }]}>
                            <TextInput
                              value={form[f.key] ?? ''}
                              onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                              placeholder={`Enter ${f.label.replace(/\s*\(.*\)$/, '')}`}
                              placeholderTextColor={t.textMuted}
                              secureTextEntry={!!f.secret && !show}
                              autoCapitalize="none"
                              autoCorrect={false}
                              style={{ flex: 1, color: t.textPrimary, fontSize: 14, paddingVertical: 0 }}
                            />
                            {f.secret && (
                              <TouchableOpacity onPress={() => setRevealed((p) => ({ ...p, [f.key]: !show }))} hitSlop={8}>
                                {show ? <EyeOff size={16} color={t.textSecondary} /> : <Eye size={16} color={t.textSecondary} />}
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}

                    <Text style={[styles.section, { color: t.textMuted, marginTop: 6 }]}>SETTINGS</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Poll Interval (min)</Text>
                        <View style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border }]}>
                          <TextInput
                            value={pollInterval}
                            onChangeText={(v) => setPollInterval(v.replace(/[^0-9]/g, ''))}
                            placeholder="5"
                            placeholderTextColor={t.textMuted}
                            keyboardType="number-pad"
                            maxLength={4}
                            style={{ flex: 1, color: t.textPrimary, fontSize: 14, paddingVertical: 0 }}
                          />
                        </View>
                      </View>
                      <View style={{ flex: 1.6 }}>
                        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Extra Config (JSON)</Text>
                        <View style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border }]}>
                          <TextInput
                            value={extraConfig}
                            onChangeText={setExtraConfig}
                            placeholder='{"key":"value"}'
                            placeholderTextColor={t.textMuted}
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={{ flex: 1, color: t.textPrimary, fontSize: 14, paddingVertical: 0 }}
                          />
                        </View>
                      </View>
                    </View>

                    <View style={[styles.enableRow, { backgroundColor: t.inputBg, borderColor: t.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary }}>Enable integration</Text>
                        <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
                          Credentials are verified with the platform when enabled
                        </Text>
                      </View>
                      <Switch
                        value={enableOnSave}
                        onValueChange={setEnableOnSave}
                        trackColor={{ false: t.border, true: t.brand }}
                        thumbColor="#ffffff"
                      />
                    </View>

                    <Text style={[styles.section, { color: t.textMuted, marginTop: 14 }]}>WEBHOOK URL</Text>
                    <View style={[styles.webhook, { backgroundColor: t.inputBg, borderColor: t.border }]}>
                      <Link size={14} color={t.textSecondary} />
                      <Text style={{ flex: 1, fontSize: 12, color: t.textPrimary }} numberOfLines={2} selectable>
                        {editing.webhookUrl}
                      </Text>
                      <TouchableOpacity
                        onPress={() => Share.share({ message: editing.webhookUrl })}
                        style={[styles.shareBtn, { backgroundColor: t.badgeBg }]}
                      >
                        <Share2 size={14} color={t.brand} />
                      </TouchableOpacity>
                    </View>
                  </ScrollView>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      onPress={() => setEditing(null)}
                      style={[styles.bigBtn, { flex: 1, borderWidth: 1, borderColor: t.border }]}
                    >
                      <Text style={[styles.bigBtnText, { color: t.textPrimary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={submitConfig}
                      disabled={saveMut.isPending}
                      style={[styles.bigBtn, { flex: 2, backgroundColor: t.brand, opacity: saveMut.isPending ? 0.7 : 1 }]}
                    >
                      {saveMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.bigBtnText}>Save Configuration</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCenter: { flexDirection: 'row', alignItems: 'center' },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '800' },

  stat: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 17, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 1 },

  bigBtn: { height: 44, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bigBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  searchBox: { height: 44, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderColor: 'transparent', borderWidth: 1 },

  card: { borderRadius: 18, borderWidth: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  actionBtn: { height: 36, borderRadius: 11, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '700' },

  empty: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  emptyText: { fontSize: 12, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  enableRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, marginTop: 6 },
  webhook: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  shareBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
