import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateTenantMutation } from '../../superadmin/tenants/hooks/useTenants';
import { TenantFormFields } from '../../superadmin/tenants/components/TenantFormFields';
import { useTheme } from '../../contexts/ThemeContext';
import BottomNav from '../../superadmin/components/BottomNav';

export default function CreateTenantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    companyName?: string;
    subdomain?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    referralCode?: string;
  }>();
  const createMutation = useCreateTenantMutation();
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    companyName: params.companyName || '',
    subdomain: params.subdomain || '',
    plan: '',      // human-readable plan name (set by picker)
    planId: 0,     // actual planId (set by picker)
    contactPerson: params.contactPerson || '',
    email: params.email || '',
    phone: params.phone || '',
    referralCode: params.referralCode || '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Theme colors
  const bgColor = isDark ? '#0f172a' : '#f3f4f6';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#f1f5f9';

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.companyName.trim()) errors.companyName = 'Company name is required';

    if (!formData.subdomain.trim()) {
      errors.subdomain = 'Subdomain is required';
    } else if (formData.subdomain.length < 3) {
      errors.subdomain = 'Subdomain must be at least 3 characters';
    }

    if (!formData.contactPerson.trim()) errors.contactPerson = 'Contact person is required';

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email address is invalid';
    }

    if (!formData.phone.trim()) errors.phone = 'Phone number is required';

    if (!formData.planId || formData.planId === 0) {
      errors.plan = 'Please select a subscription plan';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Android physical back button override
  useEffect(() => {
    const backAction = () => {
      router.replace('/superadmin/tenants-hub');
      return true; // prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [router]);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    createMutation.mutate(
      {
        companyName: formData.companyName,
        subdomain: formData.subdomain,
        plan: formData.plan,
        planId: formData.planId,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        referralCode: formData.referralCode || undefined,
      },
      {
        onSuccess: () => {
          router.replace('/superadmin/tenants-hub');
        },
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor, paddingTop: insets.top }}>
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        {/* Title Block */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>New Tenant Workspace</Text>
          <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
            Fill in the details below to provision a new tenant
          </Text>
        </View>

        {/* Form Container */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: borderCol }}>
              <Ionicons name="business-outline" size={16} color="#1e73be" />
              <Text style={{ color: '#1e73be', fontWeight: '700', fontSize: 14 }}>Tenant Registration Form</Text>
            </View>

            <TenantFormFields
              formData={formData}
              setFormData={setFormData as any}
              isEdit={false}
              validationErrors={validationErrors}
            />

            {/* Submit & Cancel Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, borderTopWidth: 1, borderTopColor: borderCol, paddingTop: 16 }}>
              <TouchableOpacity
                onPress={() => router.replace('/superadmin/tenants-hub')}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                }}
              >
                <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontWeight: '700', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={createMutation.isPending}
                style={{
                  flex: 1,
                  backgroundColor: '#1e73be',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Create Tenant</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* <BottomNav active="tenants" /> */}
      </View>
    </View>
  );
}
