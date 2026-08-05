import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';

interface ScreenLoaderProps {
  message?: string;
}

export const ScreenLoader = React.memo(({ message }: ScreenLoaderProps) => {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: adminTheme.primaryBg,
        padding: 24,
      }}
    >
      <ActivityIndicator size="large" color={adminTheme.brand || '#3b82f6'} />
      {message && (
        <Text
          style={{
            marginTop: 12,
            fontSize: 13,
            fontWeight: '500',
            color: adminTheme.textSecondary,
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
