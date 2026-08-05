import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface RememberMeProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export default function RememberMe({ checked, onChange }: RememberMeProps) {
  return (
    <TouchableOpacity 
      className="flex-row items-center mb-4 py-1" 
      onPress={() => onChange(!checked)}
      activeOpacity={0.8}
    >
      <View className={`w-5 h-5 border-2 border-accent rounded justify-center items-center mr-2 ${checked ? 'bg-accent' : 'bg-white'}`}>
        {checked && <View className="w-2 h-2 bg-white rounded-sm" />}
      </View>
      <Text className="text-sm text-primary-text">Remember me</Text>
    </TouchableOpacity>
  );
}
