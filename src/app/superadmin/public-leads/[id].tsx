import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { PublicLeadDetailContent } from '../../../superadmin/public-leads/components/PublicLeadDetailContent';

export default function PublicLeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();

  const bgColor = isDark ? '#0f172a' : '#f8fafc';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <PublicLeadDetailContent id={id} />
    </View>
  );
}
