import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu, Moon, Sun, Bell, Coins } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import ReferralWalletSidebar from '../../app/components/ReferralWalletSidebar';

interface HeaderProps {
  onMenuPress?: () => void;
}

const Header = React.memo(({ onMenuPress }: HeaderProps) => {
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const adminTheme = getAdminTheme(isDark);

  const [isRewardsOpen, setIsRewardsOpen] = useState(false);


  const handleOpenRewards = useCallback(() => setIsRewardsOpen(true), []);
  const handleCloseRewards = useCallback(() => setIsRewardsOpen(false), []);


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
       

        {/* Referral Wallet Icon */}
        <TouchableOpacity 
          onPress={handleOpenRewards}
          style={{ padding: 4 }}
          activeOpacity={0.7}
        >
          <Coins size={20} color={adminTheme.textSecondary} />
        </TouchableOpacity>

       

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
