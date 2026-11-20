import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  CheckSquare,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  User,
  ChevronRight,
  Receipt,
  FileCheck,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { useMilestoneTrackingQuery } from '../hooks/useDashboardQuery';
import { useBottomNavSpacing } from '../../hooks/useBottomNavSpacing';
import { useDashboardScrollHandler } from '../store/useHeaderScrollStore';

function formatCurrency(val: number | string | undefined | null): string {
  const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  const v = isNaN(num) ? 0 : num;
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000) return `${sign}₹${(abs / 100_000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export default function MilestoneDashboardContent() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const handleScroll = useDashboardScrollHandler();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');

  const { data, isLoading, isRefetching, refetch } = useMilestoneTrackingQuery(search);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const cardBorder = adminTheme.border;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const brandColor = adminTheme.brand;

  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.25 : 0.04,
      shadowRadius: 16,
    },
    android: { elevation: isDark ? 3 : 1 },
  });

  if (isLoading && !data) {
    return (
      <View style={[styles.centered, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={brandColor} />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading Milestone Payment Tracking...
        </Text>
      </View>
    );
  }

  const {
    stats = {
      totalMilestones: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalPending: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    },
    items = [],
  } = data || {};

  const totalInstallmentCount =
    (stats.paidCount || 0) + (stats.pendingCount || 0) + (stats.overdueCount || 0) || 1;
  const paidPct = Math.round(((stats.paidCount || 0) / totalInstallmentCount) * 100);
  const pendingPct = Math.round(((stats.pendingCount || 0) / totalInstallmentCount) * 100);
  const overduePct = Math.round(((stats.overdueCount || 0) / totalInstallmentCount) * 100);

  const collectionRate =
    stats.totalAmount > 0 ? Math.min(Math.round((stats.totalPaid / stats.totalAmount) * 100), 100) : 0;

  const filteredItems = items.filter((m) => {
    if (activeFilter === 'All') return true;
    const st = (m.status || '').trim().toLowerCase();
    if (activeFilter === 'Paid') return st === 'paid';
    if (activeFilter === 'Pending') return st === 'pending';
    if (activeFilter === 'Overdue') return st === 'overdue';
    return true;
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: bottomSpacing + 40 }}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[brandColor]}
          tintColor={brandColor}
        />
      }
    >
      {/* ── 1. Hero Gradient Header Banner (Admin Style) ── */}
      <ExpoLinearGradient
        colors={isDark ? ['#000000', '#064e3b'] : [brandColor, adminTheme.brandHover]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroGlow1} />
        <View style={styles.heroGlow2} />

        <View style={{ position: 'relative' }}>
          <Text style={styles.heroTitle}>Milestone Recovery</Text>
          <Text style={styles.heroSubtitle}>
            {`Tracking ${stats.totalMilestones} installments worth ${formatCurrency(stats.totalAmount)} across project stages.`}
          </Text>

          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              onPress={() => router.push('/admin/SalesUnit/bookings' as any)}
              style={styles.heroPrimaryBtn}
              activeOpacity={0.8}
            >
              <Text style={[styles.heroPrimaryBtnText, { color: adminTheme.brandHover }]}>View Bookings</Text>
              <ChevronRight size={14} color={adminTheme.brandHover} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/admin/SalesUnit/invoice' as any)}
              style={styles.heroSecondaryBtn}
              activeOpacity={0.8}
            >
              <SlidersHorizontal size={14} color="#ffffff" />
              <Text style={styles.heroSecondaryBtnText}>Invoices</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ExpoLinearGradient>

      {/* ── 2. Bento Grid Milestone Metrics ── */}
      <View style={{ marginBottom: 24 }}>
        <Text style={[styles.sectionHeading, { color: textColor }]}>Milestone Financials</Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Left Hero Card - Total Milestone Amount */}
          <View
            style={[
              styles.bentoLeftCard,
              { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow },
            ]}
          >
            <View style={{ paddingTop: 4, zIndex: 1 }}>
              <Text style={[styles.cardLabel, { color: subTextColor }]}>Total Milestones</Text>
              <Text style={[styles.bentoBigValue, { color: textColor }]} numberOfLines={1}>
                {formatCurrency(stats.totalAmount)}
              </Text>
              <Text style={[styles.cardTagText, { color: subTextColor }]}>
                🎯 {stats.totalMilestones} Scheduled Stages
              </Text>
            </View>

            <Image
              source={require('../../../assets/images/reports.png')}
              style={styles.bentoLeftImg}
            />
          </View>

          {/* Right Column - Stacked Cards */}
          <View style={{ flex: 1, gap: 12, height: 150 }}>
            {/* Top Card - Collected */}
            <View
              style={[
                styles.bentoRightCard,
                { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow },
              ]}
            >
              <View style={{ gap: 2, zIndex: 1 }}>
                <Text style={[styles.cardLabel, { color: subTextColor }]} numberOfLines={1}>
                  Total Collected
                </Text>
                <Text style={[styles.bentoSmallValue, { color: textColor }]} numberOfLines={1}>
                  {formatCurrency(stats.totalPaid)}
                </Text>
              </View>

              <Image
                source={require('../../../assets/images/dashrev.png')}
                style={styles.bentoRightImg}
              />
            </View>

            {/* Bottom Card - Pending Due */}
            <View
              style={[
                styles.bentoRightCard,
                { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow },
              ]}
            >
              <View style={{ gap: 2, zIndex: 1 }}>
                <Text style={[styles.cardLabel, { color: subTextColor }]} numberOfLines={1}>
                  Pending Due
                </Text>
                <Text style={[styles.bentoSmallValue, { color: textColor }]} numberOfLines={1}>
                  {formatCurrency(stats.totalPending)}
                </Text>
              </View>

              <Image
                source={require('../../../assets/images/dashnet.png')}
                style={styles.bentoRightImg}
              />
            </View>
          </View>
        </View>
      </View>

      {/* ── 3. Realization Progress & Health Card ── */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Receipt size={16} color="#10b981" />
            </View>
            <View>
              <Text style={[styles.cardHeaderTitle, { color: textColor }]}>Collection Realization</Text>
              <Text style={[styles.cardHeaderSub, { color: subTextColor }]}>Stage payment completion progress</Text>
            </View>
          </View>

          <View style={[styles.pillBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.10)' }]}>
            <Text style={[styles.pillBadgeText, { color: '#10b981' }]}>{collectionRate}% Realized</Text>
          </View>
        </View>

        {/* Segmented Progress Track */}
        <View style={styles.segmentedBarTrack}>
          <View style={[styles.segmentedBarFill, { width: `${paidPct}%`, backgroundColor: '#10b981' }]} />
          <View style={[styles.segmentedBarFill, { width: `${pendingPct}%`, backgroundColor: '#f59e0b' }]} />
          <View style={[styles.segmentedBarFill, { width: `${overduePct}%`, backgroundColor: '#ef4444' }]} />
        </View>

        {/* Legend Row */}
        <View style={styles.legendRow}>
          <View style={[styles.legendBox, { backgroundColor: isDark ? '#141414' : '#f8fafc', borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.legendLabel, { color: subTextColor }]}>Paid</Text>
            </View>
            <Text style={[styles.legendValue, { color: textColor }]}>{stats.paidCount || 0}</Text>
            <Text style={[styles.legendPct, { color: '#10b981' }]}>{paidPct}%</Text>
          </View>

          <View style={[styles.legendBox, { backgroundColor: isDark ? '#141414' : '#f8fafc', borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={[styles.legendLabel, { color: subTextColor }]}>Pending</Text>
            </View>
            <Text style={[styles.legendValue, { color: textColor }]}>{stats.pendingCount || 0}</Text>
            <Text style={[styles.legendPct, { color: '#f59e0b' }]}>{pendingPct}%</Text>
          </View>

          <View style={[styles.legendBox, { backgroundColor: isDark ? '#141414' : '#f8fafc', borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.legendLabel, { color: subTextColor }]}>Overdue</Text>
            </View>
            <Text style={[styles.legendValue, { color: textColor }]}>{stats.overdueCount || 0}</Text>
            <Text style={[styles.legendPct, { color: '#ef4444' }]}>{overduePct}%</Text>
          </View>
        </View>
      </View>

      {/* ── 4. Filter Pills & Live Search ── */}
      <View style={{ marginBottom: 16 }}>
        {/* Live Search Input */}
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
          <Search size={15} color={subTextColor} />
          <TextInput
            placeholder="Search lead, project, or unit..."
            placeholderTextColor={subTextColor}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: textColor }]}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.pillsRow}>
          {(['All', 'Paid', 'Pending', 'Overdue'] as const).map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.75}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? brandColor : isDark ? '#141414' : '#f1f5f9',
                    borderColor: isSelected ? brandColor : cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : subTextColor,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── 5. Milestone Items List (Admin Item Card Pattern) ── */}
      <View style={{ marginBottom: 24 }}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <CheckSquare size={16} color="#10b981" />
            </View>
            <Text style={[styles.sectionHeadingTitle, { color: textColor }]}>Installment Milestones</Text>
          </View>

          <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>
            {filteredItems.length} Stages
          </Text>
        </View>

        <View style={{ gap: 10, marginTop: 12 }}>
          {filteredItems.length === 0 ? (
            <View style={[styles.card, styles.emptyBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Receipt size={32} color={subTextColor} />
              <Text style={[styles.emptyText, { color: subTextColor, marginTop: 8 }]}>
                No milestone installments matching filter
              </Text>
            </View>
          ) : (
            filteredItems.map((item, index) => {
              const isPaid = (item.status || '').toLowerCase() === 'paid';
              const isPending = (item.status || '').toLowerCase() === 'pending';
              const statusColor = isPaid ? '#10b981' : isPending ? '#f59e0b' : '#ef4444';
              const progressPct = item.amount > 0 ? Math.min(Math.round((item.paid / item.amount) * 100), 100) : 0;

              return (
                <View
                  key={item.installmentId || index}
                  style={[styles.itemCard, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                    <View style={[styles.avatarBadge, { backgroundColor: `${statusColor}15`, marginTop: 2 }]}>
                      {isPaid ? (
                        <CheckCircle2 size={16} color={statusColor} />
                      ) : isPending ? (
                        <Clock size={16} color={statusColor} />
                      ) : (
                        <AlertCircle size={16} color={statusColor} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: textColor }]} numberOfLines={1}>
                        {item.milestone || 'Installment Stage'}
                      </Text>
                      <Text style={[styles.itemSubtitle, { color: subTextColor }]} numberOfLines={1}>
                        {item.project || 'Project'} • {item.flat || 'Unit'}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <User size={11} color={subTextColor} />
                        <Text style={{ fontSize: 11, color: subTextColor }} numberOfLines={1}>
                          {item.leadName || item.contact || 'Customer'}
                        </Text>
                      </View>

                      {/* Mini Progress Bar */}
                      <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.miniProgressTrack}>
                          <View
                            style={[
                              styles.miniProgressFill,
                              { width: `${progressPct}%`, backgroundColor: statusColor },
                            ]}
                          />
                        </View>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>
                          {progressPct}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                    <Text style={[styles.itemAmount, { color: textColor }]}>
                      {formatCurrency(item.amount)}
                    </Text>

                    <View
                      style={[
                        styles.itemStatusPill,
                        {
                          backgroundColor: `${statusColor}12`,
                          borderColor: `${statusColor}25`,
                        },
                      ]}
                    >
                      <Text style={[styles.itemStatusPillText, { color: statusColor }]}>
                        {item.status || 'Pending'}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Calendar size={10} color={subTextColor} />
                      <Text style={[styles.itemDate, { color: subTextColor }]}>
                        {formatDate(item.dueDate)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  heroBanner: {
    marginHorizontal: -16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    paddingTop: 28,
    paddingBottom: 28,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  heroGlow1: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroGlow2: {
    position: 'absolute',
    left: -20,
    bottom: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F4F5F5',
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '400',
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  heroPrimaryBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 2,
  },
  heroPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroSecondaryBtn: {
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
  heroSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  bentoLeftCard: {
    flex: 1.2,
    height: 150,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  bentoLeftImg: {
    position: 'absolute',
    bottom: -20,
    right: -10,
    width: 95,
    height: 95,
    opacity: 0.85,
    resizeMode: 'contain',
    zIndex: 0,
  },
  bentoRightCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
  },
  bentoRightImg: {
    position: 'absolute',
    bottom: -8,
    right: -4,
    width: 55,
    height: 55,
    opacity: 0.85,
    resizeMode: 'contain',
    zIndex: 0,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bentoBigValue: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.7,
  },
  cardTagText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  bentoSmallValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardHeaderSub: {
    fontSize: 11,
    marginTop: 2,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  segmentedBarTrack: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  segmentedBarFill: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  legendBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  legendPct: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  searchBox: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  miniProgressTrack: {
    width: 80,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  itemStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  itemStatusPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  itemDate: {
    fontSize: 10,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
