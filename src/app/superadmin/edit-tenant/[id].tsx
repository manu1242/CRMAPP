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

import { useTenantDetailQuery, useUpdateTenantMutation } from '../../../superadmin/tenants/hooks/useTenants';
import { TenantFormFields } from '../../../superadmin/tenants/components/TenantFormFields';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';

export default function EditTenantScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { bottomSpacing } = useBottomNavSpacing();
  const parsedId = typeof id === 'string' ? id : '';
  const { isDark } = useTheme();

  // Theme colors
  const bgColor = isDark ? '#161616' : '#FFFFFF';
  const cardBg = isDark ? '#242424' : '#ffffff';
  const textColor = isDark ? '#FFFFFF' : '#0a0a0a';
  const subTextColor = isDark ? '#a1a1aa' : '#52525b';
  const borderCol = isDark ? '#2e2e2e' : '#e4e4e7';

  // Get tenant details query
  const { data, isLoading, error } = useTenantDetailQuery(parsedId);
  const updateMutation = useUpdateTenantMutation();

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    plan: '',
    planId: 0,
    maxUsers: 20,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Pre-fill form data once tenant detail query resolves
  useEffect(() => {
    if (data?.success && data?.data) {
      const tenant = data.data;
      setFormData((prev) => ({
        ...prev,
        companyName: tenant.companyName || '',
        contactPerson: tenant.contactPerson || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        plan: tenant.plan || '',
        planId: 0, // planId will be resolved by TenantFormFields once plans load
        maxUsers: tenant.maxUsers || 20,
      }));
    }
  }, [data]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.companyName.trim()) errors.companyName = 'Company name is required';
    if (!formData.contactPerson.trim()) errors.contactPerson = 'Contact person is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email address is invalid';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.plan.trim()) errors.plan = 'Plan is required';
    if (!formData.maxUsers || formData.maxUsers <= 0) errors.maxUsers = 'User limit must be greater than 0';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    updateMutation.mutate({
      id: parsedId,
      data: formData
    }, {
      onSuccess: () => {
        router.replace('/superadmin/tenants-hub');
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
        {/* Title Block (When loaded) */}
        {!isLoading && !error && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>Edit Tenant Metadata</Text>
            <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
              Update details for {data?.data?.companyName}
            </Text>
          </View>
        )}

        {/* Form Container */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#835CEE" />
            <Text style={{ color: subTextColor, fontSize: 12, fontWeight: '600', marginTop: 8 }}>Loading metadata...</Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginTop: 16 }}>Failed to load tenant details</Text>
            <Text style={{ color: subTextColor, fontSize: 12, textAlign: 'center', marginTop: 8 }}>{(error as any).message || 'Server error occurred.'}</Text>
            <TouchableOpacity onPress={() => router.replace('/superadmin/tenants-hub')} style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: isDark ? '#2e2e2e' : '#e4e4e7', borderRadius: 10 }}>
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: bottomSpacing, flexGrow: 1 }}>
            <View style={{ backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: borderCol, padding: 16 }}>
              <TenantFormFields
                formData={formData}
                setFormData={setFormData as any}
                isEdit={true}
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
                    borderRadius: 10,
                    alignItems: 'center',
                    backgroundColor: isDark ? '#242424' : '#ffffff',
                  }}
                >
                  <Text style={{ color: isDark ? '#a1a1aa' : '#52525b', fontWeight: '700', fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={updateMutation.isPending}
                  style={{
                    flex: 1,
                    backgroundColor: '#835CEE',
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  {updateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* <BottomNav active="tenants" /> */}
    </View>
  );
}
