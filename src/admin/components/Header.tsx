import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu, Moon, Sun, Bell, Coins } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import NotificationModal from '../../app/components/NotififcationModal';
import ReferralWalletSidebar from '../../app/components/ReferralWalletSidebar';
import { NotificationService } from '../../Services/NotificationService';

interface HeaderProps {
  onMenuPress?: () => void;
}

const Header = React.memo(({ onMenuPress }: HeaderProps) => {
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const adminTheme = getAdminTheme(isDark);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const handleOpenRewards = useCallback(() => setIsRewardsOpen(true), []);
  const handleCloseRewards = useCallback(() => setIsRewardsOpen(false), []);
  const handleOpenNotifications = useCallback(() => setIsNotificationOpen(true), []);
  const handleCloseNotifications = useCallback(() => {
    setIsNotificationOpen(false);
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const containerStyle = useMemo(
    () => ({
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 16,
      paddingTop: 12 + insets.top,
      paddingBottom: 12,
      backgroundColor: adminTheme.secondaryBg,
      borderBottomWidth: 1,
      borderBottomColor: adminTheme.border,
      zIndex: 50,
    }),
    [insets.top, adminTheme.secondaryBg, adminTheme.border]
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

  return (
    <View style={containerStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {onMenuPress && (
          <TouchableOpacity onPress={onMenuPress} style={{ padding: 4 }}>
            <Menu size={24} color={adminTheme.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={{ color: adminTheme.textSecondary, fontWeight: '700', fontSize: 16 }}>
          Admin Panel
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Dark/Light Mode Toggle */}
        <TouchableOpacity onPress={toggleTheme} style={{ padding: 4 }}>
          {isDark ? (
            <Sun size={20} color={adminTheme.textSecondary} />
          ) : (
            <Moon size={20} color={adminTheme.textSecondary} />
          )}
        </TouchableOpacity>

        {/* Referral Wallet Icon */}
        <TouchableOpacity 
          onPress={handleOpenRewards}
          style={{ padding: 4 }}
          activeOpacity={0.7}
        >
          <Coins size={20} color={adminTheme.textSecondary} />
        </TouchableOpacity>

        {/* Notifications Icon */}
        <TouchableOpacity 
          onPress={handleOpenNotifications}
          style={{ padding: 4, position: 'relative' }}
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

        <NotificationModal 
          isOpen={isNotificationOpen} 
          onClose={handleCloseNotifications} 
        />

        <ReferralWalletSidebar 
          isOpen={isRewardsOpen} 
          onClose={handleCloseRewards} 
        />

        {/* User Avatar */}
        <View style={avatarStyle}>
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>A</Text>
        </View>
      </View>
    </View>
  );
});

Header.displayName = 'AdminHeader';
export default Header;
