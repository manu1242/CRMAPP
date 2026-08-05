import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTenantDetailQuery, useUpdateTenantMutation } from '@/superadmin/tenants/hooks/useTenants';
import { TenantFormFields } from '@/superadmin/tenants/components/TenantFormFields';
import { useTheme } from '@/contexts/ThemeContext';
import BottomNav from '@/superadmin/components/BottomNav';

export default function EditTenantScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const parsedId = typeof id === 'string' ? id : '';
  const { isDark } = useTheme();

  // Theme colors
  const bgColor = isDark ? '#0f172a' : '#f3f4f6';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#f1f5f9';

  // Get tenant details query
  const { data, isLoading, error } = useTenantDetailQuery(parsedId);
  const updateMutation = useUpdateTenantMutation();

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    plan: '',
    maxUsers: 20,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Pre-fill form data once tenant detail query resolves
  useEffect(() => {
    if (data?.success && data?.data) {
      const tenant = data.data;
      setFormData({
        companyName: tenant.companyName || '',
        contactPerson: tenant.contactPerson || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        plan: tenant.plan || '',
        maxUsers: tenant.maxUsers || 20,
      });
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
        router.back();
      }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={['bottom', 'left', 'right']}>
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        {/* Top Navbar */}
        <View style={{
          backgroundColor: isDark ? '#1e293b' : '#0f172a',
          paddingHorizontal: 16,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#334155' : '#1e293b',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 4,
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>Edit Tenant Metadata</Text>
        </View>

        {/* Form Container */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={{ color: subTextColor, fontSize: 12, fontWeight: '600', marginTop: 8 }}>Loading metadata...</Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginTop: 16 }}>Failed to load tenant details</Text>
            <Text style={{ color: subTextColor, fontSize: 12, textAlign: 'center', marginTop: 8 }}>{(error as any).message || 'Server error occurred.'}</Text>
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 12 }}>
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16 }}>
              <Text style={{ color: '#1e73be', fontWeight: '700', fontSize: 14, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: borderCol, paddingBottom: 8 }}>
                Update details for {data?.data?.companyName}
              </Text>

              <TenantFormFields
                formData={formData}
                setFormData={setFormData as any}
                isEdit={true}
                validationErrors={validationErrors}
              />

              {/* Submit & Cancel Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, borderTopWidth: 1, borderTopColor: borderCol, paddingTop: 16 }}>
                <TouchableOpacity
                  onPress={() => router.back()}
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
                  disabled={updateMutation.isPending}
                  style={{
                    flex: 1,
                    backgroundColor: '#1e73be',
                    paddingVertical: 12,
                    borderRadius: 12,
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

        <BottomNav active="tenants" />
      </View>
    </SafeAreaView>
  );
}
