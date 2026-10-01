import React, { useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { PublicLeadsContent } from '../../superadmin/public-leads/components/PublicLeadsContent';

export default function InquiriesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  // Handle Android physical back button override to go to dashboard
  useEffect(() => {
    const backAction = () => {
      router.replace('/superadmin/dashboard');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [router]);

  const bgColor = isDark ? '#0f172a' : '#f8fafc';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <PublicLeadsContent />
    </View>
  );
}
