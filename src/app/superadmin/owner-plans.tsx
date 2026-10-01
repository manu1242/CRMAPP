import React, { useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { OwnerPlansContent } from '../../superadmin/owner-plans/components/OwnerPlansContent';

export default function OwnerPlansScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  // Handle Android physical back button override to go back to subscriptions hub
  useEffect(() => {
    const backAction = () => {
      router.replace('/superadmin/subscriptions-hub');
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
      <OwnerPlansContent />
    </View>
  );
}
