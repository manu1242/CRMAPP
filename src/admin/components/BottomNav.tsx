import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, Users, Settings, User } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUpdateStore } from '../../hooks/useUpdateStore';
import { NotificationService } from '../../Services/NotificationService';
import { useAuthStore } from '../../auth/store/authStore';

interface BottomNavProps {
  active: 'dashboard' | 'users' | 'settings' | 'profile';
}

const BottomNav = React.memo(({ active }: BottomNavProps) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const insets = useSafeAreaInsets();
  const isUpdateAvailable = useUpdateStore((state) => state.isUpdateAvailable);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await NotificationService.getNotifications();
      setUnreadCount(res.unreadCount || res.count || 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount, active]);

  const user = useAuthStore((state) => state.user);
  const role = user?.role?.trim()?.toLowerCase() || '';

  const navigateToDashboard = useCallback(() => {
    if (role === 'partner') {
      router.replace('/admin/PartnerDashboard' as any);
    } else {
      router.replace('/admin/dashboard' as any);
    }
  }, [router, role]);

  const navigateToUsers = useCallback(() => router.replace('/admin/users' as any), [router]);
  const navigateToSettings = useCallback(() => router.replace('/admin/settings' as any), [router]);
  const navigateToProfile = useCallback(() => router.replace('/profile' as any), [router]);

  // Color tokens matching the capsule dock style with Green active state in both Light & Dark modes
  const GREEN = '#10b981';

  const dockBg = isDark ? 'rgba(30, 30, 36, 0.94)' : 'rgba(255, 255, 255, 0.95)';
  const dockBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  const activeCapsuleBg = isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.14)';
  const activeTextColor = GREEN;
  const inactiveTextColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.50)';

  const activeIconColor = GREEN;
  const inactiveIconColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.45)';

  const bottomOffset = insets.bottom > 0 ? insets.bottom + 4 : 14;

  const isHomeActive = active === 'dashboard';
  const isUsersActive = active === 'users';
  const isSettingsActive = active === 'settings';
  const isProfileActive = active === 'profile';

  return (
    <View style={[styles.outerWrapper, { bottom: bottomOffset }]}>
      {/* ── 1. Main Left Pill Dock (Home, User, Setting) ── */}
      <View
        style={[
          styles.mainDock,
          {
            backgroundColor: dockBg,
            borderColor: dockBorder,
          },
        ]}
      >
        {/* Home Tab */}
        <TouchableOpacity
          onPress={navigateToDashboard}
          activeOpacity={0.75}
          style={[
            styles.tabItem,
            isHomeActive && [styles.activeTabCapsule, { backgroundColor: activeCapsuleBg }],
          ]}
        >
          <LayoutDashboard
            size={18}
            color={isHomeActive ? activeIconColor : inactiveIconColor}
            strokeWidth={isHomeActive ? 2.3 : 1.9}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isHomeActive ? activeTextColor : inactiveTextColor,
                fontWeight: isHomeActive ? '700' : '500',
              },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* User Tab */}
        <TouchableOpacity
          onPress={navigateToUsers}
          activeOpacity={0.75}
          style={[
            styles.tabItem,
            isUsersActive && [styles.activeTabCapsule, { backgroundColor: activeCapsuleBg }],
          ]}
        >
          <Users
            size={18}
            color={isUsersActive ? activeIconColor : inactiveIconColor}
            strokeWidth={isUsersActive ? 2.3 : 1.9}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isUsersActive ? activeTextColor : inactiveTextColor,
                fontWeight: isUsersActive ? '700' : '500',
              },
            ]}
          >
            User
          </Text>
        </TouchableOpacity>

        {/* Setting Tab */}
        <TouchableOpacity
          onPress={navigateToSettings}
          activeOpacity={0.75}
          style={[
            styles.tabItem,
            isSettingsActive && [styles.activeTabCapsule, { backgroundColor: activeCapsuleBg }],
          ]}
        >
          <View style={styles.iconContainer}>
            <Settings
              size={18}
              color={isSettingsActive ? activeIconColor : inactiveIconColor}
              strokeWidth={isSettingsActive ? 2.3 : 1.9}
            />
            {isUpdateAvailable && <View style={styles.updateDot} />}
          </View>
          <Text
            style={[
              styles.tabLabel,
              {
                color: isSettingsActive ? activeTextColor : inactiveTextColor,
                fontWeight: isSettingsActive ? '700' : '500',
              },
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 2. Separate Right Floating Profile Button (in place of + symbol) ── */}
      <TouchableOpacity
        onPress={navigateToProfile}
        activeOpacity={0.8}
        style={[
          styles.profileButton,
          {
            backgroundColor: isProfileActive
              ? (isDark ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.16)')
              : dockBg,
            borderColor: isProfileActive
              ? GREEN
              : dockBorder,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <User
            size={20}
            color={isProfileActive ? GREEN : inactiveIconColor}
            strokeWidth={isProfileActive ? 2.4 : 2}
          />
          {unreadCount > 0 && <View style={styles.notificationDot} />}
        </View>
        <Text
          style={[
            styles.profileLabel,
            {
              color: isProfileActive
                ? GREEN
                : inactiveTextColor,
              fontWeight: isProfileActive ? '700' : '500',
            },
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 100,
  },
  mainDock: {
    flex: 1,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  activeTabCapsule: {
    // Pill capsule style highlighting active tab
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  profileLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  updateDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
  },
});

BottomNav.displayName = 'AdminBottomNav';
export default BottomNav;

export { BottomMenuSheet } from './BottomMenuSheet';
