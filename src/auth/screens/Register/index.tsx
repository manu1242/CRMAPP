import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AuthHeader from '../../components/AuthHeader';
import KeyboardSafeArea from '../../components/KeyboardSafeArea';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';

export default function RegisterScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName) {
      setError('All fields are required');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Logic for user registration
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <KeyboardSafeArea backgroundColor={theme.primaryBg} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}>
      <AuthHeader 
        title="Create Account" 
        subtitle="Sign up to start managing your CRM" 
      />
      <View style={{ width: '100%', padding: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6, color: theme.textSecondary }}>First Name</Text>
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
          value={firstName} 
          onChangeText={setFirstName} 
          placeholder="First name"
          placeholderTextColor={theme.textMuted}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          autoCorrect={false}
          returnKeyType="next"
        />

        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6, color: theme.textSecondary }}>Last Name</Text>
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
          value={lastName} 
          onChangeText={setLastName} 
          placeholder="Last name"
          placeholderTextColor={theme.textMuted}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          autoCorrect={false}
          returnKeyType="next"
        />

        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6, color: theme.textSecondary }}>Email</Text>
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
          value={email} 
          onChangeText={setEmail} 
          placeholder="Email" 
          placeholderTextColor={theme.textMuted}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          keyboardType="email-address" 
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
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
          placeholder="Password" 
          placeholderTextColor={theme.textMuted}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          secureTextEntry
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />

        {error ? <Text style={{ color: '#ef4444', marginBottom: 12 }}>{error}</Text> : null}

        <TouchableOpacity 
          className="btn-primary mt-2 h-12 flex-row" 
          onPress={handleRegister} 
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold">Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ marginTop: 20, alignItems: 'center' }}
          onPress={() => router.push('/login')}
        >
          <Text className="text-accent font-semibold">Already have an account? Log In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardSafeArea>
  );
}
