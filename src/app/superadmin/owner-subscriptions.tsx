import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { OwnerSubscriptionsContent } from '../../superadmin/owner-subscriptions/components/OwnerSubscriptionsContent';

export default function OwnerSubscriptionsScreen() {
  const { isDark } = useTheme();

  const bgColor = isDark ? '#161616' : '#FFFFFF';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <OwnerSubscriptionsContent />
    </View>
  );
}
