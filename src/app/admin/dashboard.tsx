import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  CheckSquare,
  Activity,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { usePermissions } from '../../authorization/hooks/usePermission';
import { usePartnerPlanEligibility } from '../../admin/hooks/usePartnerPlanEligibility';
import AdminDashboardContent from '../../admin/components/AdminDashboardContent';
import SalesDashboardContent from '../../admin/components/SalesDashboardContent';
import TeamDashboardContent from '../../admin/components/TeamDashboardContent';
import MilestoneDashboardContent from '../../admin/components/MilestoneDashboardContent';
import LeadTrackingDashboardContent from '../../admin/components/LeadTrackingDashboardContent';
import { useHeaderScrollStore } from '../../admin/store/useHeaderScrollStore';
import { useDashboardTabStore, DashboardTab } from '../../admin/store/useDashboardTabStore';

interface TabItem {
  id: DashboardTab;
  label: string;
  icon: any;
  badge?: string;
}

const DASHBOARD_TABS: TabItem[] = [
  { id: 'admin', label: 'Admin', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales', icon: TrendingUp },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'tracking', label: 'Lead Tracking', icon: Activity },
  { id: 'milestone', label: 'Milestone', icon: CheckSquare },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const params = useLocalSearchParams<{ tab?: string }>();
  const resetHeader = useHeaderScrollStore((s) => s.resetHeader);
  const { isAgent, isPartner, role } = usePermissions();
  const { isEligible: hasPartnerPlanEligibility } = usePartnerPlanEligibility();
  const isPartnerRole = isPartner || role?.trim()?.toLowerCase() === 'partner';
  const isAgentRole = isAgent || ['agent', 'sales'].includes(role?.trim()?.toLowerCase() || '');
  const isAdminRole = role?.trim()?.toLowerCase() === 'admin';
  const isRestrictedRole = isAgentRole || (isPartnerRole && !hasPartnerPlanEligibility);

  const activeTab = useDashboardTabStore((s) => s.activeTab);
  const setActiveTab = useDashboardTabStore((s) => s.setActiveTab);

  // If an eligible Partner lands on this screen, redirect immediately to PartnerDashboard (Web Parity)
  useEffect(() => {
    if (isPartnerRole && hasPartnerPlanEligibility && activeTab !== 'tracking' && params.tab !== 'tracking') {
      router.replace('/admin/PartnerDashboard');
    }
  }, [isPartnerRole, hasPartnerPlanEligibility, activeTab, params.tab, router]);

  // For Agents or Partners without partner plan eligibility, ensure activeTab defaults to 'sales' if it was 'admin'
  useEffect(() => {
    if (isRestrictedRole && activeTab === 'admin' && !params.tab) {
      setActiveTab('sales');
    }
  }, [isRestrictedRole, activeTab, params.tab, setActiveTab]);

  useEffect(() => {
    resetHeader();
    return () => {
      resetHeader();
    };
  }, [resetHeader, activeTab]);

  useEffect(() => {
    if (params.tab) {
      const t = params.tab.toLowerCase().trim();
      if (t === 'admin' || t === 'sales' || t === 'team' || t === 'tracking' || t === 'milestone') {
        // Prevent restricted role from switching to admin tab
        if (isRestrictedRole && t === 'admin') {
          setActiveTab('sales');
        } else {
          setActiveTab(t as DashboardTab);
        }
      }
    }
  }, [params.tab, isRestrictedRole, setActiveTab]);

  // Filter dashboard tabs: Restricted roles do not see the 'Admin' financial overview tab
  // Lead Tracking: Partner (own leads, web parity) + Admin (all partners)
  const visibleTabs = useMemo(() => {
    return DASHBOARD_TABS.filter((tab) => {
      if (tab.id === 'admin' && isRestrictedRole) return false;
      if (tab.id === 'tracking' && !isPartnerRole && !isAdminRole) return false;
      return true;
    });
  }, [isRestrictedRole, isPartnerRole, isAdminRole]);

  // Non-partners landing on ?tab=tracking fall back to Team
  useEffect(() => {
    if (activeTab === 'tracking' && !isPartnerRole && !isAdminRole) setActiveTab('team');
  }, [activeTab, isPartnerRole, isAdminRole, setActiveTab]);

  const palette = {
    screenBg: adminTheme.primaryBg,
    headerBg: adminTheme.secondaryBg,
    cardBg: adminTheme.cardBg,
    border: adminTheme.border,
    textPrimary: adminTheme.textPrimary,
    textSecondary: adminTheme.textSecondary,
    textMuted: adminTheme.textMuted,
    brand: adminTheme.brand,
    activeBg: adminTheme.brand, // #10b981 Admin Emerald
    activeText: '#FFFFFF',
    inactiveBg: isDark ? '#141414' : '#F1F5F9',
    inactiveText: isDark ? '#CBD5E1' : '#475569',
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.screenBg }]}>
      {/* ── Top Dashboard Switcher Bar (Web Parity: 4 Dashboards) ── */}
      <View
        style={[
          styles.switcherContainer,
          {
            backgroundColor: palette.headerBg,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {visibleTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: isSelected ? palette.activeBg : palette.inactiveBg,
                    borderColor: isSelected ? palette.activeBg : palette.border,
                    ...(Platform.OS === 'ios' && isSelected
                      ? {
                          shadowColor: palette.brand,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.35,
                          shadowRadius: 4,
                        }
                      : {}),
                    ...(Platform.OS === 'android' && isSelected ? { elevation: 3 } : {}),
                  },
                ]}
              >
                <Icon
                  size={15}
                  color={isSelected ? palette.activeText : palette.inactiveText}
                  strokeWidth={isSelected ? 2.5 : 2.0}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isSelected ? palette.activeText : palette.inactiveText,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Active Dashboard Content (Web Parity: Agents only access Sales/Team/Milestone) ── */}
      <View style={{ flex: 1 }}>
        {activeTab === 'admin' && !isAgentRole && <AdminDashboardContent />}
        {activeTab === 'sales' && <SalesDashboardContent />}
        {activeTab === 'team' && <TeamDashboardContent />}
        {activeTab === 'tracking' && (isPartnerRole || isAdminRole) && <LeadTrackingDashboardContent />}
        {activeTab === 'milestone' && <MilestoneDashboardContent />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop:8,
  },
  switcherContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  tabsScrollContent: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13.5,
    paddingVertical: 7,
    borderRadius: 24,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 11.5,
  },
});
