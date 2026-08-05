import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AuthHeader from '../../components/AuthHeader';
import KeyboardSafeArea from '../../components/KeyboardSafeArea';

export default function RegisterScreen() {
  const router = useRouter();
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
    <KeyboardSafeArea contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}>
      <AuthHeader 
        title="Create Account" 
        subtitle="Sign up to start managing your CRM" 
      />
      <View style={{ width: '100%', padding: 16 }}>
        <Text className="text-sm font-semibold mb-1.5 text-secondary-text">First Name</Text>
        <TextInput 
          className="h-12 border border-slate-200 rounded-custom px-3 mb-4 text-base bg-white" 
          value={firstName} 
          onChangeText={setFirstName} 
          placeholder="First name"
          autoCorrect={false}
          returnKeyType="next"
        />

        <Text className="text-sm font-semibold mb-1.5 text-secondary-text">Last Name</Text>
        <TextInput 
          className="h-12 border border-slate-200 rounded-custom px-3 mb-4 text-base bg-white" 
          value={lastName} 
          onChangeText={setLastName} 
          placeholder="Last name"
          autoCorrect={false}
          returnKeyType="next"
        />

        <Text className="text-sm font-semibold mb-1.5 text-secondary-text">Email</Text>
        <TextInput 
          className="h-12 border border-slate-200 rounded-custom px-3 mb-4 text-base bg-white" 
          value={email} 
          onChangeText={setEmail} 
          placeholder="Email" 
          keyboardType="email-address" 
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />

        <Text className="text-sm font-semibold mb-1.5 text-secondary-text">Password</Text>
        <TextInput 
          className="h-12 border border-slate-200 rounded-custom px-3 mb-4 text-base bg-white" 
          value={password} 
          onChangeText={setPassword} 
          placeholder="Password" 
          secureTextEntry
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />

        {error ? <Text className="text-red-500 mb-3">{error}</Text> : null}

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
