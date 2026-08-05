import React, { useState } from 'react';
import { TextInput, View, TouchableOpacity, Text } from 'react-native';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function PasswordInput({ value, onChangeText, placeholder = 'Enter password' }: PasswordInputProps) {
  const [secureText, setSecureText] = useState(true);

  return (
    <View className="flex-row items-center border border-slate-200 rounded-custom h-12 mb-4 px-3 bg-white">
      <TextInput
        className="flex-1 text-base h-full"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureText}
        autoCapitalize="none"
      />
      <TouchableOpacity 
        className="p-2"
        onPress={() => setSecureText(!secureText)}
      >
        <Text className="text-accent font-semibold">{secureText ? 'Show' : 'Hide'}</Text>
      </TouchableOpacity>
    </View>
  );
}
