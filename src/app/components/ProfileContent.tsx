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
  Edit2,
  Bell,
  MoreVertical,
  Shield,
  Palette,
} from 'lucide-react-native';
import { getAdminTheme } from '../../theme/adminTheme';
import { profileService, UserProfileData } from '../../admin/services/profileService';
import AppFooter from '../../auth/components/AppFooter';
import { NotificationService } from '../../Services/NotificationService';

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

  const [activeTab, setActiveTab] = useState<'info' | 'settings'>('info');
  const [appearanceExpanded, setAppearanceExpanded] = useState(true);
  const [accountExpanded, setAccountExpanded] = useState(false);
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
              {activeProfile.avatarUrl ? (
                <ExpoImage
                  source={{ uri: activeProfile.avatarUrl }}
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
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {(['light', 'dark'] as const).map((pref) => {
                        const isActive = preference === pref;
                        const Icon = pref === 'light' ? Sun : Moon;
                        const label = pref === 'light' ? 'Light' : 'Dark';
                        const activeColor = brandColor;

                        return (
                          <TouchableOpacity
                            key={pref}
                            onPress={() => setPreference(pref)}
                            activeOpacity={0.7}
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              height: 46,
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
                            <Icon size={15} color={isActive ? activeColor : subTextColor} />
                            <Text
                              style={{
                                fontSize: 13,
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
    </View>
  );
}
