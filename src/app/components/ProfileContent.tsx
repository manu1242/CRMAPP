import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Image,
  LayoutAnimation,
  UIManager,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Key,
  LogOut,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Smartphone,
  Edit2,
  Bell,
  MoreVertical,
  Shield,
  Palette,
  FileText,
  HelpCircle,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react-native';
import { getAdminTheme } from '../../theme/adminTheme';
import { profileService, UserProfileData, AccountDetailsData } from '../../admin/services/profileService';
import { useBrandingQuery } from '../../admin/hooks/useBranding';
import { BrandingService } from '../../admin/services/BrandingService';
import AppFooter from '../../auth/components/AppFooter';
import { NotificationService } from '../../Services/NotificationService';
import { EXTERNAL_LINKS, openExternalLink } from '../../config/externalLinks';

export default function ProfileContent() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);
  const isImpersonating = useAuthStore((state) => state.isImpersonating);
  const { isDark, preference, setPreference } = useTheme();
  const insets = useSafeAreaInsets();

  const adminTheme = getAdminTheme(isDark);
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const { data: branding } = useBrandingQuery();
  const brandingLogoUrl = BrandingService.resolveLogoUri(branding?.companyLogo || branding?.logoPath);

  const [activeTab, setActiveTab] = useState<'info' | 'settings'>('info');
  const [appearanceExpanded, setAppearanceExpanded] = useState(true);
  const [accountExpanded, setAccountExpanded] = useState(false);
  const [legalExpanded, setLegalExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await NotificationService.getNotifications();
      setUnreadCount(res.count || 0);
    } catch (err) {
      console.error('Failed to get unread count:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

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

  const {
    data: profileData,
    isLoading: queryLoading,
    isRefetching: refreshing,
    refetch: refectObject,
  } = useQuery({
    queryKey: ['adminProfile'],
    queryFn: async () => {
      const res = await profileService.getProfile();
      if (res && res.success && res.data) {
        return res.data;
      }
      throw new Error('Profile fetch failed');
    },
    retry: 1,
  });

  const loading = queryLoading && !profileData;

  const onRefresh = useCallback(async () => {
    await refectObject();
    await fetchUnreadCount();
  }, [refectObject, fetchUnreadCount]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/main-login');
  }, [logout, router]);

  const handleChangePassword = useCallback(() => {
    router.push('/change-password');
  }, [router]);

  // Request Account Details State & Handlers
  const [accountDetailsModalVisible, setAccountDetailsModalVisible] = useState(false);
  const [accountDetailsLoading, setAccountDetailsLoading] = useState(false);
  const [accountDetailsData, setAccountDetailsData] = useState<AccountDetailsData | null>(null);

  const handleRequestAccountDetails = useCallback(async () => {
    setAccountDetailsLoading(true);
    setAccountDetailsModalVisible(true);
    try {
      const res = await profileService.getAccountDetails();
      if (res && res.success && res.data) {
        setAccountDetailsData(res.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to Retrieve Details',
          text2: res?.message || 'Could not fetch account details at this time.',
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error fetching account details';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: msg,
      });
    } finally {
      setAccountDetailsLoading(false);
    }
  }, []);

  // Delete Account State & Handlers
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleOpenDeleteModal = useCallback(() => {
    setDeletePassword('');
    setShowDeletePassword(false);
    setDeleteReason('');
    setDeleteConfirmed(false);
    setDeleteError(null);
    setDeleteAccountModalVisible(true);
  }, []);

  const handleConfirmDeleteAccount = useCallback(async () => {
    if (!deleteConfirmed) {
      setDeleteError('Please check the confirmation box to proceed.');
      return;
    }
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await profileService.deleteAccount({
        password: deletePassword.trim() || undefined,
        reason: deleteReason.trim() || undefined,
        confirm: true,
      });

      if (res && res.success) {
        setDeleteAccountModalVisible(false);
        Toast.show({
          type: 'success',
          text1: 'Account Deleted',
          text2: 'Account delete requested. Our team will contact you within 30 min to 1 hr to help you get back your account. Thank you.',
          visibilityTime: 6000,
        });
        await logout();
        router.replace('/main-login');
      } else {
        setDeleteError(res?.message || 'Failed to delete account.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete account.';
      setDeleteError(msg);
      Toast.show({
        type: 'error',
        text1: 'Deletion Failed',
        text2: msg,
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }, [deleteConfirmed, deletePassword, deleteReason, logout, router]);

  const activeProfile: UserProfileData = profileData || getFallbackProfile();

  const fullAddressStr = useMemo(() => {
    const parts = [
      activeProfile.address,
      activeProfile.city,
      activeProfile.state,
      activeProfile.country,
      activeProfile.postalCode
    ].map(s => s?.trim()).filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  }, [activeProfile]);

  // Admin theme accent colors
  const brandColor = adminTheme.brand;
  const brandDark = adminTheme.brandHover;
  const headerBg = isDark ? adminTheme.sidebarBg : brandColor;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? bgColor : '#ffffff' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[brandColor]}
            tintColor={isDark ? '#ffffff' : brandColor}
          />
        }
      >
        {/* ── Green Header Block ── */}
        <LinearGradient
          colors={isDark ? ['#000000', '#064e3b'] : ['#34d399', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 12,
            paddingBottom: 120,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#ffffff', letterSpacing: -0.3 }}>
              My Profile
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => router.push('/admin/settings/profile/editProfile')}
                activeOpacity={0.8}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Edit2 size={17} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/admin/AdminNotification')}
                activeOpacity={0.8}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <Bell size={17} color="#ffffff" />
                {unreadCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#ef4444',
                    }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* ── White Card Overlapping Header ── */}
        <View
          style={{
            flex: 1,
            backgroundColor: isDark ? adminTheme.primaryBg : '#ffffff',
            borderTopLeftRadius: 35,
            borderTopRightRadius: 35,
            marginTop: -28,
            paddingHorizontal: 24,
            paddingTop: 0,
            gap: 24,
          }}
        >
          {/* Profile Avatar + Name — avatar overlaps the boundary */}
          <View style={{ alignItems: 'center', marginTop: -44 }}>
            {/* Avatar */}
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 26,
                backgroundColor: isDark ? adminTheme.cardBg : '#ffffff',
                borderColor: isDark ? adminTheme.primaryBg : '#ffffff',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {activeProfile.avatarUrl || brandingLogoUrl ? (
                <ExpoImage
                  source={{ uri: (activeProfile.avatarUrl || brandingLogoUrl) ?? undefined }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <ExpoImage
                  source={require('../../../assets/images/proimage.png')}
                  style={{ width: '100%', height: '100%', position: 'absolute' }}
                  contentFit="contain"
                />
              )}
            </View>

            {/* Name + Role centered below avatar */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: textColor,
                marginTop: 12,
                letterSpacing: -0.3,
                textAlign: 'center',
              }}
            >
              {activeProfile.firstName || activeProfile.lastName
                ? `${activeProfile.firstName || ''} ${activeProfile.lastName || ''}`.trim()
                : activeProfile.username}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: subTextColor,
                marginTop: 4,
                fontWeight: '500',
              }}
            >
              {activeProfile.role || 'User'}
            </Text>
          </View>

          {/* Segmented control Buttons (Achievements / Notes style) */}
          {/* Segmented Tabs */}
          <View
            style={{
              flexDirection: 'row',
              gap: 0,
              backgroundColor: isDark ? adminTheme.inputBg : '#f1f5f9',
              borderRadius: 14,
              padding: 3,
            }}
          >
            {(['info', 'settings'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === 'info' ? 'Personal Info' : 'Preferences';
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 11,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: isActive
                      ? (isDark ? adminTheme.cardBg : '#ffffff')
                      : 'transparent',
                    ...(isActive ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 3,
                      elevation: 1,
                    } : {}),
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? textColor : subTextColor,
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dynamic Tab Switching Details */}
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={brandColor} />
              <Text style={{ marginTop: 10, color: subTextColor, fontSize: 13 }}>
                Loading profile...
              </Text>
            </View>
          ) : activeTab === 'info' ? (
            /* INFO TAB */
            <View style={{ gap: 20 }}>
              {/* Contact Details */}
              <View>
                <Text style={{ fontSize: 15, fontWeight: '600', color: textColor, marginBottom: 12 }}>
                  Contact Details
                </Text>

                {/* Email */}
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Mail size={16} color={isDark ? adminTheme.accent : brandColor} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      Email
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: textColor, marginTop: 2 }}>
                      {activeProfile.email}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: isDark ? borderCol : '#f0f0f0', marginLeft: 48 }} />

                {/* Phone */}
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#eef2ff',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Phone size={16} color={isDark ? '#818CF8' : '#6366F1'} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      Phone
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: textColor, marginTop: 2 }}>
                      {activeProfile.phone || 'Not provided'}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: isDark ? borderCol : '#f0f0f0', marginLeft: 48 }} />

                {/* Address */}
                <View
                  style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 2,
                    }}
                  >
                    <MapPin size={16} color={isDark ? '#FBBF24' : '#D97706'} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      Address
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: textColor, marginTop: 2, lineHeight: 20 }}>
                      {fullAddressStr}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: isDark ? borderCol : '#f0f0f0', marginLeft: 48 }} />

                {/* Organization */}
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isDark ? 'rgba(236, 72, 153, 0.1)' : '#fdf2f8',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Building size={16} color={isDark ? '#F472B6' : '#DB2777'} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      Organization
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: textColor, marginTop: 2 }}>
                      ID #{(authUser as any)?.tenantId || 1}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            /* PREFERENCES & SETTINGS TAB */
            <View style={{ gap: 16 }}>

              {/* ── Appearance Theme Accordion ── */}
              <View>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    const nextVal = !appearanceExpanded;
                    setAppearanceExpanded(nextVal);
                    if (nextVal) {
                      setAccountExpanded(false);
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 4,
                  }}
                >
                  <Palette size={18} color={isDark ? adminTheme.accent : brandColor} />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: '600',
                      color: textColor,
                      marginLeft: 10,
                      letterSpacing: -0.2,
                    }}
                  >
                    Appearance Theme
                  </Text>
                  <View style={{ transform: [{ rotate: appearanceExpanded ? '180deg' : '0deg' }] }}>
                    <ChevronDown size={18} color={subTextColor} />
                  </View>
                </TouchableOpacity>

                {appearanceExpanded && (
                  <View style={{ gap: 10, paddingTop: 4, paddingBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: subTextColor, paddingHorizontal: 4, marginBottom: 4 }}>
                      Choose your preferred display mode
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['system', 'light', 'dark'] as const).map((pref) => {
                        const isActive = preference === pref;
                        const Icon = pref === 'system' ? Smartphone : pref === 'light' ? Sun : Moon;
                        const label = pref === 'system' ? 'System' : pref === 'light' ? 'Light' : 'Dark';
                        const activeColor = brandColor;

                        return (
                          <TouchableOpacity
                            key={pref}
                            onPress={() => setPreference(pref)}
                            accessibilityRole="button"
                            accessibilityLabel={`Set theme to ${label}`}
                            activeOpacity={0.7}
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              height: 44,
                              borderRadius: 14,
                              backgroundColor: isActive
                                ? (isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.06)')
                                : 'transparent',
                              borderWidth: 1,
                              borderColor: isActive
                                ? (isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.25)')
                                : (isDark ? borderCol : '#e5e7eb'),
                            }}
                          >
                            <Icon size={14} color={isActive ? activeColor : subTextColor} />
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: isActive ? '600' : '400',
                                color: isActive ? (isDark ? adminTheme.accent : brandColor) : subTextColor,
                              }}
                            >
                              {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Hairline separator */}
                <View style={{ height: 1, backgroundColor: isDark ? borderCol : '#f0f0f0', marginTop: 8 }} />
              </View>

              {/* ── Account Settings Accordion ── */}
              <View>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    const nextVal = !accountExpanded;
                    setAccountExpanded(nextVal);
                    if (nextVal) {
                      setAppearanceExpanded(false);
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 4,
                  }}
                >
                  <Shield size={18} color={isDark ? '#A78BFA' : '#8B5CF6'} />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: '600',
                      color: textColor,
                      marginLeft: 10,
                      letterSpacing: -0.2,
                    }}
                  >
                    Account Settings
                  </Text>
                  <View style={{ transform: [{ rotate: accountExpanded ? '180deg' : '0deg' }] }}>
                    <ChevronDown size={18} color={subTextColor} />
                  </View>
                </TouchableOpacity>

                {accountExpanded && (
                  <View style={{ gap: 2, paddingTop: 4 }}>
                    {/* Change Password */}
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={handleChangePassword}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 13,
                        paddingHorizontal: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : '#F5F3FF',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Key size={16} color={isDark ? '#A78BFA' : '#8B5CF6'} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: textColor }}>
                          Change Password
                        </Text>
                        <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                          Update your login credentials
                        </Text>
                      </View>
                      <ChevronRight size={16} color={subTextColor} />
                    </TouchableOpacity>

                    {/* Thin divider between items */}
                    <View style={{ height: 1, backgroundColor: isDark ? borderCol : '#f0f0f0', marginLeft: 52 }} />

                    {/* Request Account Details (GDPR / Data Transparency) */}
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={handleRequestAccountDetails}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 13,
                        paddingHorizontal: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <FileText size={16} color="#10B981" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: textColor }}>
                          Request Account Details
                        </Text>
                        <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                          Inspect stored personal & activity records (GDPR)
                        </Text>
                      </View>
                      <ChevronRight size={16} color={subTextColor} />
                    </TouchableOpacity>

                    {/* Thin divider between items */}
                    <View style={{ height: 1, backgroundColor: isDark ? borderCol : '#f0f0f0', marginLeft: 52 }} />

                    {/* Log Out */}
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={handleLogout}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 13,
                        paddingHorizontal: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <LogOut size={16} color="#EF4444" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#EF4444' }}>
                          Log Out
                        </Text>
                        <Text style={{ fontSize: 11, color: isDark ? 'rgba(239, 68, 68, 0.6)' : '#DC2626', marginTop: 2 }}>
                          Sign out from this device
                        </Text>
                      </View>
                      <ChevronRight size={16} color={isDark ? 'rgba(239, 68, 68, 0.5)' : '#EF4444'} />
                    </TouchableOpacity>

                    {/* Thin divider between items */}
                    <View style={{ height: 1, backgroundColor: isDark ? borderCol : '#f0f0f0', marginLeft: 52 }} />

                    {/* Delete Account (Apple App Store & Google Play compliance) */}
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={handleOpenDeleteModal}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 13,
                        paddingHorizontal: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#DC2626' }}>
                          Delete Account
                        </Text>
                        <Text style={{ fontSize: 11, color: isDark ? '#FCA5A5' : '#B91C1C', marginTop: 2 }}>
                          Permanently deactivate profile and delete data
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Hairline separator */}
                <View style={{ height: 1, backgroundColor: isDark ? borderCol : '#f0f0f0', marginTop: 8 }} />
              </View>

              {/* ── Legal & Support Accordion ── */}
              <View>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    const nextVal = !legalExpanded;
                    setLegalExpanded(nextVal);
                    if (nextVal) {
                      setAppearanceExpanded(false);
                      setAccountExpanded(false);
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 4,
                  }}
                >
                  <HelpCircle size={18} color={isDark ? '#38BDF8' : '#0284C7'} />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: '600',
                      color: textColor,
                      marginLeft: 10,
                      letterSpacing: -0.2,
                    }}
                  >
                    Legal & Support
                  </Text>
                  <View style={{ transform: [{ rotate: legalExpanded ? '180deg' : '0deg' }] }}>
                    <ChevronDown size={18} color={subTextColor} />
                  </View>
                </TouchableOpacity>

                {legalExpanded && (
                  <View style={{ gap: 2, paddingTop: 4 }}>
                    {/* Privacy Policy */}
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => openExternalLink(EXTERNAL_LINKS.PRIVACY_POLICY)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 13,
                        paddingHorizontal: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Shield size={16} color="#10B981" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: textColor }}>
                          Privacy Policy
                        </Text>
                        <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                          View how your personal information is protected
                        </Text>
                      </View>
                      <ChevronRight size={16} color={subTextColor} />
                    </TouchableOpacity>

                    <View style={{ height: 1, backgroundColor: isDark ? borderCol : '#f0f0f0', marginLeft: 52 }} />

                    {/* Terms & Conditions */}
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => openExternalLink(EXTERNAL_LINKS.TERMS_AND_CONDITIONS)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 13,
                        paddingHorizontal: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isDark ? 'rgba(6, 182, 212, 0.1)' : '#ECFEFF',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <FileText size={16} color="#06B6D4" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: textColor }}>
                          Terms & Conditions
                        </Text>
                        <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                          Read terms of service and agreement
                        </Text>
                      </View>
                      <ChevronRight size={16} color={subTextColor} />
                    </TouchableOpacity>

                    <View style={{ height: 1, backgroundColor: isDark ? borderCol : '#f0f0f0', marginLeft: 52 }} />

                    {/* Contact & Support */}
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => openExternalLink(EXTERNAL_LINKS.CONTACT_US)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 13,
                        paddingHorizontal: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <HelpCircle size={16} color="#F59E0B" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: textColor }}>
                          Contact & Support
                        </Text>
                        <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                          Reach out for inquiries, questions, and support
                        </Text>
                      </View>
                      <ChevronRight size={16} color={subTextColor} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Impersonation chip footer notification */}
          {isImpersonating && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: isDark ? 'rgba(234, 179, 8, 0.15)' : '#FEF3C7',
                borderWidth: 1,
                borderColor: isDark ? '#CA8A04' : '#F59E0B',
                borderRadius: 20,
                padding: 14,
                marginTop: 4,
              }}
            >
              <Text style={{ fontSize: 18 }}>🕵️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: isDark ? '#FDE047' : '#D97706', fontWeight: '700', fontSize: 13 }}>
                  Impersonation active
                </Text>
                <Text style={{ color: isDark ? '#EAB308' : '#B45309', fontSize: 11, marginTop: 2 }}>
                  Viewing user context under a safe UPropTech impersonation session.
                </Text>
              </View>
            </View>
          )}

          <AppFooter />
        </View>
      </ScrollView>

      {/* ── Delete Account Compliance Modal ── */}
      <Modal
        visible={deleteAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeletingAccount) setDeleteAccountModalVisible(false);
        }}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: cardBg,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 8,
          }}>
            {/* Modal Header */}
            <View style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
              paddingVertical: 16,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
            }}>
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FEE2E2',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                <Trash2 size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FCA5A5' : '#DC2626' }}>
                  Delete Account
                </Text>
            
              </View>
              <TouchableOpacity
                disabled={isDeletingAccount}
                onPress={() => setDeleteAccountModalVisible(false)}
                style={{ padding: 4 }}
              >
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={{ padding: 18, maxHeight: 380 }} showsVerticalScrollIndicator={false}>


              {/* Password Confirmation */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: textColor, marginBottom: 6 }}>
                Confirm Password
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: borderCol,
                borderRadius: 8,
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                paddingHorizontal: 12,
                height: 44,
                marginBottom: 14,
              }}>
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: textColor }}
                  placeholder="Enter your current password"
                  placeholderTextColor={subTextColor}
                  secureTextEntry={!showDeletePassword}
                  value={deletePassword}
                  onChangeText={(text) => {
                    setDeletePassword(text);
                    if (deleteError) setDeleteError(null);
                  }}
                  editable={!isDeletingAccount}
                />
                <TouchableOpacity onPress={() => setShowDeletePassword(!showDeletePassword)} style={{ padding: 4 }}>
                  {showDeletePassword ? <EyeOff size={16} color={subTextColor} /> : <Eye size={16} color={subTextColor} />}
                </TouchableOpacity>
              </View>

              {/* Reason for deletion */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: textColor, marginBottom: 6 }}>
                Reason for deletion <Text style={{ color: subTextColor, fontWeight: '400' }}>(Optional)</Text>
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: borderCol,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                  color: textColor,
                  marginBottom: 16,
                  minHeight: 52,
                  textAlignVertical: 'top',
                }}
                placeholder="e.g. I am no longer using this account"
                placeholderTextColor={subTextColor}
                multiline
                numberOfLines={2}
                value={deleteReason}
                onChangeText={setDeleteReason}
                editable={!isDeletingAccount}
              />

              {/* Confirmation Checkbox */}
              <TouchableOpacity
                onPress={() => {
                  setDeleteConfirmed(!deleteConfirmed);
                  if (deleteError) setDeleteError(null);
                }}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: deleteConfirmed ? '#EF4444' : borderCol,
                  backgroundColor: deleteConfirmed ? '#EF4444' : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                  marginTop: 2,
                }}>
                  {deleteConfirmed && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={{ flex: 1, fontSize: 12.5, color: textColor, lineHeight: 18 }}>
                  I confirm that I want to delete my account and understand that this action cannot be undone.
                </Text>
              </TouchableOpacity>

              {/* Error Alert */}
              {deleteError ? (
                <View style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECACA',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <ShieldAlert size={16} color="#EF4444" style={{ marginRight: 8 }} />
                  <Text style={{ flex: 1, fontSize: 12, color: isDark ? '#FCA5A5' : '#B91C1C' }}>
                    {deleteError}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Modal Actions */}
            <View style={{
              flexDirection: 'row',
              padding: 14,
              borderTopWidth: 1,
              borderTopColor: borderCol,
              gap: 10,
            }}>
              <TouchableOpacity
                disabled={isDeletingAccount}
                onPress={() => setDeleteAccountModalVisible(false)}
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
                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!deleteConfirmed || isDeletingAccount}
                onPress={handleConfirmDeleteAccount}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  backgroundColor: deleteConfirmed && !isDeletingAccount ? '#EF4444' : (isDark ? '#374151' : '#9CA3AF'),
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                {isDeletingAccount ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Deleting...</Text>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} color="#FFFFFF" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Delete Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Request Account Details (GDPR) Modal ── */}
      <Modal
        visible={accountDetailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAccountDetailsModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.65)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            width: '100%',
            maxHeight: '88%',
            backgroundColor: cardBg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <View style={{
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: borderCol,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <FileText size={18} color="#10B981" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
                    Account Details Export
                  </Text>
                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    GDPR & Data Transparency
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setAccountDetailsModalVisible(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <X size={16} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {accountDetailsLoading ? (
              <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={{ marginTop: 14, fontSize: 13, color: subTextColor, fontWeight: '500' }}>
                  Retrieving personal & account records...
                </Text>
              </View>
            ) : accountDetailsData ? (
              <ScrollView style={{ padding: 18 }} showsVerticalScrollIndicator={false}>
                {/* Meta Header */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: borderCol,
                  marginBottom: 16,
                }}>
                  <View>
                    <Text style={{ fontSize: 11, color: subTextColor }}>Request ID</Text>
                    <Text style={{ fontSize: 12.5, fontWeight: '600', color: textColor, marginTop: 2 }}>
                      {accountDetailsData.requestId || 'REQ-ACTIVE'}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>
                      {accountDetailsData.exportStatus || 'Available'}
                    </Text>
                  </View>
                </View>

                {/* Section: Account Information */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: textColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Account Identifiers & Role
                </Text>
                <View style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  padding: 12,
                  marginBottom: 14,
                }}>
                  <DataRow label="User ID" value={String(accountDetailsData.account?.userId || activeProfile.userId)} textColor={textColor} subTextColor={subTextColor} />
                  <DataRow label="Username" value={accountDetailsData.account?.username || activeProfile.username} textColor={textColor} subTextColor={subTextColor} />
                  <DataRow label="Email" value={accountDetailsData.account?.email || activeProfile.email} textColor={textColor} subTextColor={subTextColor} />
                  <DataRow label="Phone" value={accountDetailsData.account?.phone || activeProfile.phone || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <DataRow label="Role" value={accountDetailsData.account?.role || activeProfile.role} textColor={textColor} subTextColor={subTextColor} />
                  <DataRow label="Status" value={accountDetailsData.account?.isActive ? 'Active' : 'Deactivated'} textColor={accountDetailsData.account?.isActive ? '#10B981' : '#EF4444'} subTextColor={subTextColor} />
                  {accountDetailsData.account?.createdDate ? (
                    <DataRow label="Created Date" value={new Date(accountDetailsData.account.createdDate).toLocaleDateString()} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                  {accountDetailsData.account?.lastActivity ? (
                    <DataRow label="Last Activity" value={new Date(accountDetailsData.account.lastActivity).toLocaleString()} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                </View>

                {/* Section: Profile */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: textColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Personal Profile & Address
                </Text>
                <View style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  padding: 12,
                  marginBottom: 14,
                }}>
                  <DataRow label="Name" value={`${accountDetailsData.profile?.firstName || ''} ${accountDetailsData.profile?.lastName || ''}`.trim() || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <DataRow label="Address" value={accountDetailsData.profile?.address || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <DataRow label="City / State" value={`${accountDetailsData.profile?.city || ''}${accountDetailsData.profile?.state ? ', ' + accountDetailsData.profile.state : ''}`.trim() || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <DataRow label="Postal Code" value={accountDetailsData.profile?.postalCode || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <DataRow label="Country" value={accountDetailsData.profile?.country || 'India'} textColor={textColor} subTextColor={subTextColor} />
                </View>

                {/* Section: Security & Activity */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: textColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Security & Activity Summary
                </Text>
                <View style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  padding: 12,
                  marginBottom: 14,
                }}>
                  <DataRow label="Push Notifications" value={accountDetailsData.security?.hasPushNotifications ? 'Enabled' : 'Disabled'} textColor={accountDetailsData.security?.hasPushNotifications ? '#10B981' : subTextColor} subTextColor={subTextColor} />
                  {accountDetailsData.security?.passwordLastChanged ? (
                    <DataRow label="Password Last Changed" value={new Date(accountDetailsData.security.passwordLastChanged).toLocaleDateString()} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                  {accountDetailsData.activitySummary?.assignedLeads !== undefined ? (
                    <DataRow label="Assigned Leads" value={String(accountDetailsData.activitySummary.assignedLeads)} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                  {accountDetailsData.activitySummary?.agentStatus ? (
                    <DataRow label="Agent Status" value={accountDetailsData.activitySummary.agentStatus} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                </View>

                {/* Privacy Notice */}
                {accountDetailsData.privacyNotice ? (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#F0F9FF',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#BAE6FD',
                    padding: 12,
                    marginBottom: 18,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#38BDF8' : '#0284C7', marginBottom: 4 }}>
                      Privacy & Data Transparency Notice
                    </Text>
                    <Text style={{ fontSize: 11, color: isDark ? '#BAE6FD' : '#0369A1', lineHeight: 16 }}>
                      {accountDetailsData.privacyNotice}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: subTextColor, fontSize: 13 }}>No records found.</Text>
              </View>
            )}

            {/* Modal Footer */}
            <View style={{
              padding: 14,
              borderTopWidth: 1,
              borderTopColor: borderCol,
            }}>
              <TouchableOpacity
                onPress={() => setAccountDetailsModalVisible(false)}
                style={{
                  height: 42,
                  borderRadius: 8,
                  backgroundColor: brandColor,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Close Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DataRow({
  label,
  value,
  textColor,
  subTextColor,
}: {
  label: string;
  value: string;
  textColor: string;
  subTextColor: string;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 }}>
      <Text style={{ fontSize: 12.5, color: subTextColor, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: '500', color: textColor, flex: 1.2, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
