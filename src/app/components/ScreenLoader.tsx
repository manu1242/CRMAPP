import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme, getSuperAdminTheme } from '../../theme/adminTheme';
import { useSegments } from 'expo-router';
import { useAuthStore } from '../../auth/store/authStore';

interface ScreenLoaderProps {
  message?: string;
  variant?: 'admin' | 'superadmin' | 'auto';
  color?: string;
  backgroundColor?: string;
}

export const ScreenLoader = React.memo(({
  message,
  variant = 'auto',
  color,
  backgroundColor,
}: ScreenLoaderProps) => {
  const { isDark } = useTheme();
  let isSuperAdmin = false;

  try {
    const segments = useSegments();
    const routeIsSuperAdmin = segments.some(
      (segment) => typeof segment === 'string' && segment.toLowerCase().includes('superadmin')
    );
    const userRole = useAuthStore.getState().user?.role?.toLowerCase();
    isSuperAdmin =
      variant === 'superadmin' ||
      (variant === 'auto' && (routeIsSuperAdmin || userRole === 'superadmin'));
  } catch {
    const userRole = useAuthStore.getState().user?.role?.toLowerCase();
    isSuperAdmin = variant === 'superadmin' || userRole === 'superadmin';
  }

  const theme = isSuperAdmin ? getSuperAdminTheme(isDark) : getAdminTheme(isDark);
  const spinnerColor = color || (isSuperAdmin ? (isDark ? '#3b82f6' : '#2563eb') : theme.brand || '#3b82f6');
  const bg = backgroundColor || theme.primaryBg;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: bg,
        padding: 24,
      }}
    >
      <ActivityIndicator size="large" color={spinnerColor} />
      {message && (
        <Text
          style={{
            marginTop: 12,
            fontSize: 13,
            fontWeight: '500',
            color: theme.textSecondary,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
});

ScreenLoader.displayName = 'ScreenLoader';
export default ScreenLoader;

