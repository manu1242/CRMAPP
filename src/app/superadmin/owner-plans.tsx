import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { OwnerPlansContent } from '../../superadmin/owner-plans/components/OwnerPlansContent';

export default function OwnerPlansScreen() {
  const { isDark } = useTheme();

  const bgColor = isDark ? '#161616' : '#FFFFFF';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <OwnerPlansContent />
    </View>
  );
}
