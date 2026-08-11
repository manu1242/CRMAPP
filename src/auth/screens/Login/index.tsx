import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AuthHeader from '../../components/AuthHeader';
import LoginForm from '../../components/LoginForm';
import { useAuthStore } from '@/auth/store/authStore';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/superadmin/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <SafeAreaView className="flex-1 bg-[#f3f4f6]" style={{ flex: 1 }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View className="flex-1 bg-primary-bg justify-center px-4 " style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
        <AuthHeader
          title="Welcome Back"
          subtitle="Enter your credentials to access your dashboard"
        />

        <LoginForm />

        <View className="items-center mt-2">
          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text className="text-accent font-semibold text-sm">Forgot Password?</Text>
          </TouchableOpacity>
        </View>


      </View>
    </SafeAreaView>
  );
}
