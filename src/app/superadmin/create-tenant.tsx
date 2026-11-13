import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateTenantMutation } from '../../superadmin/tenants/hooks/useTenants';
import { TenantFormFields } from '../../superadmin/tenants/components/TenantFormFields';
import { useTheme } from '../../contexts/ThemeContext';
import { useBottomNavSpacing } from '../../hooks/useBottomNavSpacing';

export default function CreateTenantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bottomSpacing } = useBottomNavSpacing();
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
  const bgColor = isDark ? '#161616' : '#FFFFFF';
  const cardBg = isDark ? '#242424' : '#ffffff';
  const textColor = isDark ? '#FFFFFF' : '#0a0a0a';
  const subTextColor = isDark ? '#a1a1aa' : '#52525b';
  const borderCol = isDark ? '#2e2e2e' : '#e4e4e7';

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
    <View style={{ flex: 1, marginBottom:60, backgroundColor: bgColor }}>
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        {/* Title Block */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>New Tenant Workspace</Text>
          <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
            Fill in the details below to provision a new tenant
          </Text>
        </View>

        {/* Form Container */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: bottomSpacing, flexGrow: 1 }}>
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
                  borderColor: isDark ? '#2e2e2e' : '#e4e4e7',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: isDark ? '#242424' : '#ffffff',
                }}
              >
                <Text style={{ color: isDark ? '#a1a1aa' : '#52525b', fontWeight: '700', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={createMutation.isPending}
                style={{
                  flex: 1,
                  backgroundColor: '#835CEE',
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
