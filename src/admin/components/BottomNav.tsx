import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, Users, Settings, User } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { useUpdateStore } from '../../hooks/useUpdateStore';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { NotificationService } from '../../Services/NotificationService';

interface BottomNavProps {
  active: 'dashboard' | 'users' | 'settings' | 'profile';
}

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

  const navigateToDashboard = useCallback(() => router.replace('/admin/dashboard' as any), [router]);
  const navigateToUsers = useCallback(() => router.replace('/admin/users' as any), [router]);
  const navigateToSettings = useCallback(() => router.replace('/admin/settings' as any), [router]);
  const navigateToProfile = useCallback(() => router.replace('/profile' as any), [router]);

  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const index = ['dashboard', 'users', 'settings', 'profile'].indexOf(active);
    if (index !== -1 && containerWidth > 0) {
      const tabWidth = (containerWidth - 24) / 4;
      translateX.value = withSpring(index * tabWidth + tabWidth / 2 - 7, {
        damping: 18,
        stiffness: 150,
      });
    }
  }, [active, containerWidth]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // NOTE: The parent SafeAreaView in _layout.tsx already uses edges={['bottom']},
  // which means the layout container is already padded above the system nav bar.
  // BottomNav's `position: absolute` bottom is relative to that safe container.
  // DO NOT use insets.bottom here — it would double-count the safe area causing a gap.
  // Just use a small visual offset so the pill floats slightly above the container edge.
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
          {/* Sliding Indicator */}
          {containerWidth > 0 && (
            <Animated.View
              style={[
                styles.indicator,
                {
                  position: 'absolute',
                  bottom: 4,
                  left: 12,
                  backgroundColor: activeColor,
                },
                animatedStyle,
              ]}
            />
          )}

          {/* Dashboard */}
          <TouchableOpacity onPress={navigateToDashboard} style={styles.tabButton} activeOpacity={0.7}>
            <LayoutDashboard size={22} color={active === 'dashboard' ? activeColor : inactiveColor} />
            <View style={styles.indicatorDummy} />
          </TouchableOpacity>

          {/* Users */}
          <TouchableOpacity onPress={navigateToUsers} style={styles.tabButton} activeOpacity={0.7}>
            <Users size={22} color={active === 'users' ? activeColor : inactiveColor} />
            <View style={styles.indicatorDummy} />
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity onPress={navigateToSettings} style={styles.tabButton} activeOpacity={0.7}>
            <View style={styles.iconWrapper}>
              <Settings size={22} color={active === 'settings' ? activeColor : inactiveColor} />
              {isUpdateAvailable && <View style={styles.updateDot} />}
            </View>
            <View style={styles.indicatorDummy} />
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity onPress={navigateToProfile} style={styles.tabButton} activeOpacity={0.7}>
            <View style={styles.iconWrapper}>
              <User size={22} color={active === 'profile' ? activeColor : inactiveColor} />
              {unreadCount > 0 && <View style={styles.notificationDot} />}
            </View>
            <View style={styles.indicatorDummy} />
          </TouchableOpacity>
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
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    paddingTop: 8,
  },
  iconWrapper: {
    position: 'relative',
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
  indicator: {
    width: 14,
    height: 4,
    borderRadius: 2,
  },
  indicatorDummy: {
    width: 14,
    height: 4,
    marginTop: 6,
    marginBottom: 4,
  },
});

BottomNav.displayName = 'AdminBottomNav';
export default BottomNav;

export { BottomMenuSheet } from './BottomMenuSheet';
