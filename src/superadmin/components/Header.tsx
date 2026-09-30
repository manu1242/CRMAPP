import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu, Moon, Sun, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserMenuModal from '../../app/components/UserMenuModal';
import { NotificationService } from '../../Services/NotificationService';
import { useTheme } from '../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../theme/adminTheme';
import { useAuthStore } from '../../auth/store/authStore';

interface HeaderProps {
  onMenuPress?: () => void;
}

const Header = React.memo(({ onMenuPress }: HeaderProps) => {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const superTheme = getSuperAdminTheme(isDark);
  const user = useAuthStore((state) => state.user);

  const usernameInitial = useMemo(() => {
    if (user?.username && user.username.trim().length > 0) {
      return user.username.trim().charAt(0).toUpperCase();
    }
    return 'S';
  }, [user?.username]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await NotificationService.getNotifications();
      setUnreadCount(res.count || 0);
    } catch (err) {
      console.error('Failed to get unread count:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const bgColor = superTheme.secondaryBg;
  const borderColor = superTheme.border;
  const iconColor = superTheme.textSecondary;
  const textColor = superTheme.textPrimary;
  const subTextColor = superTheme.textMuted;
  const containerStyle = useMemo(
    () => ({
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: bgColor,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      zIndex: 50,
    }),
    [bgColor, borderColor]
  );

  return (
    <View style={containerStyle}>
      {/* Left: Menu and Title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 12 }}>
        {onMenuPress && (
          <TouchableOpacity onPress={onMenuPress} style={{ padding: 4, marginRight: 4 }}>
            <Menu size={20} color={iconColor} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: textColor, fontWeight: '800', fontSize: 13 }}>Super Admin Panel</Text>
          <Text style={{ color: subTextColor, fontSize: 10 }} numberOfLines={1}>Manage tenants, inquiries & system health</Text>
        </View>
      </View>

      {/* Right: Action Icons & User Profile */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Dark/Light Mode Toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={{ padding: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Toggle dark/light mode"
          activeOpacity={0.7}
        >
          {isDark ? (
            <Sun size={20} color={iconColor} />
          ) : (
            <Moon size={20} color={iconColor} />
          )}
        </TouchableOpacity>

        {/* Notifications Icon (Navigates to dedicated screen) */}
        <TouchableOpacity
          onPress={() => router.push('/superadmin/notifications' as any)}
          style={{ padding: 4, position: 'relative' }}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          activeOpacity={0.7}
        >
          <Bell size={20} color={iconColor} />
          {unreadCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                backgroundColor: '#ef4444',
                borderRadius: 7,
                width: 14,
                height: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '700' }}>
                {unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* User Avatar Button (Right-aligned) */}
        <TouchableOpacity
          onPress={() => setIsUserMenuOpen(true)}
          style={{
            backgroundColor: superTheme.brand,
            borderRadius: 16,
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isDark ? '#3b82f6' : '#93c5fd',
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="User profile and logout menu"
        >
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>{usernameInitial}</Text>
        </TouchableOpacity>

        {/* User Menu Modal with Logout */}
        <UserMenuModal
          isOpen={isUserMenuOpen}
          onClose={() => setIsUserMenuOpen(false)}
          isSuperAdmin={true}
        />
      </View>
    </View>
  );
});

Header.displayName = 'SuperAdminHeader';
export default Header;