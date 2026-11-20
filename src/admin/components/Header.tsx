import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { Menu, Moon, Sun, Bell, Coins } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { useRouter } from 'expo-router';
import { useUnreadNotificationsCount } from '../hooks/useNotificationsQuery';
import { useAuthStore } from '../../auth/store/authStore';
import { triggerHaptic } from '../../utils/haptics';
import { useBrandingQuery } from '../hooks/useBranding';
import { BrandingService } from '../services/BrandingService';
import ReferralWalletSidebar from '../../app/components/ReferralWalletSidebar';
import UserMenuModal from '../../app/components/UserMenuModal';
import { useHeaderScrollStore } from '../store/useHeaderScrollStore';
import { useResponsive } from '../../hooks/useResponsive';

interface HeaderProps {
  onMenuPress?: () => void;
}

const Header = React.memo(({ onMenuPress }: HeaderProps) => {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const adminTheme = getAdminTheme(isDark);
  const user = useAuthStore((state) => state.user);
  const { isSmallPhone } = useResponsive();

  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // Cached + shared with BottomNav; refreshed automatically when a push arrives
  const unreadCount = useUnreadNotificationsCount();

  const handleOpenRewards = useCallback(() => setIsRewardsOpen(true), []);
  const handleCloseRewards = useCallback(() => setIsRewardsOpen(false), []);

  const usernameInitial = useMemo(() => {
    if (user?.username && user.username.trim().length > 0) {
      return user.username.trim().charAt(0).toUpperCase();
    }
    return 'A';
  }, [user?.username]);

  const containerStyle = useMemo(
    () => ({
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: isSmallPhone ? 12 : 16,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: adminTheme.secondaryBg,
      borderBottomWidth: 1,
      borderBottomColor: adminTheme.border,
      zIndex: 50,
    }),
    [adminTheme.secondaryBg, adminTheme.border, isSmallPhone]
  );

  const avatarStyle = useMemo(
    () => ({
      backgroundColor: adminTheme.brand,
      borderRadius: 16,
      width: 32,
      height: 32,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    }),
    [adminTheme.brand]
  );

  const { data: branding } = useBrandingQuery();
  const logoUrl = BrandingService.resolveLogoUri(branding?.companyLogo || branding?.logoPath);
  const brandName = branding?.companyName || 'Admin Panel';
  const headerOffset = useHeaderScrollStore((s) => s.headerOffset);

  const headerOpacity = useMemo(
    () =>
      headerOffset.interpolate({
        inputRange: [-64, 0],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [headerOffset]
  );

  return (
    <Animated.View style={[containerStyle, { marginTop: headerOffset, opacity: headerOpacity, overflow: 'hidden' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: isSmallPhone ? 6 : 10 }}>
        {onMenuPress && (
          <TouchableOpacity onPress={onMenuPress} style={{ padding: 4 }}>
            <Menu size={isSmallPhone ? 22 : 24} color={adminTheme.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={{ color: adminTheme.textPrimary, fontWeight: '700', fontSize: isSmallPhone ? 15 : 16 }}>
          Admin
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: isSmallPhone ? 8 : 12 }}>


        {/* Dark/Light Mode Toggle */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('medium');
            toggleTheme();
          }}
          style={{ padding: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Toggle dark/light mode"
          activeOpacity={0.7}
        >
          {isDark ? (
            <Sun size={20} color={adminTheme.textSecondary} />
          ) : (
            <Moon size={20} color={adminTheme.textSecondary} />
          )}
        </TouchableOpacity>

        {/* Notifications Icon (Navigates to dedicated screen) */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.navigate('/admin/AdminNotification' as any);
          }}
          style={{ padding: 4, position: 'relative' }}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          activeOpacity={0.7}
        >
          <Bell size={20} color={adminTheme.textSecondary} />
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

        {/* Referral Wallet Icon */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            handleOpenRewards();
          }}
          style={{ padding: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Open referral wallet"
          activeOpacity={0.7}
        >
          <Coins size={20} color={adminTheme.textSecondary} />
        </TouchableOpacity>

        <ReferralWalletSidebar
          isOpen={isRewardsOpen}
          onClose={handleCloseRewards}
        />

        {/* User Avatar Button / Branding Image */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setIsUserMenuOpen(true);
          }}
          style={[avatarStyle, { overflow: 'hidden' }]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="User profile and logout menu"
        >
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>{usernameInitial}</Text>
          )}
        </TouchableOpacity>

        {/* User Menu Modal with Logout */}
        <UserMenuModal
          isOpen={isUserMenuOpen}
          onClose={() => setIsUserMenuOpen(false)}
          isSuperAdmin={false}
        />
      </View>
    </Animated.View>
  );
});

Header.displayName = 'AdminHeader';
export default Header;