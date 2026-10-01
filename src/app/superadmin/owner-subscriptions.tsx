import React, { useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { OwnerSubscriptionsContent } from '../../superadmin/owner-subscriptions/components/OwnerSubscriptionsContent';

export default function OwnerSubscriptionsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  // Handle Android hardware back button override to go back to subscriptions hub
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
      <OwnerSubscriptionsContent />
    </View>
  );
}
