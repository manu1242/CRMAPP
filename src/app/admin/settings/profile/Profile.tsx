import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useAuthStore } from '../../../../auth/store/authStore';
import { getAdminTheme } from '@/theme/adminTheme';
import {
  User,
  Mail,
  Phone,
  Shield,
  MapPin,
  Edit,
  Lock,
  X,
  Building,
  Globe,
} from 'lucide-react-native';
import { profileService, UserProfileData } from '../../../../admin/services/profileService';

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const authUser = useAuthStore((state) => state.user);
  const isImpersonating = useAuthStore((state) => state.isImpersonating);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getFallbackProfile = useCallback((): UserProfileData => ({
    userId: typeof authUser?.userId === 'number' ? authUser.userId : 1,
    username: authUser?.username || 'User',
    email: authUser?.email || 'user@example.com',
    role: authUser?.role || 'Admin',
    phone: (authUser as any)?.phone || '',
    firstName: authUser?.username || '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  }), [authUser]);

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await profileService.getProfile();
      if (res && res.success && res.data) {
        setProfile(res.data);
      } else {
        setProfile(getFallbackProfile());
      }
    } catch (err: any) {
      console.warn('Profile fetch warning (using fallback):', err?.message);
      setProfile(getFallbackProfile());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getFallbackProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChangePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your current and new password.',
      });
      return;
    }

    if (passForm.newPassword !== passForm.confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'New passwords do not match.',
      });
      return;
    }

    setChangePassLoading(true);
    try {
      const res = await profileService.changePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });

      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Password Changed',
          text2: res.message || 'Password changed successfully!',
        });
        setIsPasswordModalOpen(false);
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Password Error',
          text2: res.message || 'Failed to change password',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err.message || 'Error changing password',
      });
    } finally {
      setChangePassLoading(false);
    }
  };

  const activeProfile: UserProfileData = profile || getFallbackProfile();

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} />
        }
      >
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading profile...</Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* Header User Card */}
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 20,
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                onPress={() => router.push('/admin/settings/profile/editProfile')}
                activeOpacity={0.8}
                style={{
                  position: 'relative',
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#3b82f620',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#3b82f650',
                  }}
                >
                  <Text style={{ fontSize: 32, fontWeight: '700', color: '#3b82f6' }}>
                    {activeProfile.username ? activeProfile.username.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: '#3b82f6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: cardBg,
                  }}
                >
                  <Edit size={12} color="#ffffff" />
                </View>
              </TouchableOpacity>

              <Text style={{ fontSize: 20, fontWeight: '800', color: textColor }}>
                {activeProfile.username || `${activeProfile.firstName || ''} ${activeProfile.lastName || ''}`}
              </Text>
              <Text style={{ fontSize: 13, color: subTextColor, marginTop: 2 }}>{activeProfile.email}</Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor: '#10b98115',
                    borderWidth: 1,
                    borderColor: '#10b98140',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Shield size={12} color="#10b981" />
                  <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700' }}>
                    {activeProfile.role || 'Admin'}
                  </Text>
                </View>

                {isImpersonating && (
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: '#eab30820',
                      borderWidth: 1,
                      borderColor: '#eab30850',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Text style={{ fontSize: 11 }}>🕵️</Text>
                    <Text style={{ color: '#a16207', fontSize: 12, fontWeight: '700' }}>
                      Impersonating
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Personal Details Section */}
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
                Personal Information
              </Text>

              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <User size={16} color={subTextColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Full Name</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                      {activeProfile.firstName || activeProfile.lastName
                        ? `${activeProfile.firstName || ''} ${activeProfile.lastName || ''}`.trim()
                        : activeProfile.username}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Mail size={16} color={subTextColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Email Address</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                      {activeProfile.email}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Phone size={16} color={subTextColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Phone Number</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                      {activeProfile.phone || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Address Details Section */}
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
                Location & Address
              </Text>

              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MapPin size={16} color={subTextColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Address</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                      {activeProfile.address || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Building size={16} color={subTextColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: subTextColor }}>City / State</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                      {activeProfile.city || activeProfile.state
                        ? `${activeProfile.city || ''}, ${activeProfile.state || ''}`.replace(/^,\s*|,\s*$/g, '')
                        : 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Globe size={16} color={subTextColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Country / Postal Code</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                      {activeProfile.country || activeProfile.postalCode
                        ? `${activeProfile.country || ''} ${activeProfile.postalCode ? `(${activeProfile.postalCode})` : ''}`
                        : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Change Password Action Button */}
            <TouchableOpacity
              onPress={() => setIsPasswordModalOpen(true)}
              style={{
                backgroundColor: cardBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Lock size={18} color="#8b5cf6" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                  Change Password
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#8b5cf6', fontWeight: '600' }}>Update</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* CHANGE PASSWORD MODAL */}
      <Modal visible={isPasswordModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 20,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Change Password</Text>
                <TouchableOpacity onPress={() => setIsPasswordModalOpen(false)}>
                  <X size={20} color={subTextColor} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 12 }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Current Password *
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
                    secureTextEntry
                    placeholder="Enter current password"
                    placeholderTextColor={subTextColor}
                    value={passForm.currentPassword}
                    onChangeText={(val) => setPassForm({ ...passForm, currentPassword: val })}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    New Password *
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
                    secureTextEntry
                    placeholder="Enter new password"
                    placeholderTextColor={subTextColor}
                    value={passForm.newPassword}
                    onChangeText={(val) => setPassForm({ ...passForm, newPassword: val })}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Confirm New Password *
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
                    secureTextEntry
                    placeholder="Confirm new password"
                    placeholderTextColor={subTextColor}
                    value={passForm.confirmPassword}
                    onChangeText={(val) => setPassForm({ ...passForm, confirmPassword: val })}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity
                  onPress={() => setIsPasswordModalOpen(false)}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: subTextColor, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={changePassLoading}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 8,
                    backgroundColor: '#8b5cf6',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {changePassLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>

  );
}
