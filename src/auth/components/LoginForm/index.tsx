import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useLogin } from '../../hooks/useLogin';
import { useAuthStore } from '../../store/authStore';

export default function LoginForm() {
  const router = useRouter();
  const store = useAuthStore();
  const { login, isLoading, error } = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) return;
    const success = await login({ username, password, rememberMe });
    if (success) {
      const user = useAuthStore.getState().user;
      const role = user?.role?.toLowerCase();
      if (role === 'superadmin') {
        router.replace('/superadmin/dashboard');
      } else if (role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/select-workspace');
      }
    }
  };

  return (
    <View className="w-full p-4">
      <Text className="text-sm font-semibold mb-1.5 text-secondary-text">Username</Text>
      <TextInput
        className="h-12 border border-slate-200 rounded-custom px-3 mb-4 text-base bg-white"
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
        autoCapitalize="none"
      />

      <Text className="text-sm font-semibold mb-1.5 text-secondary-text">Password</Text>
      <TextInput
        className="h-12 border border-slate-200 rounded-custom px-3 mb-4 text-base bg-white"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
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
