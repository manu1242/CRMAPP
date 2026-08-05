import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  G,
} from 'react-native-svg';
import {
  Users,
  TrendingUp,
  IndianRupee,
  BarChart3,
  AlertCircle,
  Crown,
  Zap,
} from 'lucide-react-native';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import {
  partnerDashboardService,
  PartnerDashboardData,
} from '../services/PartnerDashboardService';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(val: number | undefined | null): string {
  const v = val ?? 0;
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    New: '#f59e0b',
    Contacted: '#3b82f6',
    Qualified: '#10b981',
    Converted: '#059669',
    'Site Visit': '#8b5cf6',
    Booked: '#10b981',
    Lost: '#ef4444',
  };
  const key = Object.keys(map).find((k) =>
    status.toLowerCase().includes(k.toLowerCase())
  );
  return key ? map[key] : '#64748b';
}

// ─── Bar Chart: Lead Performance ─────────────────────────────────────────────

interface BarChartProps {
  data: { month: string; leads: number; conversions: number }[];
  width: number;
  height: number;
  subTextColor: string;
}

function LeadPerformanceChart({ data, width, height, subTextColor }: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: subTextColor, fontSize: 12 }}>No data available</Text>
      </View>
    );
  }

  const paddingLeft = 32;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 32;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.flatMap((d) => [d.leads, d.conversions]), 1);
  const yMax = Math.ceil(maxVal * 1.2) || 1;
  const ySteps = 5;

  const groupWidth = chartW / data.length;
  const barWidth = Math.min((groupWidth - 8) / 2, 16);

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
          <Stop offset="100%" stopColor="#f59e0b" stopOpacity="0.7" />
        </LinearGradient>
        <LinearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#10b981" stopOpacity="1" />
          <Stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
        </LinearGradient>
      </Defs>

      {Array.from({ length: ySteps + 1 }).map((_, i) => {
        const yVal = (yMax / ySteps) * i;
        const yPos = paddingTop + chartH - (i / ySteps) * chartH;
        return (
          <React.Fragment key={`y-${i}`}>
            <Line
              x1={paddingLeft}
              y1={yPos}
              x2={width - paddingRight}
              y2={yPos}
              stroke={subTextColor}
              strokeOpacity={0.1}
              strokeWidth={1}
            />
            <SvgText
              x={paddingLeft - 4}
              y={yPos + 3.5}
              fontSize={8}
              fill={subTextColor}
              opacity={0.7}
              textAnchor="end"
            >
              {Math.round(yVal)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {data.map((d, i) => {
        const cx = paddingLeft + i * groupWidth + groupWidth / 2;
        const leadsH = (d.leads / yMax) * chartH;
        const convH = (d.conversions / yMax) * chartH;

        return (
          <G key={`bar-${i}`}>
            <Path
              d={`M ${cx - barWidth - 1} ${paddingTop + chartH - leadsH} 
                  L ${cx - 1} ${paddingTop + chartH - leadsH}
                  L ${cx - 1} ${paddingTop + chartH}
                  L ${cx - barWidth - 1} ${paddingTop + chartH} Z`}
              fill="url(#leadsGrad)"
            />
            <Path
              d={`M ${cx + 1} ${paddingTop + chartH - convH} 
                  L ${cx + barWidth + 1} ${paddingTop + chartH - convH}
                  L ${cx + barWidth + 1} ${paddingTop + chartH}
                  L ${cx + 1} ${paddingTop + chartH} Z`}
              fill="url(#convGrad)"
            />
            <SvgText
              x={cx}
              y={height - 6}
              fontSize={9}
              fill={subTextColor}
              opacity={0.8}
              textAnchor="middle"
            >
              {d.month}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Pie / Donut Chart: Lead Status ───────────────────────────────────────────

interface DonutChartProps {
  newLeads: number;
  contacted: number;
  qualified: number;
  converted: number;
  size: number;
}

function LeadStatusDonut({ newLeads, contacted, qualified, converted, size }: DonutChartProps) {
  const total = newLeads + contacted + qualified + converted;

  const segments = [
    { label: 'New', value: newLeads, color: '#f59e0b' },
    { label: 'Contacted', value: contacted, color: '#3b82f6' },
    { label: 'Qualified', value: qualified, color: '#10b981' },
    { label: 'Converted', value: converted, color: '#059669' },
  ].filter((s) => s.value > 0);

  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.38;
  const r = size * 0.22;

  if (total === 0) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke="#e2e8f0" strokeWidth={R - r} />
        </Svg>
        <Text
          style={{
            position: 'absolute',
            fontSize: 11,
            color: '#94a3b8',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          No data
        </Text>
      </View>
    );
  }

  let startAngle = -Math.PI / 2;
  const arcs: { path: string; color: string; label: string }[] = [];

  segments.forEach((seg) => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;

    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const ix1 = cx + r * Math.cos(endAngle);
    const iy1 = cy + r * Math.sin(endAngle);
    const ix2 = cx + r * Math.cos(startAngle);
    const iy2 = cy + r * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = `
      M ${x1} ${y1}
      A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}
      L ${ix1} ${iy1}
      A ${r} ${r} 0 ${largeArc} 0 ${ix2} ${iy2}
      Z
    `;

    arcs.push({ path, color: seg.color, label: seg.label });
    startAngle = endAngle;
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ position: 'relative', width: size, height: size }}>
        <Svg width={size} height={size}>
          {arcs.map((arc, i) => (
            <Path key={i} d={arc.path} fill={arc.color} />
          ))}
          <Circle cx={cx} cy={cy} r={r - 2} fill="#ffffff10" />
        </Svg>
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#10b981' }}>{total}</Text>
          <Text style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>Total</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Commission Trend Line ────────────────────────────────────────────────────

interface LineChartProps {
  data: { month: string; commission: number }[];
  width: number;
  height: number;
  subTextColor: string;
}

function CommissionTrendChart({ data, width, height, subTextColor }: LineChartProps) {
  if (!data || data.length < 2) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: subTextColor, fontSize: 12 }}>No commission data</Text>
      </View>
    );
  }

  const paddingLeft = 40;
  const paddingRight = 12;
  const paddingTop = 12;
  const paddingBottom = 28;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.commission), 1);
  const yMax = Math.ceil(maxVal * 1.2) || 1;
  const ySteps = 4;

  const points = data.map((d, i) => ({
    x: paddingLeft + (i / Math.max(data.length - 1, 1)) * chartW,
    y: paddingTop + chartH - (d.commission / yMax) * chartH,
  }));

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cpx = (points[i - 1].x + points[i].x) / 2;
    linePath += ` C ${cpx} ${points[i - 1].y}, ${cpx} ${points[i].y}, ${points[i].x} ${points[i].y}`;
  }

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <Stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
        </LinearGradient>
      </Defs>

      {Array.from({ length: ySteps + 1 }).map((_, i) => {
        const yVal = (yMax / ySteps) * i;
        const yPos = paddingTop + chartH - (i / ySteps) * chartH;
        return (
          <React.Fragment key={`yl-${i}`}>
            <Line
              x1={paddingLeft}
              y1={yPos}
              x2={width - paddingRight}
              y2={yPos}
              stroke={subTextColor}
              strokeOpacity={0.08}
              strokeWidth={1}
            />
            <SvgText
              x={paddingLeft - 4}
              y={yPos + 3.5}
              fontSize={8}
              fill={subTextColor}
              opacity={0.7}
              textAnchor="end"
            >
              {yVal >= 1000 ? `${(yVal / 1000).toFixed(0)}k` : Math.round(yVal)}
            </SvgText>
          </React.Fragment>
        );
      })}

      <Path d={areaPath} fill="url(#commGrad)" />
      <Path d={linePath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" />

      {points.map((p, i) => (
        <React.Fragment key={`dot-${i}`}>
          <Circle cx={p.x} cy={p.y} r={5} fill="#10b981" fillOpacity={0.1} />
          <Circle cx={p.x} cy={p.y} r={3} fill="#10b981" stroke="#fff" strokeWidth={1.5} />
        </React.Fragment>
      ))}

      {data.map((d, i) => (
        <SvgText
          key={`xl-${i}`}
          x={points[i].x}
          y={height - 6}
          fontSize={9}
          fill={subTextColor}
          opacity={0.8}
          textAnchor="middle"
        >
          {d.month}
        </SvgText>
      ))}
    </Svg>
  );
}

export default function PartnerDashboardContent() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const user = useAuthStore((s) => s.user);
  const isImpersonating = useAuthStore((s) => s.isImpersonating);

  const [data, setData] = useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await partnerDashboardService.getDashboardData();
      setData(result);
    } catch (err: any) {
      console.error('[PartnerDashboard] Error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const chartWidth = SCREEN_WIDTH - 48;

  if (loading && !data) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading Partner Dashboard…
        </Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: bgColor }]}>
        <AlertCircle size={40} color="#ef4444" />
        <Text style={[styles.errorTitle, { color: textColor }]}>Failed to Load</Text>
        <Text style={[styles.errorMsg, { color: subTextColor }]}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => fetchData()}
        >
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const d = data ?? {
    totalLeads: 0,
    totalCommission: 0,
    conversionRate: 0,
    monthlyRevenue: 0,
    leadPerformance: [],
    leadStatus: { newLeads: 0, contacted: 0, qualified: 0, converted: 0 },
    commissionTrend: [],
    recentLeads: [],
  };

  const statCards = [
    {
      label: 'My Leads',
      value: d.totalLeads.toString(),
      icon: Users,
      color: '#10b981',
      bg: '#10b98115',
    },
    {
      label: 'Total Commission',
      value: formatCurrency(d.totalCommission),
      icon: IndianRupee,
      color: '#10b981',
      bg: '#10b98115',
    },
    {
      label: 'Conversion Rate',
      value: `${Number(d.conversionRate ?? 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: '#3b82f6',
      bg: '#3b82f615',
    },
    {
      label: 'This Month Revenue',
      value: formatCurrency(d.monthlyRevenue),
      icon: IndianRupee,
      color: '#f59e0b',
      bg: '#f59e0b15',
    },
  ];

  const { newLeads, contacted, qualified, converted } = d.leadStatus;
  const legendItems = [
    { label: 'New', color: '#f59e0b', count: newLeads },
    { label: 'Contacted', color: '#3b82f6', count: contacted },
    { label: 'Qualified', color: '#10b981', count: qualified },
    { label: 'Converted', color: '#059669', count: converted },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
          tintColor="#10b981"
          colors={['#10b981']}
        />
      }
    >
      <View style={[styles.pageHeader, { borderBottomColor: borderCol }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.pageHeaderIcon}>
            <BarChart3 size={20} color="#10b981" />
          </View>
          <View>
            <Text style={[styles.pageTitle, { color: textColor }]}>Partner Dashboard</Text>
            <Text style={[styles.pageSubtitle, { color: subTextColor }]}>
              {isImpersonating ? `Viewing as: ${user?.username ?? 'Partner'}` : 'Your performance overview'}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 16 }}>
        <View style={styles.trialBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Crown size={18} color="#fff" />
            <View>
              <Text style={styles.trialTitle}>Free Trial Active</Text>
              <Text style={styles.trialSub}>
                Upgrade your plan to unlock all features
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeBtn}>
            <Zap size={12} color="#f59e0b" />
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {statCards.map((card, i) => (
            <View
              key={i}
              style={[
                styles.statCard,
                { backgroundColor: cardBg, borderColor: borderCol },
              ]}
            >
              <View style={[styles.statIconWrap, { backgroundColor: card.bg }]}>
                <card.icon size={18} color={card.color} />
              </View>
              <Text style={[styles.statValue, { color: textColor }]}>{card.value}</Text>
              <Text style={[styles.statLabel, { color: subTextColor }]}>{card.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.cardHeader}>
            <BarChart3 size={16} color="#10b981" />
            <Text style={[styles.cardTitle, { color: textColor }]}>
              Lead Performance (Last 6 Months)
            </Text>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={[styles.legendLabel, { color: subTextColor }]}>Total Leads</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.legendLabel, { color: subTextColor }]}>Conversions</Text>
            </View>
          </View>

          <LeadPerformanceChart
            data={d.leadPerformance}
            width={chartWidth}
            height={180}
            subTextColor={subTextColor}
          />
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.cardHeader}>
            <TrendingUp size={16} color="#3b82f6" />
            <Text style={[styles.cardTitle, { color: textColor }]}>Lead Status</Text>
          </View>

          <View style={styles.donutRow}>
            <LeadStatusDonut
              newLeads={newLeads}
              contacted={contacted}
              qualified={qualified}
              converted={converted}
              size={SCREEN_WIDTH * 0.42}
            />
            <View style={styles.legendCol}>
              {legendItems.map((item, i) => (
                <View key={i} style={styles.legendColItem}>
                  <View style={[styles.legendSquare, { backgroundColor: item.color }]} />
                  <View>
                    <Text style={[styles.legendColLabel, { color: subTextColor }]}>{item.label}</Text>
                    <Text style={[styles.legendColValue, { color: textColor }]}>{item.count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.cardHeader}>
            <IndianRupee size={16} color="#10b981" />
            <Text style={[styles.cardTitle, { color: textColor }]}>Commission Trend</Text>
          </View>
          <CommissionTrendChart
            data={d.commissionTrend}
            width={chartWidth}
            height={170}
            subTextColor={subTextColor}
          />
        </View>

        {d.recentLeads && d.recentLeads.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.cardHeader}>
              <Users size={16} color="#3b82f6" />
              <Text style={[styles.cardTitle, { color: textColor }]}>Recent Leads</Text>
            </View>

            {d.recentLeads.slice(0, 8).map((lead, i) => {
              const statusColor = getStatusColor(lead.status);
              return (
                <React.Fragment key={i}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: borderCol }]} />}
                  <View style={styles.leadRow}>
                    <View
                      style={[styles.leadAvatar, { backgroundColor: `${statusColor}20` }]}
                    >
                      <Text style={[styles.leadAvatarText, { color: statusColor }]}>
                        {(lead.name ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.leadName, { color: textColor }]} numberOfLines={1}>
                        {lead.name}
                      </Text>
                      <Text style={[styles.leadDate, { color: subTextColor }]}>{lead.date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                          {lead.status}
                        </Text>
                      </View>
                      {lead.value > 0 && (
                        <Text style={[styles.leadValue, { color: '#10b981' }]}>
                          {formatCurrency(lead.value)}
                        </Text>
                      )}
                    </View>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  errorMsg: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  pageHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#10b98115',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  trialTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  trialSub: {
    color: '#ffffffcc',
    fontSize: 11,
    marginTop: 1,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeBtnText: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: -4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  legendCol: {
    gap: 10,
  },
  legendColItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendColLabel: {
    fontSize: 11,
  },
  legendColValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  leadAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leadAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  leadName: {
    fontSize: 13,
    fontWeight: '600',
  },
  leadDate: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  leadValue: {
    fontSize: 11,
    fontWeight: '700',
  },
});
