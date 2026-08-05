import React from 'react';
import { Text, View } from 'react-native';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View className="items-center my-6 px-4">
      <Text className="text-2xl font-bold text-primary-text text-center font-display">{title}</Text>
      {subtitle ? <Text className="text-base text-secondary-text mt-2 text-center">{subtitle}</Text> : null}
    </View>
  );
}
