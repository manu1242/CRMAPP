import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import { PublicLeadDetailContent } from '../../../superadmin/public-leads';

export default function PublicLeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);

  return (
    <View style={{ flex: 1, backgroundColor: theme.primaryBg }}>
      <PublicLeadDetailContent id={id} />
    </View>
  );
}
