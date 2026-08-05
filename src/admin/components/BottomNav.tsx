import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, Users, Settings, User } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '@/theme/adminTheme';

interface BottomNavProps {
  active: 'dashboard' | 'users' | 'settings' | 'profile';
}

const BottomNav = React.memo(({ active }: BottomNavProps) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const navBg = adminTheme.cardBg;
  const navBorder = adminTheme.border;
  const activeColor = adminTheme.brand;
  const inactiveColor = adminTheme.textSecondary;

  const navigateToDashboard = useCallback(() => router.replace('/admin/dashboard' as any), [router]);
  const navigateToUsers = useCallback(() => router.replace('/admin/users' as any), [router]);
  const navigateToSettings = useCallback(() => router.replace('/admin/settings' as any), [router]);
  const navigateToProfile = useCallback(() => router.replace('/profile' as any), [router]);

  const containerStyle = useMemo(
    () => ({
      flexDirection: 'row' as const,
      height: 64,
      backgroundColor: navBg,
      borderTopWidth: 1,
      borderTopColor: navBorder,
      justifyContent: 'space-around' as const,
      alignItems: 'center' as const,
      paddingBottom: 6,
    }),
    [navBg, navBorder]
  );

  return (
    <View style={containerStyle}>
      {/* Dashboard */}
      <TouchableOpacity onPress={navigateToDashboard} style={{ alignItems: 'center', flex: 1 }}>
        <LayoutDashboard size={20} color={active === 'dashboard' ? activeColor : inactiveColor} />
        <Text style={{ fontSize: 10, marginTop: 4, fontWeight: active === 'dashboard' ? '700' : '500', color: active === 'dashboard' ? activeColor : inactiveColor }}>
          Dashboard
        </Text>
      </TouchableOpacity>

      {/* Users */}
      <TouchableOpacity onPress={navigateToUsers} style={{ alignItems: 'center', flex: 1 }}>
        <Users size={20} color={active === 'users' ? activeColor : inactiveColor} />
        <Text style={{ fontSize: 10, marginTop: 4, fontWeight: active === 'users' ? '700' : '500', color: active === 'users' ? activeColor : inactiveColor }}>
          Users
        </Text>
      </TouchableOpacity>

      {/* Settings */}
      <TouchableOpacity onPress={navigateToSettings} style={{ alignItems: 'center', flex: 1 }}>
        <Settings size={20} color={active === 'settings' ? activeColor : inactiveColor} />
        <Text style={{ fontSize: 10, marginTop: 4, fontWeight: active === 'settings' ? '700' : '500', color: active === 'settings' ? activeColor : inactiveColor }}>
          Settings
        </Text>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity onPress={navigateToProfile} style={{ alignItems: 'center', flex: 1 }}>
        <User size={20} color={active === 'profile' ? activeColor : inactiveColor} />
        <Text style={{ fontSize: 10, marginTop: 4, fontWeight: active === 'profile' ? '700' : '500', color: active === 'profile' ? activeColor : inactiveColor }}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
});

BottomNav.displayName = 'AdminBottomNav';
export default BottomNav;

export { BottomMenuSheet } from './BottomMenuSheet';
