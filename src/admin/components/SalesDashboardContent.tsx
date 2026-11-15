import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Path,
  Rect,
  Text as SvgText,
  Line,
  Circle,
} from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
  ArrowDownRight,
  Sparkles,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  IndianRupee,
  Receipt,
  FileText,
  SlidersHorizontal,
  Home,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { useSalesOverviewQuery } from '../hooks/useDashboardQuery';
import { useBottomNavSpacing } from '../../hooks/useBottomNavSpacing';
import { useDashboardScrollHandler } from '../store/useHeaderScrollStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

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

export default function SalesDashboardContent() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const handleScroll = useDashboardScrollHandler();

  const { data, isLoading, isRefetching, refetch } = useSalesOverviewQuery();

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
          Loading Sales Overview...
        </Text>
      </View>
    );
  }

  const {
    totalEarning = 0,
    totalExpenses = 0,
    totalProfit = 0,
    totalBookings = 0,
    salesReport = [],
    recentBookings = [],
    salesStatus = { paidCount: 0, pendingCount: 0, overdueCount: 0 },
  } = data || {};

  const totalStatusCount =
    (salesStatus.paidCount || 0) +
    (salesStatus.pendingCount || 0) +
    (salesStatus.overdueCount || 0) || 1;

  const paidPct = Math.round(((salesStatus.paidCount || 0) / totalStatusCount) * 100);
  const pendingPct = Math.round(((salesStatus.pendingCount || 0) / totalStatusCount) * 100);
  const overduePct = Math.round(((salesStatus.overdueCount || 0) / totalStatusCount) * 100);

  // SVG Chart Dimensions
  const chartW = SCREEN_WIDTH - 64;
  const chartH = 150;
  const maxSales = Math.max(...salesReport.map((s) => s.sales), 1000);
  const yMax = Math.ceil(maxSales * 1.2) || 1000;
  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 28;
  const plotW = chartW - paddingLeft - paddingRight;
  const plotH = chartH - paddingTop - paddingBottom;

  const chartPoints = salesReport.map((item, idx) => ({
    x: paddingLeft + (idx / Math.max(salesReport.length - 1, 1)) * plotW,
    y: paddingTop + plotH - (item.sales / yMax) * plotH,
    ...item,
  }));

  let linePath = chartPoints.length > 0 ? `M ${chartPoints[0].x} ${chartPoints[0].y}` : '';
  for (let i = 1; i < chartPoints.length; i++) {
    const prev = chartPoints[i - 1];
    const curr = chartPoints[i];
    const cpx1 = (prev.x + curr.x) / 2;
    const cpy1 = prev.y;
    const cpx2 = (prev.x + curr.x) / 2;
    const cpy2 = curr.y;
    linePath += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
  }
  const areaPath =
    chartPoints.length > 0
      ? linePath +
        ` L ${chartPoints[chartPoints.length - 1].x} ${paddingTop + plotH} L ${chartPoints[0].x} ${paddingTop + plotH} Z`
      : '';

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
          <Text style={styles.heroTitle}>Sales & Revenue Pulse</Text>
          <Text style={styles.heroSubtitle}>
            {`Tracking ${totalBookings} total bookings and ${formatCurrency(totalEarning)} in collections across active quarters.`}
          </Text>

          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              onPress={() => router.push('/admin/SalesUnit/bookings' as any)}
              style={styles.heroPrimaryBtn}
              activeOpacity={0.8}
            >
              <Text style={[styles.heroPrimaryBtnText, { color: adminTheme.brandHover }]}>Manage Bookings</Text>
              <ChevronRight size={14} color={adminTheme.brandHover} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/admin/SalesUnit/quotation' as any)}
              style={styles.heroSecondaryBtn}
              activeOpacity={0.8}
            >
              <SlidersHorizontal size={14} color="#ffffff" />
              <Text style={styles.heroSecondaryBtnText}>Quotations</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ExpoLinearGradient>

      {/* ── 2. Bento Grid Sales Metrics ── */}
      <View style={{ marginBottom: 24 }}>
        <Text style={[styles.sectionHeading, { color: textColor }]}>Sales Financials</Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Left Hero Card - Total Earning */}
          <View
            style={[
              styles.bentoLeftCard,
              { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow },
            ]}
          >
            <View style={{ paddingTop: 4, zIndex: 1 }}>
              <Text style={[styles.cardLabel, { color: subTextColor }]}>Total Earning</Text>
              <Text style={[styles.bentoBigValue, { color: textColor }]} numberOfLines={1}>
                {formatCurrency(totalEarning)}
              </Text>
              <Text style={[styles.cardTagText, { color: subTextColor }]}>
                📈 Gross Collections
              </Text>
            </View>

            <Image
              source={require('../../../assets/images/dashrev.png')}
              style={styles.bentoLeftImg}
            />
          </View>

          {/* Right Column - Stacked Cards */}
          <View style={{ flex: 1, gap: 12, height: 150 }}>
            {/* Top Card - Expenses */}
            <View
              style={[
                styles.bentoRightCard,
                { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow },
              ]}
            >
              <View style={{ gap: 2, zIndex: 1 }}>
                <Text style={[styles.cardLabel, { color: subTextColor }]} numberOfLines={1}>
                  Total Expenses
                </Text>
                <Text style={[styles.bentoSmallValue, { color: textColor }]} numberOfLines={1}>
                  {formatCurrency(totalExpenses)}
                </Text>
              </View>

              <Image
                source={require('../../../assets/images/dashnet.png')}
                style={styles.bentoRightImg}
              />
            </View>

            {/* Bottom Card - Net Profit */}
            <View
              style={[
                styles.bentoRightCard,
                { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow },
              ]}
            >
              <View style={{ gap: 2, zIndex: 1 }}>
                <Text style={[styles.cardLabel, { color: subTextColor }]} numberOfLines={1}>
                  Net Profit
                </Text>
                <Text style={[styles.bentoSmallValue, { color: textColor }]} numberOfLines={1}>
                  {formatCurrency(totalProfit)}
                </Text>
              </View>

              <Image
                source={require('../../../assets/images/reports.png')}
                style={styles.bentoRightImg}
              />
            </View>
          </View>
        </View>
      </View>

      {/* ── 3. 4-Card Status Grid ── */}
      <View style={{ marginBottom: 24 }}>
        <Text style={[styles.sectionHeading, { color: textColor }]}>Bookings & Invoices Summary</Text>

        <View style={styles.statsGrid}>
          {/* Total Bookings */}
          <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.statBoxLabel, { color: subTextColor }]}>Total Bookings</Text>
              <View style={[styles.statBoxIconWrap, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                <ShoppingBag size={14} color="#3b82f6" />
              </View>
            </View>
            <Text style={[styles.statBoxValue, { color: textColor }]}>{totalBookings}</Text>
            <Text style={[styles.statBoxSub, { color: '#3b82f6' }]}>Active Units</Text>
          </View>

          {/* Paid Settlements */}
          <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.statBoxLabel, { color: subTextColor }]}>Settled / Paid</Text>
              <View style={[styles.statBoxIconWrap, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                <CheckCircle2 size={14} color="#10b981" />
              </View>
            </View>
            <Text style={[styles.statBoxValue, { color: textColor }]}>{salesStatus.paidCount || 0}</Text>
            <Text style={[styles.statBoxSub, { color: '#10b981' }]}>{paidPct}% Complete</Text>
          </View>

          {/* Pending Collections */}
          <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.statBoxLabel, { color: subTextColor }]}>Pending Due</Text>
              <View style={[styles.statBoxIconWrap, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                <Clock size={14} color="#f59e0b" />
              </View>
            </View>
            <Text style={[styles.statBoxValue, { color: textColor }]}>{salesStatus.pendingCount || 0}</Text>
            <Text style={[styles.statBoxSub, { color: '#f59e0b' }]}>{pendingPct}% Outstanding</Text>
          </View>

          {/* Overdue */}
          <View style={[styles.statBox, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.statBoxLabel, { color: subTextColor }]}>Overdue Invoices</Text>
              <View style={[styles.statBoxIconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <AlertCircle size={14} color="#ef4444" />
              </View>
            </View>
            <Text style={[styles.statBoxValue, { color: textColor }]}>{salesStatus.overdueCount || 0}</Text>
            <Text style={[styles.statBoxSub, { color: '#ef4444' }]}>{overduePct}% Delayed</Text>
          </View>
        </View>
      </View>

      {/* ── 4. Interactive SVG Monthly Sales Volume Chart ── */}
      {salesReport.length > 0 && (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                <TrendingUp size={16} color="#10b981" />
              </View>
              <View>
                <Text style={[styles.cardHeaderTitle, { color: textColor }]}>Monthly Sales Trend</Text>
                <Text style={[styles.cardHeaderSub, { color: subTextColor }]}>Realized volume across quarters</Text>
              </View>
            </View>

            <View style={[styles.pillBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.10)' }]}>
              <Text style={[styles.pillBadgeText, { color: '#10b981' }]}>Last 6 Months</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Svg width={chartW} height={chartH}>
              <Defs>
                <SvgLinearGradient id="salesVolGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <Stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                </SvgLinearGradient>
              </Defs>

              {/* Dotted Gridlines */}
              {[0, 1, 2, 3].map((step) => {
                const yPos = paddingTop + (step / 3) * plotH;
                const val = Math.round(yMax - (step / 3) * yMax);
                return (
                  <React.Fragment key={`grid-${step}`}>
                    <Line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={chartW - paddingRight}
                      y2={yPos}
                      stroke={subTextColor}
                      strokeOpacity={0.08}
                      strokeWidth={1}
                      strokeDasharray="3,4"
                    />
                    <SvgText
                      x={paddingLeft - 8}
                      y={yPos + 3.5}
                      fontSize={9}
                      fontWeight="500"
                      fill={subTextColor}
                      opacity={0.7}
                      textAnchor="end"
                    >
                      {formatCurrency(val)}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* Area & Line */}
              {areaPath ? <Path d={areaPath} fill="url(#salesVolGrad)" /> : null}
              {linePath ? (
                <Path
                  d={linePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {/* Point Circles & X Labels */}
              {chartPoints.map((pt, i) => (
                <React.Fragment key={`pt-${i}`}>
                  <Circle cx={pt.x} cy={pt.y} r={5} fill="#10b981" fillOpacity={0.15} />
                  <Circle cx={pt.x} cy={pt.y} r={2.5} fill="#10b981" stroke="#fff" strokeWidth={1.5} />
                  <SvgText
                    x={pt.x}
                    y={paddingTop + plotH + 18}
                    fontSize={10}
                    fontWeight="600"
                    fill={subTextColor}
                    textAnchor="middle"
                  >
                    {pt.month}
                  </SvgText>
                </React.Fragment>
              ))}
            </Svg>
          </View>
        </View>
      )}

      {/* ── 5. Collections & Recovery Progress Breakdown ── */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Receipt size={16} color="#f59e0b" />
            </View>
            <View>
              <Text style={[styles.cardHeaderTitle, { color: textColor }]}>Collections Health</Text>
              <Text style={[styles.cardHeaderSub, { color: subTextColor }]}>Realized vs Pending vs Overdue</Text>
            </View>
          </View>
        </View>

        {/* Segmented Bar */}
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
            <Text style={[styles.legendValue, { color: textColor }]}>{salesStatus.paidCount || 0}</Text>
            <Text style={[styles.legendPct, { color: '#10b981' }]}>{paidPct}%</Text>
          </View>

          <View style={[styles.legendBox, { backgroundColor: isDark ? '#141414' : '#f8fafc', borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={[styles.legendLabel, { color: subTextColor }]}>Pending</Text>
            </View>
            <Text style={[styles.legendValue, { color: textColor }]}>{salesStatus.pendingCount || 0}</Text>
            <Text style={[styles.legendPct, { color: '#f59e0b' }]}>{pendingPct}%</Text>
          </View>

          <View style={[styles.legendBox, { backgroundColor: isDark ? '#141414' : '#f8fafc', borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.legendLabel, { color: subTextColor }]}>Overdue</Text>
            </View>
            <Text style={[styles.legendValue, { color: textColor }]}>{salesStatus.overdueCount || 0}</Text>
            <Text style={[styles.legendPct, { color: '#ef4444' }]}>{overduePct}%</Text>
          </View>
        </View>
      </View>

      {/* ── 6. Recent Bookings List (Admin Card Pattern) ── */}
      {recentBookings.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                <ShoppingBag size={16} color="#3b82f6" />
              </View>
              <Text style={[styles.sectionHeadingTitle, { color: textColor }]}>Recent Bookings</Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/admin/SalesUnit/bookings' as any)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>View All</Text>
              <ChevronRight size={12} color="#10b981" />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 10, marginTop: 12 }}>
            {recentBookings.slice(0, 5).map((b) => {
              const isPaid = (b.status || '').toLowerCase() === 'confirmed' || (b.status || '').toLowerCase() === 'paid';
              return (
                <View
                  key={b.bookingId}
                  style={[styles.itemCard, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View style={[styles.avatarBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                      <Home size={16} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: textColor }]} numberOfLines={1}>
                        {b.customerName || 'Direct Booking'}
                      </Text>
                      <Text style={[styles.itemSubtitle, { color: subTextColor }]} numberOfLines={1}>
                        Booking #{b.bookingId}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                    <Text style={[styles.itemAmount, { color: textColor }]}>
                      {formatCurrency(b.bookingAmount)}
                    </Text>
                    <View
                      style={[
                        styles.itemStatusPill,
                        {
                          backgroundColor: isPaid ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                          borderColor: isPaid ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemStatusPillText,
                          { color: isPaid ? '#10b981' : '#f59e0b' },
                        ]}
                      >
                        {b.status || 'Active'}
                      </Text>
                    </View>
                    <Text style={[styles.itemDate, { color: subTextColor }]}>
                      {formatDate(b.createdOn)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statBoxIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.4,
  },
  statBoxSub: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
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
    marginTop: 3,
  },
});
