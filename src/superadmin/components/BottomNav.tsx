import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, School, MailCheck, CreditCard, User } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface BottomNavProps {
  active: 'dashboard' | 'tenants' | 'inquiries' | 'subscriptions' | 'profile';
}

const BottomNav = React.memo(({ active }: BottomNavProps) => {
  const router = useRouter();
  const { isDark } = useTheme();
  
  const navBg = isDark ? '#0f172a' : '#ffffff';
  const navBorder = isDark ? '#1e293b' : '#e2e8f0';
  const activeColor = '#2563eb';
  const inactiveColor = isDark ? '#94a3b8' : '#64748b';

  const navigateToDashboard = useCallback(() => router.replace('/superadmin/dashboard'), [router]);
  const navigateToTenants = useCallback(() => router.replace('/superadmin/tenants-hub'), [router]);
  const navigateToInquiries = useCallback(() => router.replace('/superadmin/inquiries'), [router]);
  const navigateToSubscriptions = useCallback(() => router.replace('/superadmin/subscriptions-hub'), [router]);
  const navigateToProfile = useCallback(() => router.replace('/superadmin/profile' as any), [router]);

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

      {/* Tenants */}
      <TouchableOpacity onPress={navigateToTenants} style={{ alignItems: 'center', flex: 1 }}>
        <School size={20} color={active === 'tenants' ? activeColor : inactiveColor} />
        <Text style={{ fontSize: 10, marginTop: 4, fontWeight: active === 'tenants' ? '700' : '500', color: active === 'tenants' ? activeColor : inactiveColor }}>
          Tenants
        </Text>
      </TouchableOpacity>

      {/* Inquiries */}
      <TouchableOpacity onPress={navigateToInquiries} style={{ alignItems: 'center', flex: 1 }}>
        <MailCheck size={20} color={active === 'inquiries' ? activeColor : inactiveColor} />
        <Text style={{ fontSize: 10, marginTop: 4, fontWeight: active === 'inquiries' ? '700' : '500', color: active === 'inquiries' ? activeColor : inactiveColor }}>
          Inquiries
        </Text>
      </TouchableOpacity>

      {/* Subscriptions */}
      <TouchableOpacity onPress={navigateToSubscriptions} style={{ alignItems: 'center', flex: 1 }}>
        <CreditCard size={20} color={active === 'subscriptions' ? activeColor : inactiveColor} />
        <Text style={{ fontSize: 10, marginTop: 4, fontWeight: active === 'subscriptions' ? '700' : '500', color: active === 'subscriptions' ? activeColor : inactiveColor }}>
          Subscriptions
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

BottomNav.displayName = 'SuperAdminBottomNav';
export default BottomNav;
