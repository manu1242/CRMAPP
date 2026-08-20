import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, School, MailCheck, CreditCard, User } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface BottomNavProps {
  active: 'dashboard' | 'tenants' | 'inquiries' | 'subscriptions' | 'profile';
}

const BottomNav = React.memo(({ active }: BottomNavProps) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const activeColor = isDark ? '#ffffff' : '#000000';
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)';

  const navigateToDashboard = useCallback(() => router.replace('/superadmin/dashboard'), [router]);
  const navigateToTenants = useCallback(() => router.replace('/superadmin/tenants-hub'), [router]);
  const navigateToInquiries = useCallback(() => router.replace('/superadmin/inquiries'), [router]);
  const navigateToSubscriptions = useCallback(() => router.replace('/superadmin/subscriptions-hub'), [router]);
  const navigateToProfile = useCallback(() => router.replace('/superadmin/profile' as any), [router]);

  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const index = ['dashboard', 'tenants', 'inquiries', 'subscriptions', 'profile'].indexOf(active);
    if (index !== -1 && containerWidth > 0) {
      const tabWidth = (containerWidth - 24) / 5;
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

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderColor: isDark ? '#1e293b' : '#e2e8f0',
        shadowOpacity: isDark ? 0.35 : 0.06,
        bottom: insets.bottom > 0 ? insets.bottom + 8 : 20,
      },
    ],
    [isDark, insets.bottom]
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

          {/* Tenants */}
          <TouchableOpacity onPress={navigateToTenants} style={styles.tabButton} activeOpacity={0.7}>
            <School size={22} color={active === 'tenants' ? activeColor : inactiveColor} />
            <View style={styles.indicatorDummy} />
          </TouchableOpacity>

          {/* Inquiries */}
          <TouchableOpacity onPress={navigateToInquiries} style={styles.tabButton} activeOpacity={0.7}>
            <MailCheck size={22} color={active === 'inquiries' ? activeColor : inactiveColor} />
            <View style={styles.indicatorDummy} />
          </TouchableOpacity>

          {/* Subscriptions */}
          <TouchableOpacity onPress={navigateToSubscriptions} style={styles.tabButton} activeOpacity={0.7}>
            <CreditCard size={22} color={active === 'subscriptions' ? activeColor : inactiveColor} />
            <View style={styles.indicatorDummy} />
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity onPress={navigateToProfile} style={styles.tabButton} activeOpacity={0.7}>
            <User size={22} color={active === 'profile' ? activeColor : inactiveColor} />
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

BottomNav.displayName = 'SuperAdminBottomNav';
export default BottomNav;
