import React, { useState, useEffect, useCallback } from 'react';
import { useSafeObserve } from '../../api/observe';
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
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import AppFooter from '../../auth/components/AppFooter';
import {
  Users,
  TrendingUp,
  DollarSign,
  BarChart3,
  AlertCircle,
  ChevronRight,
  PieChart,
  Wallet,
  Share2,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import {
  dashboardService,
  DashboardData,
} from '../services/dashboardService';
import { useAdminDashboardQuery } from '../hooks/useDashboardQuery';
import DashboardSkeleton from './DashboardSkeleton';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(val: number | undefined | null): string {
  const v = val ?? 0;
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
}

function formatFullCurrency(val: number | undefined | null): string {
  const v = val ?? 0;
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getStageColor(stage?: string): string {
  const map: Record<string, string> = {
    'New': '#06b6d4',
    'Office Meeting': '#3b82f6',
    'Site Visit Requested': '#8b5cf6',
    'Site Visit Done': '#a855f7',
    'Quotation': '#f59e0b',
    'Quotation Sent': '#eab308',
    'Negotiation': '#f97316',
    'Booked': '#10b981',
    'Prospect': '#3b82f6',
    'Closed Won': '#10b981',
    'Closed Lost': '#ef4444',
  };
  return map[stage ?? ''] ?? '#64748b';
}

function getPaymentMethodIcon(method?: string): string {
  const m = (method ?? '').toLowerCase();
  if (m.includes('upi')) return '📱';
  if (m.includes('card') || m.includes('credit') || m.includes('debit')) return '💳';
  if (m.includes('cash')) return '💵';
  if (m.includes('bank') || m.includes('neft') || m.includes('rtgs') || m.includes('imps')) return '🏦';
  if (m.includes('cheque') || m.includes('check')) return '📝';
  return '💰';
}

// ─── SVG Area Chart ───────────────────────────────────────────────────────────

interface AreaChartProps {
  data: { label: string; value: number }[];
  width: number;
  height: number;
  color: string;
  gradientId: string;
  subTextColor: string;
}

function AreaChart({ data, width, height, color, gradientId, subTextColor }: AreaChartProps) {
  if (data.length === 0) return null;

  const paddingLeft = 36;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 28;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const yMax = Math.ceil(maxVal * 1.15) || 1;
  const ySteps = 5;

  const points = data.map((d, i) => ({
    x: paddingLeft + (i / Math.max(data.length - 1, 1)) * chartW,
    y: paddingTop + chartH - (d.value / yMax) * chartH,
  }));

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cpx1 = (points[i - 1].x + points[i].x) / 2;
    const cpy1 = points[i - 1].y;
    const cpx2 = (points[i - 1].x + points[i].x) / 2;
    const cpy2 = points[i].y;
    linePath += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${points[i].x} ${points[i].y}`;
  }

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.00" />
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
              {Math.round(yVal)}
            </SvgText>
          </React.Fragment>
        );
      })}

      <Path d={areaPath} fill={`url(#${gradientId})`} />
      <Path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={p.x} cy={p.y} r={6} fill={color} fillOpacity={0.12} />
          <Circle cx={p.x} cy={p.y} r={3} fill={color} stroke="#fff" strokeWidth={1.5} />
        </React.Fragment>
      ))}

      {data.map((d, i) => (
        <SvgText
          key={`x-${i}`}
          x={points[i].x}
          y={height - 6}
          fontSize={9}
          fontWeight="500"
          fill={subTextColor}
          opacity={0.7}
          textAnchor="middle"
        >
          {d.label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── Dual Line Chart ──────────────────────────────────────────────────────────

interface DualLineChartProps {
  data: { label: string; revenue: number; expenses: number }[];
  width: number;
  height: number;
  subTextColor: string;
}

function DualLineChart({ data, width, height, subTextColor }: DualLineChartProps) {
  if (data.length === 0) return null;

  const paddingLeft = 50;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 28;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.flatMap((d) => [d.revenue, d.expenses]), 1);
  const yMax = Math.ceil(maxVal * 1.15) || 1;
  const ySteps = 5;

  const makePoints = (values: number[]) =>
    values.map((v, i) => ({
      x: paddingLeft + (i / Math.max(values.length - 1, 1)) * chartW,
      y: paddingTop + chartH - (v / yMax) * chartH,
    }));

  const revPoints = makePoints(data.map((d) => d.revenue));
  const expPoints = makePoints(data.map((d) => d.expenses));

  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx1 = (pts[i - 1].x + pts[i].x) / 2;
      const cpy1 = pts[i - 1].y;
      const cpx2 = (pts[i - 1].x + pts[i].x) / 2;
      const cpy2 = pts[i].y;
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${pts[i].x} ${pts[i].y}`;
    }
    return path;
  };

  const revLinePath = buildSmoothPath(revPoints);
  const revAreaPath =
    revLinePath +
    ` L ${revPoints[revPoints.length - 1].x} ${paddingTop + chartH} L ${revPoints[0].x} ${paddingTop + chartH} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#10b981" stopOpacity="0.20" />
          <Stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
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
              {formatCurrency(yVal)}
            </SvgText>
          </React.Fragment>
        );
      })}

      <Path d={revAreaPath} fill="url(#revGrad)" />
      <Path d={revLinePath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={buildSmoothPath(expPoints)} fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {revPoints.map((p, i) => (
        <React.Fragment key={`r-${i}`}>
          <Circle cx={p.x} cy={p.y} r={5} fill="#10b981" fillOpacity={0.15} />
          <Circle cx={p.x} cy={p.y} r={2.5} fill="#10b981" stroke="#fff" strokeWidth={1.5} />
        </React.Fragment>
      ))}
      {expPoints.map((p, i) => (
        <React.Fragment key={`e-${i}`}>
          <Circle cx={p.x} cy={p.y} r={5} fill="#ef4444" fillOpacity={0.15} />
          <Circle cx={p.x} cy={p.y} r={2.5} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />
        </React.Fragment>
      ))}

      {data.map((d, i) => (
        <SvgText
          key={`x-${i}`}
          x={revPoints[i].x}
          y={height - 6}
          fontSize={9}
          fontWeight="500"
          fill={subTextColor}
          opacity={0.7}
          textAnchor="middle"
        >
          {d.label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── Modern Circular Donut Chart ───────────────────────────────────────────────

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size: number;
  textColor: string;
  subTextColor: string;
  isDark: boolean;
}

function DonutChart({ data, size = 190, textColor, subTextColor, isDark }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = data.length > 1 ? 6 : 0;

  let currentOffset = 0;

  const segments = data.map((d) => {
    const pct = d.value / total;
    const strokeLength = Math.max(0, pct * circumference - gap);
    const offset = currentOffset;
    currentOffset += pct * circumference;
    return {
      ...d,
      pct: Math.round(pct * 100),
      strokeLength,
      offset,
    };
  });

  const centerRadius = radius - strokeWidth / 2 - 8;

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <View style={{ position: 'relative', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {segments.map((seg, i) => (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.strokeLength} ${circumference - seg.strokeLength}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </Svg>

        <View
          style={{
            position: 'absolute',
            width: centerRadius * 2,
            height: centerRadius * 2,
            borderRadius: centerRadius,
            backgroundColor: isDark ? '#0C0C0C' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.05,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: '800', color: textColor, letterSpacing: -0.5 }}>
            {total}
          </Text>
          <View
            style={{
              marginTop: 2,
              backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.10)',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#10b981', letterSpacing: 0.5 }}>
              TOTAL LEADS
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 20, width: '100%' }}>
        {segments.map((d, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              minWidth: '45%',
              flex: 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: d.color,
                }}
              />
              <Text style={{ fontSize: 11, fontWeight: '600', color: textColor }}>
                {d.label}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>
                {d.value}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: d.color }}>
                ({d.pct}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── KPI Stat Card ────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  icon?: any;
  color: string;
  textColor: string;
  subTextColor: string;
  isDark: boolean;
}

function StatCard({
  title,
  value,
  sub,
  trend,
  trendUp,
  icon: Icon,
  color,
  textColor,
  subTextColor,
  isDark,
}: StatCardProps) {
  const cardBg = isDark ? '#0C0C0C' : '#ffffff';
  const cardBorder = isDark ? '#27272a' : '#e2e8f0';

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          ...Platform.select({
            ios: {
              shadowColor: color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.15 : 0.06,
              shadowRadius: 12,
            },
            android: { elevation: isDark ? 3 : 1 },
          }),
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor, letterSpacing: 0.3, flex: 1 }} numberOfLines={1}>
          {title}
        </Text>
        {Icon && (
          <View
            style={{
              backgroundColor: `${color}18`,
              borderColor: `${color}28`,
              borderWidth: 1,
              padding: 7,
              borderRadius: 10,
            }}
          >
            <Icon size={14} color={color} />
          </View>
        )}
      </View>

      <Text
        style={{ fontSize: 22, fontWeight: '800', color: textColor, letterSpacing: -0.5, marginBottom: 8 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {sub ? (
          <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '400', flex: 1 }} numberOfLines={1}>
            {sub}
          </Text>
        ) : <View />}
        {trend && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              backgroundColor: trendUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 20,
            }}
          >
            {trendUp
              ? <ArrowUpRight size={10} color="#10b981" />
              : <ArrowDownRight size={10} color="#ef4444" />}
            <Text style={{ fontSize: 10, fontWeight: '700', color: trendUp ? '#10b981' : '#ef4444' }}>
              {trend}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  icon?: any;
  iconColor?: string;
  textColor: string;
  subTextColor: string;
  onViewAll?: () => void;
}

function SectionHeader({ title, icon: Icon, iconColor, textColor, subTextColor, onViewAll }: SectionHeaderProps) {
  const { isDark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {Icon && (
          <View
            style={{
              backgroundColor: isDark ? `${iconColor ?? '#10b981'}15` : `${iconColor ?? '#10b981'}10`,
              padding: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isDark ? `${iconColor ?? '#10b981'}25` : `${iconColor ?? '#10b981'}15`,
            }}
          >
            <Icon size={13} color={iconColor ?? '#10b981'} />
          </View>
        )}
        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, letterSpacing: -0.2 }}>{title}</Text>
      </View>
      {onViewAll && (
        <TouchableOpacity
          onPress={onViewAll}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            backgroundColor: 'rgba(16,185,129,0.10)',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>View All</Text>
          <ChevronRight size={11} color="#10b981" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Pipeline Bar ─────────────────────────────────────────────────────────────

interface PipelineBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
  textColor: string;
  subTextColor: string;
  isDark: boolean;
}

function PipelineBar({ label, value, total, color, textColor, subTextColor, isDark }: PipelineBarProps) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <Text style={{ fontSize: 11, color: textColor, fontWeight: '500', flex: 1 }} numberOfLines={1}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 12, color: color, fontWeight: '700' }}>{value}</Text>
          <View
            style={{
              backgroundColor: `${color}15`,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 9, color: color, fontWeight: '700' }}>{Math.round(pct)}%</Text>
          </View>
        </View>
      </View>
      <View
        style={{
          height: 7,
          borderRadius: 4,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.max(pct, 2)}%`,
            height: '100%',
            borderRadius: 4,
            backgroundColor: color,
            opacity: 0.9,
          }}
        />
      </View>
    </View>
  );
}

// ─── Financial Progress Bar ───────────────────────────────────────────────────

interface FinancialBannerProps {
  totalRevenue: number;
  totalExpenses: number;
  textColor: string;
  subTextColor: string;
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
}

function FinancialBanner({
  totalRevenue,
  totalExpenses,
  textColor,
  subTextColor,
  isDark,
  cardBg,
  cardBorder,
}: FinancialBannerProps) {
  const expPct = totalRevenue > 0 ? Math.min((totalExpenses / totalRevenue) * 100, 100) : 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.25 : 0.05, shadowRadius: 12 },
            android: { elevation: isDark ? 3 : 1 },
          }),
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.07)',
              borderColor: isDark ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.12)',
              borderWidth: 1,
              padding: 9,
              borderRadius: 12,
            }}
          >
            <Wallet size={18} color="#ef4444" />
          </View>
          <View>
            <Text style={{ fontSize: 11, color: subTextColor, fontWeight: '500' }}>Total Expenses</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#ef4444', marginTop: 2, letterSpacing: -0.4 }}>
              {formatCurrency(totalExpenses)}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, color: subTextColor, fontWeight: '500' }}>Revenue</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#10b981', marginTop: 2, letterSpacing: -0.4 }}>
            {formatCurrency(totalRevenue)}
          </Text>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '500' }}>Expense Ratio</Text>
          <Text style={{ fontSize: 10, color: expPct > 80 ? '#ef4444' : '#10b981', fontWeight: '700' }}>
            {Math.round(expPct)}%
          </Text>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <View
            style={{
              width: `${expPct}%`,
              height: '100%',
              borderRadius: 4,
              backgroundColor: expPct > 80 ? '#ef4444' : '#10b981',
            }}
          />
        </View>
      </View>
    </View>
  );
}

export default function AdminDashboardContent() {
  const { isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const cardBg = adminTheme.cardBg;
  const cardBorder = adminTheme.border;

  const { markInteractive } = useSafeObserve();

  const {
    data: queryData,
    isLoading: loading,
    isRefetching: refreshing,
    error: queryError,
    refetch,
  } = useAdminDashboardQuery();

  const data = queryData || null;
  const error = queryError ? queryError.message : null;

  useEffect(() => {
    if (!loading) {
      markInteractive();
    }
  }, [loading, markInteractive]);

  const fetchAll = useCallback((isRefresh = false) => {
    refetch();
  }, [refetch]);

  const chartWidth = SCREEN_WIDTH - 64;

  const statCards = data
    ? [
        {
          title: 'Total Leads',
          value: `${data.totalLeads}`,
          sub: `${data.facebookLeads} from Facebook`,
          trend: '+12%',
          trendUp: true,
          icon: Users,
          color: '#10b981',
        },
        {
          title: 'Facebook Leads',
          value: `${data.facebookLeads}`,
          trend: '+8%',
          trendUp: true,
          icon: Share2,
          color: '#3b82f6',
        },
        {
          title: 'Total Revenue',
          value: formatCurrency(data.totalRevenue),
          sub: formatFullCurrency(data.totalRevenue),
          trend: '+15%',
          trendUp: true,
          icon: DollarSign,
          color: '#f59e0b',
        },
        {
          title: 'Net Profit',
          value: formatCurrency(data.totalProfit),
          sub: data.totalProfit >= 0 ? 'Profitable' : 'Net Loss',
          trend: data.totalProfit >= 0 ? '+5%' : '-3%',
          trendUp: data.totalProfit >= 0,
          icon: TrendingUp,
          color: data.totalProfit >= 0 ? '#10b981' : '#ef4444',
        },
      ]
    : [];

  const pipelineTotal = data?.pipeline?.reduce((a, b) => a + b.count, 0) ?? 0;
  const pipelineColors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7', '#f59e0b', '#eab308', '#f97316', '#10b981'];

  const sourceColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
  const sourceDonutData = (data?.sources ?? []).map((s, i) => ({
    label: s.source,
    value: s.count,
    color: sourceColors[i % sourceColors.length],
  }));

  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.30 : 0.05,
      shadowRadius: 14,
    },
    android: { elevation: isDark ? 4 : 1 },
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    const is401 = error.includes('401') || error.toLowerCase().includes('session expired');
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: 'rgba(239,68,68,0.10)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <AlertCircle size={28} color="#ef4444" />
        </View>
        <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>
          {is401 ? 'Session Expired' : 'Failed to Load'}
        </Text>
        <Text style={{ color: subTextColor, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
          {is401 ? 'Your session token has expired or is invalid. Please log in again.' : error}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (is401) {
              useAuthStore.getState().logout();
              router.replace('/main-login');
            } else {
              fetchAll();
            }
          }}
          style={{
            backgroundColor: '#10b981',
            paddingHorizontal: 28,
            paddingVertical: 12,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
            {is401 ? 'Go to Login' : 'Retry'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height="100%" width="100%">
          <Defs>
            <RadialGradient id="g1" cx="85%" cy="8%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#10b981" stopOpacity={isDark ? 0.07 : 0.04} />
              <Stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="g2" cx="15%" cy="42%" rx="55%" ry="55%">
              <Stop offset="0%" stopColor="#3b82f6" stopOpacity={isDark ? 0.05 : 0.02} />
              <Stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="g3" cx="80%" cy="80%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#06b6d4" stopOpacity={isDark ? 0.06 : 0.03} />
              <Stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#g1)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#g2)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#g3)" />
        </Svg>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAll(true)}
            colors={['#10b981']}
            tintColor="#10b981"
          />
        }
      >
        <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.07)',
                  borderColor: isDark ? 'rgba(16,185,129,0.24)' : 'rgba(16,185,129,0.14)',
                  borderWidth: 1,
                  padding: 10,
                  borderRadius: 14,
                }}
              >
                <BarChart3 size={20} color="#10b981" />
              </View>
              <View>
                <Text style={{ fontSize: 19, fontWeight: '800', color: textColor, letterSpacing: -0.5 }}>
                  Admin Dashboard
                </Text>
                <Text style={{ fontSize: 12, color: subTextColor, fontWeight: '400', marginTop: 2 }}>
                  Welcome back,{' '}
                  <Text style={{ color: '#10b981', fontWeight: '700' }}>{user?.username || 'Admin'}</Text>
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                borderColor: cardBorder,
                borderWidth: 1,
                padding: 10,
                borderRadius: 12,
              }}
              activeOpacity={0.7}
            >
              <Bell size={18} color={subTextColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statGrid}>
          {statCards.map((s, i) => (
            <StatCard
              key={i}
              {...s}
              textColor={textColor}
              subTextColor={subTextColor}
              isDark={isDark}
            />
          ))}
        </View>

        {data && (
          <FinancialBanner
            totalRevenue={data.totalRevenue}
            totalExpenses={data.totalExpenses}
            textColor={textColor}
            subTextColor={subTextColor}
            isDark={isDark}
            cardBg={cardBg}
            cardBorder={cardBorder}
          />
        )}

        {data && data.monthlyLeads.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
            <SectionHeader
              title="Lead Growth (Last 6 Months)"
              icon={TrendingUp}
              iconColor="#10b981"
              textColor={textColor}
              subTextColor={subTextColor}
            />
            <View style={{ marginTop: 14 }}>
              <AreaChart
                data={data.monthlyLeads.map((m) => ({ label: m.month, value: m.count }))}
                width={chartWidth}
                height={190}
                color="#10b981"
                gradientId="leadGrad"
                subTextColor={subTextColor}
              />
            </View>
          </View>
        )}

        {data && data.sources.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
            <SectionHeader
              title="Traffic Sources"
              icon={PieChart}
              iconColor="#10b981"
              textColor={textColor}
              subTextColor={subTextColor}
            />
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <DonutChart
                data={sourceDonutData}
                size={170}
                textColor={textColor}
                subTextColor={subTextColor}
                isDark={isDark}
              />
            </View>
          </View>
        )}

        {data && data.pipeline.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
            <SectionHeader
              title="Sales Pipeline"
              icon={BarChart3}
              iconColor="#3b82f6"
              textColor={textColor}
              subTextColor={subTextColor}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 12,
                marginBottom: 18,
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                padding: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: cardBorder,
              }}
            >
              <BarChart3 size={12} color={subTextColor} />
              <Text style={{ fontSize: 11, color: subTextColor, fontWeight: '500' }}>
                Total in pipeline:{' '}
                <Text style={{ color: textColor, fontWeight: '700' }}>
                  {pipelineTotal > 0 ? pipelineTotal : data.totalLeads}
                </Text>
              </Text>
            </View>
            {data.pipeline.map((item, i) => (
              <PipelineBar
                key={i}
                label={item.stage}
                value={item.count}
                total={pipelineTotal > 0 ? pipelineTotal : data.totalLeads}
                color={pipelineColors[i % pipelineColors.length]}
                textColor={textColor}
                subTextColor={subTextColor}
                isDark={isDark}
              />
            ))}
          </View>
        )}

        {data && data.newLeads.length > 0 && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                ...cardShadow,
                padding: 0,
                overflow: 'hidden',
              },
            ]}
          >
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
              <SectionHeader
                title="Recent Leads"
                icon={Users}
                iconColor="#10b981"
                textColor={textColor}
                subTextColor={subTextColor}
                onViewAll={() => router.push('/admin/leads' as any)}
              />
            </View>

            <View
              style={[
                styles.tableHeader,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderBottomColor: cardBorder,
                  borderTopColor: cardBorder,
                  borderTopWidth: 1,
                },
              ]}
            >
              <Text style={[styles.tableHeaderText, { color: subTextColor, flex: 1.3 }]}>NAME</Text>
              <Text style={[styles.tableHeaderText, { color: subTextColor, flex: 1 }]}>CONTACT</Text>
              <Text style={[styles.tableHeaderText, { color: subTextColor, flex: 0.9, textAlign: 'center' }]}>STAGE</Text>
              <Text style={[styles.tableHeaderText, { color: subTextColor, flex: 0.7, textAlign: 'right' }]}>DATE</Text>
            </View>

            {data.newLeads.map((lead, i) => (
              <TouchableOpacity
                key={lead.leadId}
                style={[
                  styles.tableRow,
                  {
                    borderBottomColor: cardBorder,
                    borderBottomWidth: i < data.newLeads.length - 1 ? 1 : 0,
                    backgroundColor:
                      i % 2 === 0
                        ? 'transparent'
                        : isDark
                        ? 'rgba(255,255,255,0.015)'
                        : 'rgba(0,0,0,0.015)',
                  },
                ]}
                onPress={() => router.push('/admin/leads' as any)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: textColor, flex: 1.3 }} numberOfLines={1}>
                  {lead.name}
                </Text>
                <Text style={{ fontSize: 11, color: subTextColor, flex: 1, fontWeight: '400' }} numberOfLines={1}>
                  {lead.contact}
                </Text>
                <View style={{ flex: 0.9, alignItems: 'center' }}>
                  <View
                    style={{
                      backgroundColor: getStageColor(lead.stage) + '18',
                      borderColor: getStageColor(lead.stage) + '30',
                      borderWidth: 1,
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '700', color: getStageColor(lead.stage) }}>
                      {lead.stage}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, color: subTextColor, flex: 0.7, textAlign: 'right', fontWeight: '400' }}>
                  {lead.createdOn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {data && data.revenueExpenses.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
            <SectionHeader
              title="Revenue vs Expenses"
              icon={DollarSign}
              iconColor="#10b981"
              textColor={textColor}
              subTextColor={subTextColor}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 4, paddingLeft: 4 }}>
              {[
                { label: 'Revenue', color: '#10b981' },
                { label: 'Expenses', color: '#ef4444' },
              ].map((leg) => (
                <View
                  key={leg.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: `${leg.color}10`,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: `${leg.color}20`,
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: leg.color }} />
                  <Text style={{ fontSize: 10, fontWeight: '600', color: textColor }}>{leg.label}</Text>
                </View>
              ))}
            </View>
            <View style={{ marginTop: 6 }}>
              <DualLineChart
                data={data.revenueExpenses.map((m) => ({
                  label: m.month,
                  revenue: m.revenue,
                  expenses: m.expenses,
                }))}
                width={chartWidth}
                height={200}
                subTextColor={subTextColor}
              />
            </View>
          </View>
        )}

        {data && data.recentTransactions.length > 0 && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                ...cardShadow,
                padding: 0,
                overflow: 'hidden',
              },
            ]}
          >
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
              <SectionHeader
                title="Recent Transactions"
                icon={Wallet}
                iconColor="#f59e0b"
                textColor={textColor}
                subTextColor={subTextColor}
              />
            </View>

            <View
              style={[
                styles.tableHeader,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderBottomColor: cardBorder,
                  borderTopColor: cardBorder,
                  borderTopWidth: 1,
                },
              ]}
            >
              <Text style={[styles.tableHeaderText, { color: subTextColor, flex: 1.4 }]}>AMOUNT</Text>
              <Text style={[styles.tableHeaderText, { color: subTextColor, flex: 0.9, textAlign: 'center' }]}>METHOD</Text>
              <Text style={[styles.tableHeaderText, { color: subTextColor, flex: 0.9, textAlign: 'right' }]}>DATE</Text>
            </View>

            {data.recentTransactions.map((txn, i) => (
              <View
                key={`${txn.paymentId}-${i}`}
                style={[
                  styles.tableRow,
                  {
                    borderBottomColor: cardBorder,
                    borderBottomWidth: i < data.recentTransactions.length - 1 ? 1 : 0,
                    backgroundColor:
                      i % 2 === 0
                        ? 'transparent'
                        : isDark
                        ? 'rgba(255,255,255,0.015)'
                        : 'rgba(0,0,0,0.015)',
                  },
                ]}
              >
                <View style={{ flex: 1.4, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16 }}>{getPaymentMethodIcon(txn.paymentMethod)}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
                    {formatFullCurrency(txn.amount)}
                  </Text>
                </View>
                <View style={{ flex: 0.9, alignItems: 'center' }}>
                  <View
                    style={{
                      backgroundColor: 'rgba(16,185,129,0.12)',
                      borderColor: 'rgba(16,185,129,0.22)',
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#10b981' }}>
                      {(txn.paymentMethod ?? 'N/A').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, color: subTextColor, flex: 0.9, textAlign: 'right', fontWeight: '400' }}>
                  {txn.paymentDate}
                </Text>
              </View>
            ))}
          </View>
        )}

        <AppFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
});
