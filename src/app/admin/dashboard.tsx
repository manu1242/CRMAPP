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
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { usePermissions } from '../../authorization/hooks/usePermission';
import AdminDashboardContent from '../../admin/components/AdminDashboardContent';
import SalesDashboardContent from '../../admin/components/SalesDashboardContent';
import TeamDashboardContent from '../../admin/components/TeamDashboardContent';
import MilestoneDashboardContent from '../../admin/components/MilestoneDashboardContent';
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
  const isAgentRole = isAgent || ['agent', 'sales'].includes(role?.trim()?.toLowerCase() || '');

  const activeTab = useDashboardTabStore((s) => s.activeTab);
  const setActiveTab = useDashboardTabStore((s) => s.setActiveTab);

  // If a Partner lands on this screen, redirect immediately to PartnerDashboard (Web Parity)
  useEffect(() => {
    if (isPartner || role?.trim()?.toLowerCase() === 'partner') {
      router.replace('/admin/PartnerDashboard');
    }
  }, [isPartner, role, router]);

  // For Agents, ensure activeTab defaults to 'sales' if it was 'admin'
  useEffect(() => {
    if (isAgentRole && activeTab === 'admin' && !params.tab) {
      setActiveTab('sales');
    }
  }, [isAgentRole, activeTab, params.tab, setActiveTab]);

  useEffect(() => {
    resetHeader();
    return () => {
      resetHeader();
    };
  }, [resetHeader, activeTab]);

  useEffect(() => {
    if (params.tab) {
      const t = params.tab.toLowerCase().trim();
      if (t === 'admin' || t === 'sales' || t === 'team' || t === 'milestone') {
        // Prevent agent from switching to admin tab
        if (isAgentRole && t === 'admin') {
          setActiveTab('sales');
        } else {
          setActiveTab(t as DashboardTab);
        }
      }
    }
  }, [params.tab, isAgentRole, setActiveTab]);

  // Filter dashboard tabs: Agents do not see the 'Admin' financial overview tab (Web Parity)
  const visibleTabs = useMemo(() => {
    if (isAgentRole) {
      return DASHBOARD_TABS.filter((tab) => tab.id !== 'admin');
    }
    return DASHBOARD_TABS;
  }, [isAgentRole]);

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
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
