import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Menu, Search, Moon, Sun, Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationModal from '@/app/components/NotififcationModal';
import { NotificationService } from '@/Services/NotificationService';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  onMenuPress?: () => void;
}

const Header = React.memo(({ onMenuPress }: HeaderProps) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

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

  const handleOpenNotifications = useCallback(() => setIsNotificationOpen(true), []);
  const handleCloseNotifications = useCallback(() => {
    setIsNotificationOpen(false);
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? '#1e293b' : '#e2e8f0';
  const iconColor = isDark ? '#94a3b8' : '#64748b';
  const searchBg = isDark ? '#1e293b' : '#f8fafc';
  const searchText = isDark ? '#f1f5f9' : '#0f172a';
  const searchPlaceholder = isDark ? '#64748b' : '#94a3b8';

  const containerStyle = useMemo(
    () => ({
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 16,
      paddingTop: 12 + insets.top,
      paddingBottom: 12,
      backgroundColor: bgColor,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      zIndex: 50,
    }),
    [insets.top, bgColor, borderColor]
  );

  return (
    <View style={containerStyle}>
      {/* Menu Icon Button */}
      {onMenuPress && (
        <TouchableOpacity onPress={onMenuPress} style={{ padding: 4, marginRight: 4 }}>
          <Menu size={20} color={iconColor} />
        </TouchableOpacity>
      )}
      {/* User Avatar */}
      <View
        style={{
          backgroundColor: '#2563eb',
          borderRadius: 16,
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: isDark ? '#3b82f6' : '#93c5fd',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>S</Text>
      </View>

      {/* Search Bar Pill */}
      <View
        style={{
          flex: 1,
          marginHorizontal: 12,
          backgroundColor: searchBg,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: borderColor,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          height: 36,
        }}
      >
        <Search size={14} color={iconColor} />
        <TextInput
          placeholder="Search leads, documents..."
          placeholderTextColor={searchPlaceholder}
          style={{
            flex: 1,
            height: '100%',
            color: searchText,
            marginLeft: 8,
            fontSize: 13,
            padding: 0,
          }}
          editable={true}
        />
      </View>

      {/* Action Icons */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Dark/Light Mode Toggle */}
        <TouchableOpacity onPress={toggleTheme} style={{ padding: 4 }}>
          {isDark ? (
            <Sun size={20} color={iconColor} />
          ) : (
            <Moon size={20} color={iconColor} />
          )}
        </TouchableOpacity>

        {/* Notifications Icon */}
        <TouchableOpacity
          onPress={handleOpenNotifications}
          style={{ padding: 4, position: 'relative' }}
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

        <NotificationModal
          isOpen={isNotificationOpen}
          onClose={handleCloseNotifications}
        />
      </View>
    </View>
  );
});

Header.displayName = 'SuperAdminHeader';
export default Header;