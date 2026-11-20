import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSafeObserve } from '../../api/observe';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../auth/store/authStore';
import AppFooter from '../../auth/components/AppFooter';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import {
  Building2,
  MessageCircle,
  MailCheck,
  Ban,
  Layers,
  Plus,
  ChevronRight,
  TrendingUp,
  Activity,
  Globe,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  CreditCard,
  Users,
  Search,
  ExternalLink,
} from 'lucide-react-native';

import { useSuperAdminDashboardQuery } from '../dashboard/hooks/useSuperAdminDashboard';
import { RecentTenantItem, RecentInquiryItem } from '../dashboard/api/dashboard.api';

// ─── SKELETON LOADER ─────────────────────────────────────────────────────────
const SkeletonLoader = () => {
  const { isDark } = useTheme();
  const shimmerBg = isDark ? '#242424' : '#f1f5f9';
  const borderCol = isDark ? '#2e2e2e' : '#e2e8f0';

  return (
    <View
      style={{
        backgroundColor: isDark ? '#161616' : '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        flex: 1,
      }}
    >
      {/* Hero Skeleton */}
      <View
        style={{
          height: 140,
          backgroundColor: shimmerBg,
          borderRadius: 20,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: borderCol,
        }}
      />

      {/* Quick Actions Skeleton */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ alignItems: 'center', width: '22%' }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                backgroundColor: shimmerBg,
                borderWidth: 1,
                borderColor: borderCol,
                marginBottom: 8,
              }}
            />
            <View style={{ width: 44, height: 10, borderRadius: 4, backgroundColor: shimmerBg }} />
          </View>
        ))}
      </View>

      {/* 2x2 Grid Skeleton */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <View
          style={{
            flex: 1,
            height: 110,
            backgroundColor: shimmerBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: borderCol,
          }}
        />
        <View
          style={{
            flex: 1,
            height: 110,
            backgroundColor: shimmerBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: borderCol,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View
          style={{
            flex: 1,
            height: 110,
            backgroundColor: shimmerBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: borderCol,
          }}
        />
        <View
          style={{
            flex: 1,
            height: 110,
            backgroundColor: shimmerBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: borderCol,
          }}
        />
      </View>

      {/* List Area Skeleton */}
      <View
        style={{
          height: 180,
          backgroundColor: shimmerBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: borderCol,
        }}
      />
    </View>
  );
};

// ─── DASHBOARD CONTENT COMPONENT ────────────────────────────────────────────
export default function SuperAdminDashboardContent() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { markInteractive } = useSafeObserve();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const user = useAuthStore((state) => state.user);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    error: queryError,
  } = useSuperAdminDashboardQuery();

  const errorMessage = queryError ? queryError.message || 'Failed to load dashboard data' : null;

  useEffect(() => {
    if (!isLoading) {
      markInteractive();
    }
  }, [isLoading, markInteractive]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ─── ACCESSIBLE HIGH-CONTRAST PALETTE ─────────────────────────────────────
  const palette = useMemo(() => {
    if (isDark) {
      return {
        screenBg: '#161616',
        cardBg: '#222222',
        cardBgElevated: '#282828',
        border: '#2E2E2E',
        borderSubtle: '#262626',
        textPrimary: '#FFFFFF', // 100% pure white for headings & values
        textSecondary: '#D4D4D8', // High-contrast readable body (zinc-300)
        textMuted: '#A1A1AA', // Legible caption (zinc-400)
        iconColor: '#D4D4D8',
        brand: '#9D7BFA', // Luminance-boosted slate blue for dark backgrounds
        brandBg: 'rgba(157, 123, 250, 0.15)',
        brandBorder: 'rgba(157, 123, 250, 0.35)',
        success: '#34D399',
        successBg: 'rgba(16, 185, 129, 0.15)',
        warning: '#FBBF24',
        warningBg: 'rgba(245, 158, 11, 0.15)',
        danger: '#F87171',
        dangerBg: 'rgba(239, 68, 68, 0.15)',
        info: '#60A5FA',
        infoBg: 'rgba(59, 130, 246, 0.15)',
        cardShadow: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 3,
        },
      };
    }

    // Light Mode (WCAG AAA Compliant Contrast)
    return {
      screenBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardBgElevated: '#FFFFFF',
      border: '#E2E8F0',
      borderSubtle: '#F1F5F9',
      textPrimary: '#0F172A', // Deep dark slate near-black (14:1 contrast)
      textSecondary: '#334155', // Rich dark slate gray (8:1 contrast, very sharp)
      textMuted: '#64748B', // Medium slate (passes WCAG AA)
      iconColor: '#475569',
      brand: '#835CEE',
      brandBg: 'rgba(131, 92, 238, 0.10)',
      brandBorder: 'rgba(131, 92, 238, 0.25)',
      success: '#059669',
      successBg: '#ECFDF5',
      warning: '#D97706',
      warningBg: '#FFFBEB',
      danger: '#DC2626',
      dangerBg: '#FEF2F2',
      info: '#2563EB',
      infoBg: '#EFF6FF',
      cardShadow: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      },
    };
  }, [isDark]);

  const username = user?.username ? user.username.trim() : 'Super Admin';

  return (
    <View style={{ flex: 1, backgroundColor: palette.screenBg }}>
      {isLoading && !data ? (
        <SkeletonLoader />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 160 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                colors={['#835CEE']}
              />
            }
          >
            {/* ── ERROR STATE ────────────────────────────────────────────── */}
            {errorMessage ? (
              <View
                style={{
                  margin: 16,
                  padding: 24,
                  backgroundColor: palette.dangerBg,
                  borderWidth: 1,
                  borderColor: palette.danger,
                  borderRadius: 16,
                  alignItems: 'center',
                  marginTop: 24,
                }}
              >
                <Text
                  style={{
                    color: palette.danger,
                    fontWeight: '800',
                    fontSize: 16,
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  {errorMessage.includes('401') || errorMessage.toLowerCase().includes('session expired')
                    ? 'Session Expired'
                    : 'Failed to Load Dashboard'}
                </Text>
                <Text
                  style={{
                    color: palette.textSecondary,
                    fontSize: 13,
                    textAlign: 'center',
                    marginBottom: 16,
                    lineHeight: 18,
                  }}
                >
                  {errorMessage}
                </Text>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 22,
                    paddingVertical: 11,
                    backgroundColor: palette.brand,
                    borderRadius: 10,
                    alignSelf: 'center',
                  }}
                  onPress={() => {
                    if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('session expired')) {
                      useAuthStore.getState().logout();
                      router.replace('/main-login');
                    } else {
                      refetch();
                    }
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                    {errorMessage.includes('401') || errorMessage.toLowerCase().includes('session expired')
                      ? 'Go to Login'
                      : 'Retry Request'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : data ? (
              <View style={{ gap: 20 }}>
                {/* ── HERO BANNER ────────────────────────────────────────── */}
                <ExpoLinearGradient
                  colors={
                    isDark
                      ? ['#4C2889', '#241444', '#161616']
                      : ['#835CEE', '#6D45D4', '#5932BF']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    marginHorizontal: 0,
                    marginTop: 0,
                    borderBottomLeftRadius: 28,
                    borderBottomRightRadius: 28,
                    overflow: 'hidden',
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    ...Platform.select({
                      ios: {
                        shadowColor: '#835CEE',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.25,
                        shadowRadius: 14,
                      },
                      android: { elevation: 6 },
                    }),
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 20,
                      paddingBottom: 22,
                      paddingTop: 18,
                    }}
                  >
                    {/* Security & System Status Pill */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: 'rgba(255, 255, 255, 0.16)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.30)',
                        alignSelf: 'flex-start',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 20,
                        marginBottom: 10,
                      }}
                    >
                      <ShieldCheck size={12} color="#FFFFFF" strokeWidth={2.5} />
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 10.5,
                          fontWeight: '800',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                        }}
                      >
                        SuperAdmin Hub · Active
                      </Text>
                    </View>

                    {/* Headline */}
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 27,
                        fontWeight: '900',
                        letterSpacing: -0.6,
                        lineHeight: 33,
                      }}
                    >
                      Welcome, {username}
                    </Text>

                    {/* Subhead with 100% readable white text */}
                    <Text
                      style={{
                        color: 'rgba(255, 255, 255, 0.90)',
                        fontSize: 13,
                        lineHeight: 19,
                        marginTop: 6,
                        fontWeight: '500',
                        maxWidth: '96%',
                      }}
                    >
                      Manage multi-tenant workspaces, subscription tiers, and overall system health from this command center.
                    </Text>

                    {/* CTA Button Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
                      <TouchableOpacity
                        onPress={() => router.push('/superadmin/create-tenant')}
                        activeOpacity={0.85}
                        style={{
                          borderRadius: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 10,
                          paddingHorizontal: 16,
                          backgroundColor: '#FFFFFF',
                          ...Platform.select({
                            ios: {
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.15,
                              shadowRadius: 4,
                            },
                            android: { elevation: 2 },
                          }),
                        }}
                      >
                        <Plus size={15} color="#6D45D4" strokeWidth={3.0} style={{ marginRight: 6 }} />
                        <Text style={{ color: '#6D45D4', fontSize: 13, fontWeight: '800' }}>
                          Create New Tenant
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => router.push('/superadmin/tenants-hub')}
                        activeOpacity={0.85}
                        style={{
                          borderRadius: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          backgroundColor: 'rgba(255, 255, 255, 0.18)',
                          borderWidth: 1,
                          borderColor: 'rgba(255, 255, 255, 0.35)',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginRight: 4 }}>
                          Workspaces
                        </Text>
                        <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </ExpoLinearGradient>

                {/* ── QUICK ACTIONS ────────────────────────────────────────── */}
                <View style={{ paddingHorizontal: 16 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '800',
                      color: palette.textPrimary,
                      letterSpacing: -0.2,
                      marginBottom: 12,
                    }}
                  >
                    Quick Actions
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* 1. Add Tenant */}
                    <TouchableOpacity
                      onPress={() => router.push('/superadmin/create-tenant')}
                      activeOpacity={0.7}
                      style={{ alignItems: 'center', width: '23%' }}
                    >
                      <View
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: 16,
                          backgroundColor: isDark ? palette.brandBg : '#FFFFFF',
                          borderWidth: 1.5,
                          borderColor: isDark ? palette.brandBorder : palette.border,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginBottom: 8,
                          ...palette.cardShadow,
                        }}
                      >
                        <Building2 size={24} color={palette.brand} strokeWidth={2.2} />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: palette.textPrimary,
                          textAlign: 'center',
                        }}
                        numberOfLines={1}
                      >
                        Add Tenant
                      </Text>
                    </TouchableOpacity>

                    {/* 2. Inquiries */}
                    <TouchableOpacity
                      onPress={() => router.push('/superadmin/inquiries')}
                      activeOpacity={0.7}
                      style={{ alignItems: 'center', width: '23%' }}
                    >
                      <View
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: 16,
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFFFF',
                          borderWidth: 1.5,
                          borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : palette.border,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginBottom: 8,
                          ...palette.cardShadow,
                        }}
                      >
                        <MessageCircle size={24} color={palette.warning} strokeWidth={2.2} />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: palette.textPrimary,
                          textAlign: 'center',
                        }}
                        numberOfLines={1}
                      >
                        Inquiries
                      </Text>
                    </TouchableOpacity>

                    {/* 3. Plans */}
                    <TouchableOpacity
                      onPress={() => router.push('/superadmin/plans')}
                      activeOpacity={0.7}
                      style={{ alignItems: 'center', width: '23%' }}
                    >
                      <View
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: 16,
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#FFFFFF',
                          borderWidth: 1.5,
                          borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : palette.border,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginBottom: 8,
                          ...palette.cardShadow,
                        }}
                      >
                        <Layers size={24} color={palette.success} strokeWidth={2.2} />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: palette.textPrimary,
                          textAlign: 'center',
                        }}
                        numberOfLines={1}
                      >
                        Plans
                      </Text>
                    </TouchableOpacity>

                    {/* 4. Subscriptions Hub */}
                    <TouchableOpacity
                      onPress={() => router.push('/superadmin/subscriptions-hub')}
                      activeOpacity={0.7}
                      style={{ alignItems: 'center', width: '23%' }}
                    >
                      <View
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: 16,
                          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#FFFFFF',
                          borderWidth: 1.5,
                          borderColor: isDark ? 'rgba(99, 102, 241, 0.35)' : palette.border,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginBottom: 8,
                          ...palette.cardShadow,
                        }}
                      >
                        <CreditCard size={24} color="#6366F1" strokeWidth={2.2} />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: palette.textPrimary,
                          textAlign: 'center',
                        }}
                        numberOfLines={1}
                      >
                        Billing Hub
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── METRICS OVERVIEW (2x2 GRID) ────────────────────────── */}
                <View style={{ paddingHorizontal: 16 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '800',
                      color: palette.textPrimary,
                      letterSpacing: -0.2,
                      marginBottom: 12,
                    }}
                  >
                    System Statistics
                  </Text>

                  {/* Row 1 */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                    {/* Card 1: Total Tenants */}
                    <TouchableOpacity
                      onPress={() => router.push('/superadmin/tenants')}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        backgroundColor: palette.cardBg,
                        borderWidth: 1,
                        borderColor: palette.border,
                        borderRadius: 18,
                        padding: 16,
                        ...palette.cardShadow,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: palette.brandBg,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Building2 size={20} color={palette.brand} strokeWidth={2.2} />
                        </View>
                        <View
                          style={{
                            backgroundColor: palette.successBg,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <TrendingUp size={11} color={palette.success} strokeWidth={2.5} />
                          <Text style={{ fontSize: 10.5, color: palette.success, fontWeight: '800' }}>Active</Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          fontSize: 28,
                          fontWeight: '900',
                          color: palette.textPrimary,
                          marginTop: 14,
                          letterSpacing: -0.5,
                        }}
                      >
                        {data.metrics.totalTenants}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: palette.textSecondary,
                          fontWeight: '700',
                          marginTop: 2,
                          letterSpacing: 0.2,
                        }}
                      >
                        Total Tenants
                      </Text>
                    </TouchableOpacity>

                    {/* Card 2: Total Inquiries */}
                    <TouchableOpacity
                      onPress={() => router.push('/superadmin/inquiries')}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        backgroundColor: palette.cardBg,
                        borderWidth: 1,
                        borderColor: palette.border,
                        borderRadius: 18,
                        padding: 16,
                        ...palette.cardShadow,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MessageCircle size={20} color={palette.warning} strokeWidth={2.2} />
                        </View>
                        <View
                          style={{
                            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 12,
                          }}
                        >
                          <Text style={{ fontSize: 10.5, color: palette.warning, fontWeight: '800' }}>Inbound</Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          fontSize: 28,
                          fontWeight: '900',
                          color: palette.textPrimary,
                          marginTop: 14,
                          letterSpacing: -0.5,
                        }}
                      >
                        {data.metrics.totalInquiries}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: palette.textSecondary,
                          fontWeight: '700',
                          marginTop: 2,
                          letterSpacing: 0.2,
                        }}
                      >
                        Total Inquiries
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 2 */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Card 3: Registered Emails */}
                    <TouchableOpacity
                      onPress={() => router.push('/superadmin/tenants')}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        backgroundColor: palette.cardBg,
                        borderWidth: 1,
                        borderColor: palette.border,
                        borderRadius: 18,
                        padding: 16,
                        ...palette.cardShadow,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MailCheck size={20} color={palette.success} strokeWidth={2.2} />
                        </View>
                        <View
                          style={{
                            backgroundColor: palette.successBg,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 12,
                          }}
                        >
                          <Text style={{ fontSize: 10.5, color: palette.success, fontWeight: '800' }}>Verified</Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          fontSize: 28,
                          fontWeight: '900',
                          color: palette.textPrimary,
                          marginTop: 14,
                          letterSpacing: -0.5,
                        }}
                      >
                        {data.metrics.totalEmails}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: palette.textSecondary,
                          fontWeight: '700',
                          marginTop: 2,
                          letterSpacing: 0.2,
                        }}
                      >
                        Registered Emails
                      </Text>
                    </TouchableOpacity>

                    {/* Card 4: Suspended Tenants */}
                    <TouchableOpacity
                      onPress={() => router.push('/superadmin/tenants')}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        backgroundColor: palette.cardBg,
                        borderWidth: 1,
                        borderColor: palette.border,
                        borderRadius: 18,
                        padding: 16,
                        ...palette.cardShadow,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ban size={20} color={palette.danger} strokeWidth={2.2} />
                        </View>
                        <View
                          style={{
                            backgroundColor: palette.dangerBg,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 12,
                          }}
                        >
                          <Text style={{ fontSize: 10.5, color: palette.danger, fontWeight: '800' }}>
                            {data.metrics.suspendedTenants > 0 ? 'Attention' : 'Clean'}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          fontSize: 28,
                          fontWeight: '900',
                          color: palette.textPrimary,
                          marginTop: 14,
                          letterSpacing: -0.5,
                        }}
                      >
                        {data.metrics.suspendedTenants}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: palette.textSecondary,
                          fontWeight: '700',
                          marginTop: 2,
                          letterSpacing: 0.2,
                        }}
                      >
                        Suspended Tenants
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── RECENT TENANTS SECTION ──────────────────────────────── */}
                <View style={{ paddingHorizontal: 16 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '800',
                        color: palette.textPrimary,
                        letterSpacing: -0.2,
                      }}
                    >
                      Recent Tenants
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push('/superadmin/tenants')}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: palette.brand,
                          fontWeight: '800',
                        }}
                      >
                        View All
                      </Text>
                      <ChevronRight size={14} color={palette.brand} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={{
                      backgroundColor: palette.cardBg,
                      borderWidth: 1,
                      borderColor: palette.border,
                      borderRadius: 18,
                      overflow: 'hidden',
                      ...palette.cardShadow,
                    }}
                  >
                    {data.recentTenants.length === 0 ? (
                      <View style={{ padding: 32, alignItems: 'center' }}>
                        <Building2 size={32} color={palette.textMuted} />
                        <Text
                          style={{
                            color: palette.textPrimary,
                            fontSize: 14,
                            fontWeight: '700',
                            marginTop: 10,
                          }}
                        >
                          No Registered Tenants
                        </Text>
                        <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 4 }}>
                          New tenant organizations will show up here.
                        </Text>
                      </View>
                    ) : (
                      data.recentTenants.map((item, index) => {
                        const initials = item.companyName
                          ? item.companyName.substring(0, 2).toUpperCase()
                          : 'TN';
                        const isLast = index === data.recentTenants.length - 1;

                        return (
                          <TouchableOpacity
                            key={item.tenantId}
                            onPress={() => router.push(`/superadmin/tenants/${item.tenantId}`)}
                            activeOpacity={0.7}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: 16,
                              borderBottomWidth: isLast ? 0 : 1,
                              borderBottomColor: palette.borderSubtle,
                            }}
                          >
                            {/* Avatar Badge */}
                            <View
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                backgroundColor: palette.brandBg,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 14,
                                borderWidth: 1,
                                borderColor: palette.brandBorder,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '900',
                                  color: palette.brand,
                                  letterSpacing: 0.5,
                                }}
                              >
                                {initials}
                              </Text>
                            </View>

                            {/* Info */}
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: '800',
                                  color: palette.textPrimary,
                                  letterSpacing: -0.2,
                                }}
                                numberOfLines={1}
                              >
                                {item.companyName}
                              </Text>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4,
                                  marginTop: 3,
                                }}
                              >
                                <Globe size={11} color={palette.textMuted} />
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: palette.textSecondary,
                                    fontWeight: '500',
                                  }}
                                  numberOfLines={1}
                                >
                                  {item.subdomain}.uproptech.com
                                </Text>
                              </View>
                            </View>

                            {/* Plan & Status Badges */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                              {/* Plan Pill */}
                              <View
                                style={{
                                  backgroundColor: palette.brandBg,
                                  paddingHorizontal: 8,
                                  paddingVertical: 3.5,
                                  borderRadius: 8,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 10.5,
                                    color: palette.brand,
                                    fontWeight: '800',
                                    textTransform: 'capitalize',
                                  }}
                                >
                                  {item.plan || 'Standard'}
                                </Text>
                              </View>

                              {/* Status Pill */}
                              <View
                                style={{
                                  backgroundColor: item.isSuspended
                                    ? palette.dangerBg
                                    : item.isActive
                                      ? palette.successBg
                                      : isDark
                                        ? 'rgba(255,255,255,0.06)'
                                        : '#F1F5F9',
                                  paddingHorizontal: 8,
                                  paddingVertical: 3.5,
                                  borderRadius: 8,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <View
                                  style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: 3,
                                    backgroundColor: item.isSuspended
                                      ? palette.danger
                                      : item.isActive
                                        ? palette.success
                                        : palette.textMuted,
                                  }}
                                />
                                <Text
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: '800',
                                    color: item.isSuspended
                                      ? palette.danger
                                      : item.isActive
                                        ? palette.success
                                        : palette.textSecondary,
                                  }}
                                >
                                  {item.isSuspended ? 'Suspended' : item.isActive ? 'Active' : 'Inactive'}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </View>

                {/* ── RECENT INQUIRIES SECTION ────────────────────────────── */}
                <View style={{ paddingHorizontal: 16 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '800',
                        color: palette.textPrimary,
                        letterSpacing: -0.2,
                      }}
                    >
                      Recent Inquiries
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push('/superadmin/inquiries')}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: palette.brand,
                          fontWeight: '800',
                        }}
                      >
                        View All
                      </Text>
                      <ChevronRight size={14} color={palette.brand} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: 10 }}>
                    {data.recentInquiries.length === 0 ? (
                      <View
                        style={{
                          backgroundColor: palette.cardBg,
                          borderWidth: 1,
                          borderColor: palette.border,
                          borderRadius: 18,
                          padding: 32,
                          alignItems: 'center',
                          ...palette.cardShadow,
                        }}
                      >
                        <MessageCircle size={32} color={palette.textMuted} />
                        <Text
                          style={{
                            color: palette.textPrimary,
                            fontSize: 14,
                            fontWeight: '700',
                            marginTop: 10,
                          }}
                        >
                          No Inquiries Logged
                        </Text>
                        <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 4 }}>
                          Direct contact inquiries will be recorded here.
                        </Text>
                      </View>
                    ) : (
                      data.recentInquiries.map((item) => {
                        const isNew = item.status === 'New';
                        const isContacted = item.status === 'Contacted';

                        return (
                          <TouchableOpacity
                            key={item.inquiryId}
                            onPress={() => router.push('/superadmin/inquiries')}
                            activeOpacity={0.75}
                            style={{
                              backgroundColor: palette.cardBg,
                              borderWidth: 1,
                              borderColor: palette.border,
                              borderRadius: 18,
                              padding: 16,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              ...palette.cardShadow,
                            }}
                          >
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              {/* Title & Status Badge */}
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text
                                  style={{
                                    fontSize: 15,
                                    fontWeight: '800',
                                    color: palette.textPrimary,
                                    letterSpacing: -0.2,
                                  }}
                                  numberOfLines={1}
                                >
                                  {item.companyName}
                                </Text>

                                {isNew && (
                                  <View
                                    style={{
                                      backgroundColor: palette.brandBg,
                                      paddingHorizontal: 7,
                                      paddingVertical: 2,
                                      borderRadius: 6,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 9,
                                        color: palette.brand,
                                        fontWeight: '900',
                                        textTransform: 'uppercase',
                                      }}
                                    >
                                      NEW
                                    </Text>
                                  </View>
                                )}
                              </View>

                              {/* Contact Person & Phone */}
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 12,
                                  marginTop: 6,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                  <User size={12} color={palette.iconColor} />
                                  <Text
                                    style={{
                                      fontSize: 12.5,
                                      color: palette.textSecondary,
                                      fontWeight: '600',
                                    }}
                                  >
                                    {item.contactPerson}
                                  </Text>
                                </View>

                                {item.phone ? (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Phone size={11} color={palette.iconColor} />
                                    <Text
                                      style={{
                                        fontSize: 12,
                                        color: palette.textSecondary,
                                        fontWeight: '500',
                                      }}
                                    >
                                      {item.phone}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>

                              {/* Date */}
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4,
                                  marginTop: 6,
                                }}
                              >
                                <Calendar size={11} color={palette.textMuted} />
                                <Text
                                  style={{
                                    fontSize: 11,
                                    color: palette.textMuted,
                                    fontWeight: '500',
                                  }}
                                >
                                  {new Date(item.createdOn).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </Text>
                              </View>
                            </View>

                            {/* Right Status Pill & Arrow */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View
                                style={{
                                  backgroundColor: isNew
                                    ? palette.brandBg
                                    : isContacted
                                      ? palette.warningBg
                                      : palette.successBg,
                                  paddingHorizontal: 9,
                                  paddingVertical: 4,
                                  borderRadius: 8,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: '800',
                                    color: isNew
                                      ? palette.brand
                                      : isContacted
                                        ? palette.warning
                                        : palette.success,
                                  }}
                                >
                                  {item.status || 'New'}
                                </Text>
                              </View>
                              <ChevronRight size={16} color={palette.textMuted} strokeWidth={2.2} />
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </View>

                {/* Footer */}
                <AppFooter />
              </View>
            ) : null}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
