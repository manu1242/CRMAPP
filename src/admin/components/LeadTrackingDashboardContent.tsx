import React, { memo, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  Percent,
  Search,
  X,
  Phone,
  UserCheck,
  CalendarDays,
  Handshake,
  Users,
  Activity,
  ShieldAlert,
  ChevronRight,
  Receipt,
  History,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme, AdminThemeTokens } from '../../theme/adminTheme';
import { useBottomNavSpacing } from '../../hooks/useBottomNavSpacing';
import { useDashboardScrollHandler } from '../store/useHeaderScrollStore';
import {
  usePartnerLeadTrackingQuery,
  usePartnerLeadTrackingDetailsQuery,
  PartnerTrackedLead,
} from '../hooks/usePartnerLeadTracking';

const GREEN = '#10b981';
const AMBER = '#f59e0b';
const BLUE = '#3b82f6';
const TEAL = '#00918E';
const SLATE = '#64748b';

const inr = (n?: number | null, decimals = 0) =>
  `₹${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

const fmtDate = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Web colours: HandedOver → success, else warning; Paid → success, Approved → warning, else secondary
const handoverTone = (s?: string | null) => (s === 'HandedOver' ? GREEN : AMBER);
const commissionTone = (s?: string | null) => (s === 'Paid' ? GREEN : s === 'Approved' ? AMBER : SLATE);

const Badge = ({ label, color }: { label: string; color: string }) => (
  <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

/* ── Lead card ──────────────────────────────────────────────────────── */
const LeadCard = memo(function LeadCard({
  lead,
  t,
  shadow,
  onPress,
}: {
  lead: PartnerTrackedLead;
  t: AdminThemeTokens;
  shadow: any;
  onPress: (id: number) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(lead.leadId)}
      style={[styles.leadCard, { backgroundColor: t.cardBg, borderColor: t.border, ...shadow }]}
    >
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.leadName, { color: t.textPrimary }]} numberOfLines={1}>
            {lead.name || 'Unnamed Lead'}
          </Text>
          {lead.partnerName ? (
            <View style={[styles.rowCenter, { gap: 5, marginTop: 4 }]}>
              <Handshake size={12} color={TEAL} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: TEAL }} numberOfLines={1}>
                {lead.partnerName}
              </Text>
            </View>
          ) : null}
          {lead.contact ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${lead.contact}`)}
              style={[styles.rowCenter, { gap: 5, marginTop: 4 }]}
              hitSlop={6}
            >
              <Phone size={12} color={t.brand} />
              <Text style={{ fontSize: 12, color: t.textSecondary }}>{lead.contact}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Badge label={lead.handoverStatus || '-'} color={handoverTone(lead.handoverStatus)} />
      </View>

      <View style={[styles.infoGrid, { borderTopColor: t.border }]}>
        <View style={styles.infoCell}>
          <View style={[styles.rowCenter, { gap: 4 }]}>
            <CalendarDays size={11} color={t.textMuted} />
            <Text style={[styles.infoLabel, { color: t.textMuted }]}>Handover</Text>
          </View>
          <Text style={[styles.infoValue, { color: t.textPrimary }]}>{fmtDate(lead.handoverDate)}</Text>
        </View>
        <View style={styles.infoCell}>
          <View style={[styles.rowCenter, { gap: 4 }]}>
            <UserCheck size={11} color={t.textMuted} />
            <Text style={[styles.infoLabel, { color: t.textMuted }]}>Admin Agent</Text>
          </View>
          <Text style={[styles.infoValue, { color: t.textPrimary }]} numberOfLines={1}>
            {lead.adminAgent || 'Not Assigned'}
          </Text>
        </View>
      </View>

      <View style={[styles.commissionBox, { backgroundColor: t.inputBg }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoLabel, { color: t.textMuted }]}>Commission</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: GREEN, marginTop: 2 }}>
            {inr(lead.commissionAmount, 2)}
          </Text>
          <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {lead.commissionCalculation}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Badge label={lead.commissionStatus || 'Pending'} color={commissionTone(lead.commissionStatus)} />
          <ChevronRight size={16} color={t.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

/* ── Details sheet ──────────────────────────────────────────────────── */
function LeadDetailsSheet({ leadId, onClose, t }: { leadId: number | null; onClose: () => void; t: AdminThemeTokens }) {
  const { data, isLoading, isError } = usePartnerLeadTrackingDetailsQuery(leadId);

  const Row = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <View style={styles.detailRow}>
      <Text style={{ fontSize: 12, color: t.textSecondary }}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={{ fontSize: 13, fontWeight: '600', color: color ?? t.textPrimary, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <View style={[styles.detailSection, { backgroundColor: t.inputBg, borderColor: t.border }]}>
      <View style={[styles.rowCenter, { gap: 8, marginBottom: 8 }]}>
        {icon}
        <Text style={{ fontSize: 13, fontWeight: '700', color: t.textPrimary }}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <Modal visible={leadId != null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: t.cardBg }]}>
          <View style={[styles.handle, { backgroundColor: t.border }]} />
          <View style={styles.rowBetween}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: t.textPrimary }}>Lead Tracking Details</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={20} color={t.textSecondary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color={t.brand} style={{ marginVertical: 40 }} />
          ) : isError || !data ? (
            <Text style={{ color: t.textSecondary, textAlign: 'center', marginVertical: 40 }}>Could not load details.</Text>
          ) : (
            <ScrollView style={{ marginTop: 14 }} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
              <Section icon={<Users size={15} color={t.brand} />} title="Lead Information">
                <Row label="Name" value={data.lead.name || '-'} />
                <Row label="Contact" value={data.lead.contact || '-'} />
                <Row label="Status" value={<Badge label={data.lead.handoverStatus || '-'} color={handoverTone(data.lead.handoverStatus)} />} />
                <Row label="Admin Agent" value={data.lead.adminAgent || 'Not Assigned'} />
              </Section>

              <Section icon={<Handshake size={15} color={BLUE} />} title="Booking Information">
                {data.booking ? (
                  <>
                    <Row label="Status" value={data.booking.status || '-'} />
                    <Row label="Amount" value={inr(data.booking.bookingAmount)} />
                    <Row label="Date" value={fmtDate(data.booking.createdOn)} />
                  </>
                ) : (
                  <Text style={{ fontSize: 12, color: t.textMuted }}>No booking yet</Text>
                )}
              </Section>

              <Section icon={<IndianRupee size={15} color={GREEN} />} title="Commission Information">
                {data.commission ? (
                  <>
                    <Row label="Status" value={<Badge label={data.commission.status} color={commissionTone(data.commission.status)} />} />
                    <Row label="Amount" value={inr(data.commission.commissionAmount, 2)} color={GREEN} />
                    <Row label="Rate" value={`${data.commission.commissionPercentage}%`} />
                  </>
                ) : (
                  <Text style={{ fontSize: 12, color: t.textMuted }}>Commission not calculated yet</Text>
                )}
              </Section>

              <Section icon={<Receipt size={15} color={AMBER} />} title="Payment History">
                {data.payments.length ? (
                  data.payments.map((p) => (
                    <Row key={p.paymentId} label={`${fmtDate(p.paymentDate)} · ${p.paymentMethod || '-'}`} value={inr(p.amount)} />
                  ))
                ) : (
                  <Text style={{ fontSize: 12, color: t.textMuted }}>No payments yet</Text>
                )}
              </Section>

              {data.auditTrail.length > 0 && (
                <Section icon={<History size={15} color={SLATE} />} title="Handover Trail">
                  {data.auditTrail.map((a, i) => (
                    <View key={i} style={{ paddingVertical: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: t.textPrimary }}>
                        {a.fromStatus} → {a.toStatus}
                      </Text>
                      <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
                        {fmtDate(a.handoverDate)} · by {a.handedOverBy || '-'}
                        {a.assignedTo ? ` · to ${a.assignedTo}` : ''}
                      </Text>
                      {a.notes ? <Text style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{a.notes}</Text> : null}
                    </View>
                  ))}
                </Section>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ── Main content ───────────────────────────────────────────────────── */
export default function LeadTrackingDashboardContent() {
  const { isDark } = useTheme();
  const t = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const handleScroll = useDashboardScrollHandler();
  const { data, isLoading, isError, error, isRefetching, refetch } = usePartnerLeadTrackingQuery();

  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);

  const shadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: isDark ? 0.25 : 0.04, shadowRadius: 16 },
    android: { elevation: isDark ? 3 : 1 },
  });

  const leads = useMemo(() => {
    const all = data?.leads ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.contact?.toLowerCase().includes(q) ||
        l.adminAgent?.toLowerCase().includes(q) ||
        l.partnerName?.toLowerCase().includes(q)
    );
  }, [data, search]);

  if (isLoading && !data) {
    return (
      <View style={[styles.centered, { backgroundColor: t.primaryBg }]}>
        <ActivityIndicator size="large" color={t.brand} />
        <Text style={{ marginTop: 12, fontSize: 13, color: t.textSecondary }}>Loading Lead Tracking...</Text>
      </View>
    );
  }

  if (isError && !data) {
    const msg = (error as any)?.response?.data?.message || 'Could not load lead tracking.';
    return (
      <View style={[styles.centered, { backgroundColor: t.primaryBg, gap: 10 }]}>
        <ShieldAlert size={36} color="#ef4444" />
        <Text style={{ fontSize: 15, fontWeight: '700', color: t.textPrimary }}> Lead Tracking unavailable</Text>
        <Text style={{ fontSize: 12, color: t.textSecondary, textAlign: 'center' }}>{msg}</Text>
        <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: t.brand }]}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const s = data?.summary;
  const p = data?.pipeline;
  const isAll = data?.scope === 'all';

  const kpis = [
    { label: 'Commissions', value: String(s?.totalCommissions ?? 0), icon: IndianRupee, color: TEAL },
    { label: 'Paid', value: inr(s?.paidAmount), icon: CheckCircle2, color: GREEN },
    { label: 'Pending', value: inr(s?.pendingAmount), icon: Clock, color: AMBER },
    isAll
      ? { label: 'Partners', value: String(s?.partnersCount ?? 0), icon: Users, color: BLUE }
      : { label: 'Rate', value: `${s?.commissionPercentage ?? 0}%`, icon: Percent, color: BLUE },
  ];

  const pipeline = [
    { label: 'Total Leads', value: p?.totalLeads ?? 0, color: t.textPrimary },
    { label: 'Active', value: p?.activeLeads ?? 0, color: BLUE },
    { label: 'Handed Over', value: p?.handedOverLeads ?? 0, color: GREEN },
  ];

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: t.primaryBg }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomSpacing + 40 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[t.brand]} tintColor={t.brand} />}
      >
        {/* Hero */}
        <ExpoLinearGradient
          colors={isDark ? ['#000000', '#064e3b'] : [t.brand, t.brandHover]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.glow1} />
          <View style={styles.glow2} />
          <Text style={styles.heroTitle}> Lead Tracking</Text>
          <Text style={styles.heroSubtitle}>
            {isAll
              ? `All partners · ${p?.handedOverLeads ?? 0} handed-over leads and ${s?.totalCommissions ?? 0} commissions across ${s?.partnersCount ?? 0} partners.`
              : `Tracking ${p?.handedOverLeads ?? 0} handed-over leads and ${s?.totalCommissions ?? 0} commissions in real time.`}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <View style={styles.heroGhost}>
              <Activity size={14} color="#fff" />
              <Text style={styles.heroGhostText}>{inr(s?.totalCommissionAmount)} earned</Text>
            </View>
          </View>
        </ExpoLinearGradient>

        {/* Commission KPIs (2×2) */}
        <Text style={[styles.sectionHeading, { color: t.textPrimary }]}>Commission Overview</Text>
        <View style={styles.kpiGrid}>
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <View key={k.label} style={[styles.kpiCard, { backgroundColor: t.cardBg, borderColor: t.border, ...shadow }]}>
                <View style={[styles.kpiIcon, { backgroundColor: `${k.color}1A` }]}>
                  <Icon size={16} color={k.color} />
                </View>
                <Text style={[styles.kpiValue, { color: k.color }]} numberOfLines={1} adjustsFontSizeToFit>
                  {k.value}
                </Text>
                <Text style={[styles.kpiLabel, { color: t.textSecondary }]} numberOfLines={1}>
                  {k.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Pipeline strip */}
        <View style={[styles.pipeline, { backgroundColor: t.cardBg, borderColor: t.border, ...shadow }]}>
          {pipeline.map((x, i) => (
            <View key={x.label} style={[styles.pipeCell, i > 0 && { borderLeftWidth: 1, borderLeftColor: t.border }]}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: x.color }}>{x.value}</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: t.textSecondary, marginTop: 2 }}>{x.label}</Text>
            </View>
          ))}
        </View>

        {/* Handed over leads */}
        <View style={[styles.rowBetween, { marginTop: 24, marginBottom: 12 }]}>
          <View style={[styles.rowCenter, { gap: 8 }]}>
            <Handshake size={16} color={TEAL} />
            <Text style={[styles.sectionHeading, { color: t.textPrimary, marginBottom: 0 }]}>Handed Over Leads</Text>
          </View>
          <Text style={{ fontSize: 12, color: t.textSecondary }}>{data?.leads.length ?? 0}</Text>
        </View>

        {(data?.leads.length ?? 0) > 0 && (
          <View style={[styles.search, { backgroundColor: t.cardBg, borderColor: t.border }]}>
            <Search size={16} color={t.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={isAll ? 'Search lead, partner or agent...' : 'Search lead, contact or agent...'}
              placeholderTextColor={t.textMuted}
              style={{ flex: 1, color: t.textPrimary, fontSize: 14, paddingVertical: 0 }}
            />
            {search !== '' && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <X size={16} color={t.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ gap: 12 }}>
          {leads.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: t.cardBg, borderColor: t.border }]}>
              <Handshake size={34} color={t.textMuted} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: t.textPrimary, marginTop: 6 }}>
                {search ? 'No matching leads' : 'No handed-over leads yet'}
              </Text>
              <Text style={{ fontSize: 12, color: t.textSecondary, textAlign: 'center', marginTop: 4 }}>
                {search
                  ? 'Try a different search.'
                  : isAll
                  ? 'Partner leads marked Ready to Book will appear here with booking and commission status.'
                  : 'Leads you mark Ready to Book will appear here with booking and commission status.'}
              </Text>
            </View>
          ) : (
            leads.map((l) => <LeadCard key={l.leadId} lead={l} t={t} shadow={shadow} onPress={setDetailId} />)
          )}
        </View>
      </ScrollView>

      <LeadDetailsSheet leadId={detailId} onClose={() => setDetailId(null)} t={t} />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  retryBtn: { paddingHorizontal: 20, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  hero: {
    marginHorizontal: -16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    paddingTop: 28,
    paddingBottom: 28,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  glow1: { position: 'absolute', right: -30, top: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)' },
  glow2: { position: 'absolute', left: -20, bottom: -40, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#F4F5F5', letterSpacing: -0.6 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 8, lineHeight: 20 },
  heroGhost: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroGhostText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  sectionHeading: { fontSize: 15, fontWeight: '700', marginBottom: 12, letterSpacing: -0.2 },
  kpiGrid: { flexDirection: 'row', gap: 8 },
  kpiCard: { flex: 1, alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 4 },
  kpiIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  kpiValue: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  kpiLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  pipeline: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, marginTop: 12, paddingVertical: 14 },
  pipeCell: { flex: 1, alignItems: 'center' },

  search: { height: 44, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },

  leadCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  leadName: { fontSize: 15, fontWeight: '700' },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  infoGrid: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 12 },
  infoCell: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  commissionBox: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 12, borderRadius: 12 },

  empty: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28, maxHeight: '88%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  detailSection: { borderRadius: 14, borderWidth: 1, padding: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5, gap: 12 },
});
