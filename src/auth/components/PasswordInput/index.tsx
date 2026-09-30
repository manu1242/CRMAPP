import React, { useState } from 'react';
import { TextInput, View, TouchableOpacity, Text } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function PasswordInput({ value, onChangeText, placeholder = 'Enter password' }: PasswordInputProps) {
  const [secureText, setSecureText] = useState(true);
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 10,
        height: 48,
        marginBottom: 16,
        paddingHorizontal: 12,
        backgroundColor: theme.cardBg,
      }}
    >
      <TextInput
        style={{ flex: 1, fontSize: 16, height: '100%', color: theme.textPrimary }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardAppearance={isDark ? 'dark' : 'light'}
        secureTextEntry={secureText}
        autoCapitalize="none"
      />
      <TouchableOpacity 
        style={{ padding: 8 }}
        onPress={() => setSecureText(!secureText)}
      >
        <Text style={{ color: theme.accent, fontWeight: '600' }}>{secureText ? 'Show' : 'Hide'}</Text>
      </TouchableOpacity>
    </View>
  );
}
