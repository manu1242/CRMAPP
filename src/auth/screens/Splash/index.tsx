import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSession } from '../../hooks/useSession';

export default function SplashScreen() {
  const { isLoading } = useSession();

  return (
    <View className="flex-1 justify-center items-center bg-primary-bg">
      <Text className="text-3xl font-bold text-accent tracking-widest font-display">CRM APP</Text>
      <ActivityIndicator size="large" color="#0284c7" className="mt-6" />
    </View>
  );
}
