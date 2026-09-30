import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useLogin } from '../../hooks/useLogin';
import { useAuthStore } from '../../store/authStore';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';

export default function LoginForm() {
  const router = useRouter();
  const store = useAuthStore();
  const { login, isLoading, error } = useLogin();
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) return;
    const result = await login({ username, password, rememberMe });
    if (result === 'pick_workspace') {
      router.replace('/select-workspace');
    } else if (result === 'success') {
      const user = useAuthStore.getState().user;
      const role = user?.role?.toLowerCase();
      if (role === 'superadmin') {
        router.replace('/superadmin/dashboard');
      } else if (role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/admin/dashboard');
      }
    }
    // 'error' is handled by the error state in the store (shows toast + inline error)
  };

  return (
    <View style={{ width: '100%', padding: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6, color: theme.textSecondary }}>Username</Text>
      <TextInput
        style={{
          height: 48,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          marginBottom: 16,
          fontSize: 16,
          backgroundColor: theme.cardBg,
          color: theme.textPrimary,
        }}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username or email"
        placeholderTextColor={theme.textMuted}
        keyboardAppearance={isDark ? 'dark' : 'light'}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="username"
      />

      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6, color: theme.textSecondary }}>Password</Text>
      <TextInput
        style={{
          height: 48,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          marginBottom: 16,
          fontSize: 16,
          backgroundColor: theme.cardBg,
          color: theme.textPrimary,
        }}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        placeholderTextColor={theme.textMuted}
        keyboardAppearance={isDark ? 'dark' : 'light'}
        secureTextEntry
      />

      {error ? <Text className="text-red-500 mb-3">{error}</Text> : null}

      <TouchableOpacity 
        className="btn-primary mt-2 h-12 flex-row" 
        onPress={handleSubmit} 
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base font-bold">Log In</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
