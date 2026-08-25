import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, Users, Settings, User } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { useUpdateStore } from '../../hooks/useUpdateStore';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { NotificationService } from '../../Services/NotificationService';
import { useAuthStore } from '../../auth/store/authStore';

interface BottomNavProps {
  active: 'dashboard' | 'users' | 'settings' | 'profile';
}

const TAB_KEYS = ['dashboard', 'users', 'settings', 'profile'] as const;
const PILL_WIDTH = 50;
const PILL_HEIGHT = 38;

const BottomNav = React.memo(({ active }: BottomNavProps) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const isUpdateAvailable = useUpdateStore((state) => state.isUpdateAvailable);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await NotificationService.getNotifications();
      setUnreadCount(res.count || 0);
    } catch (err) {
      console.error('Failed to get unread count in BottomNav:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount, active]);

  const activeColor = adminTheme.brand;
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)';

  // Background pill color — subtle tint of the brand color
  const pillBg = isDark
    ? `${adminTheme.brand}50`   // ~19% opacity in dark
    : `${adminTheme.brand}30`;  // ~12% opacity in light

  const user = useAuthStore((state) => state.user);
  const role = user?.role?.trim()?.toLowerCase() || '';

  const visibleTabs = useMemo(() => {
    if (role === 'admin') {
      return ['dashboard', 'users', 'settings', 'profile'];
    } else {
      // Hide users/settings for partners, agents and sales
      return ['dashboard', 'profile'];
    }
  }, [role]);

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

  const [containerWidth, setContainerWidth] = useState(0);
  const isFirstRender = React.useRef(true);

  // translateX for the sliding background pill
  const translateX = useSharedValue(0);

  useEffect(() => {
    const index = visibleTabs.indexOf(active);
    if (index !== -1 && containerWidth > 0) {
      // Each tab occupies equal space; center the pill on the icon
      const tabWidth = containerWidth / visibleTabs.length;
      const centeredX = index * tabWidth + tabWidth / 2 - PILL_WIDTH / 2;

      if (isFirstRender.current) {
        translateX.value = centeredX;
        isFirstRender.current = false;
      } else {
        // Smooth sliding transition
        translateX.value = withSpring(centeredX, {
          damping: 35,
          stiffness: 180,
        });
      }
    }
  }, [active, containerWidth, visibleTabs]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: adminTheme.cardBg,
        borderColor: adminTheme.border,
        shadowOpacity: isDark ? 0.35 : 0.06,
        bottom: 8,
      },
    ],
    [isDark, adminTheme.cardBg, adminTheme.border]
  );

  return (
    <View style={containerStyle}>
      <View style={{ flex: 1, borderRadius: 32, overflow: 'hidden' }}>
        <View
          style={styles.content}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          {/* Sliding background pill */}
          {containerWidth > 0 && visibleTabs.includes(active) && (
            <Animated.View
              style={[
                styles.slidingPill,
                { backgroundColor: pillBg },
                pillAnimatedStyle,
              ]}
              pointerEvents="none"
            />
          )}

          {/* Dashboard */}
          {visibleTabs.includes('dashboard') && (
            <TouchableOpacity onPress={navigateToDashboard} style={styles.tabButton} activeOpacity={0.7}>
              <LayoutDashboard size={22} color={active === 'dashboard' ? activeColor : inactiveColor} />
            </TouchableOpacity>
          )}

          {/* Users */}
          {visibleTabs.includes('users') && (
            <TouchableOpacity onPress={navigateToUsers} style={styles.tabButton} activeOpacity={0.7}>
              <Users size={22} color={active === 'users' ? activeColor : inactiveColor} />
            </TouchableOpacity>
          )}

          {/* Settings */}
          {visibleTabs.includes('settings') && (
            <TouchableOpacity onPress={navigateToSettings} style={styles.tabButton} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                <Settings size={22} color={active === 'settings' ? activeColor : inactiveColor} />
                {isUpdateAvailable && <View style={styles.updateDot} />}
              </View>
            </TouchableOpacity>
          )}

          {/* Profile */}
          {visibleTabs.includes('profile') && (
            <TouchableOpacity onPress={navigateToProfile} style={styles.tabButton} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                <User size={22} color={active === 'profile' ? activeColor : inactiveColor} />
                {unreadCount > 0 && <View style={styles.notificationDot} />}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  iconWrapper: {
    position: 'relative',
  },
  slidingPill: {
    position: 'absolute',
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    top: '50%',
    marginTop: -(PILL_HEIGHT / 2),
    left: 0,
  },
  updateDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
});

BottomNav.displayName = 'AdminBottomNav';
export default BottomNav;

export { BottomMenuSheet } from './BottomMenuSheet';
