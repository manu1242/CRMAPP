import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';

interface RememberMeProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export default function RememberMe({ checked, onChange }: RememberMeProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity 
      className="flex-row items-center mb-4 py-1" 
      onPress={() => onChange(!checked)}
      activeOpacity={0.8}
    >
      <View 
        className="w-5 h-5 border-2 border-accent rounded justify-center items-center mr-2"
        style={{ backgroundColor: checked ? '#10b981' : theme.inputBg }}
      >
        {checked && <View className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#ffffff' }} />}
      </View>
      <Text className="text-sm" style={{ color: theme.textSecondary }}>Remember me</Text>
    </TouchableOpacity>
  );
}
