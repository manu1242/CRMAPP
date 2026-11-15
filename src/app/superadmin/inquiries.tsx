import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../theme/adminTheme';
import { PublicLeadsContent } from '../../superadmin/public-leads';

export default function InquiriesScreen() {
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);

  return (
    <View style={{ flex: 1, backgroundColor: theme.primaryBg }}>
      <PublicLeadsContent initialType="Enquiry" />
    </View>
  );
}
