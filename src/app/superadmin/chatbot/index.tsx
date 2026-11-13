import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import { SuperAdminChatbotContent } from '../../../superadmin/chatbot';

export default function SuperAdminChatbotScreen() {
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);

  return (
    <View style={{ flex: 1, backgroundColor: theme.primaryBg }}>
      <SuperAdminChatbotContent />
    </View>
  );
}

