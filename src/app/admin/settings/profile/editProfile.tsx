import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '@/theme/adminTheme';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
} from 'lucide-react-native';
import { profileService, EditProfilePayload } from '../../../../admin/services/profileService';

export default function EditProfileScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<EditProfilePayload>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await profileService.getProfile();
        if (res && res.success && res.data) {
          const d = res.data;
          setForm({
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            email: d.email || '',
            phoneNumber: d.phone || '',
            address: d.address || '',
            city: d.city || '',
            state: d.state || '',
            country: d.country || '',
            postalCode: d.postalCode || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile for edit:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    if (!form.email) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Email address is required.',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await profileService.editProfile(form);
      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: res.message || 'Profile updated successfully!',
        });
        router.back();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: res.message || 'Failed to update profile',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err.message || 'Server error updating profile',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Header Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: inputBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color={textColor} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Edit Profile</Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || loading}
          style={{
            backgroundColor: '#10b981',
            paddingHorizontal: 14,
            height: 38,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Save size={15} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>
              Loading profile editor...
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* Personal Info Card */}
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 16,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                Personal Details
              </Text>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    First Name
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    placeholder="First Name"
                    placeholderTextColor={subTextColor}
                    value={form.firstName}
                    onChangeText={(val) => setForm({ ...form, firstName: val })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Last Name
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    placeholder="Last Name"
                    placeholderTextColor={subTextColor}
                    value={form.lastName}
                    onChangeText={(val) => setForm({ ...form, lastName: val })}
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Email Address *
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    color: textColor,
                    backgroundColor: bgColor,
                    fontSize: 13,
                  }}
                  keyboardType="email-address"
                  placeholder="Email Address"
                  placeholderTextColor={subTextColor}
                  value={form.email}
                  onChangeText={(val) => setForm({ ...form, email: val })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Phone Number
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    color: textColor,
                    backgroundColor: bgColor,
                    fontSize: 13,
                  }}
                  keyboardType="phone-pad"
                  placeholder="Phone Number"
                  placeholderTextColor={subTextColor}
                  value={form.phoneNumber}
                  onChangeText={(val) => setForm({ ...form, phoneNumber: val })}
                />
              </View>
            </View>

            {/* Address Details Card */}
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 16,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                Address & Location
              </Text>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Address
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    color: textColor,
                    backgroundColor: bgColor,
                    fontSize: 13,
                  }}
                  placeholder="Street / Road Address"
                  placeholderTextColor={subTextColor}
                  value={form.address}
                  onChangeText={(val) => setForm({ ...form, address: val })}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    City
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    placeholder="City"
                    placeholderTextColor={subTextColor}
                    value={form.city}
                    onChangeText={(val) => setForm({ ...form, city: val })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    State
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    placeholder="State"
                    placeholderTextColor={subTextColor}
                    value={form.state}
                    onChangeText={(val) => setForm({ ...form, state: val })}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Country
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    placeholder="Country"
                    placeholderTextColor={subTextColor}
                    value={form.country}
                    onChangeText={(val) => setForm({ ...form, country: val })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Postal Code
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    placeholder="Postal Code"
                    placeholderTextColor={subTextColor}
                    value={form.postalCode}
                    onChangeText={(val) => setForm({ ...form, postalCode: val })}
                  />
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
