import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import { PendingPropertiesContent } from '../../../superadmin/pending-properties';

export default function PendingPropertiesScreen() {
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);

  return (
    <View style={{ flex: 1, backgroundColor: theme.primaryBg }}>
      <PendingPropertiesContent />
    </View>
  );
}

