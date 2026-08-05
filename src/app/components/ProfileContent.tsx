import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import {
  User,
  Mail,
  Settings,
  Key,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building2,
} from 'lucide-react-native';
import { getAdminTheme } from '@/theme/adminTheme';
import AppFooter from '../../auth/components/AppFooter';

export default function ProfileContent() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { isDark } = useTheme();

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/main-login');
  }, [logout, router]);

  const handleChangePassword = useCallback(() => {
    router.push('/change-password');
  }, [router]);

  const adminTheme = getAdminTheme(isDark);
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const getInitials = useCallback((name: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, []);

  const adminLinks = useMemo(
    () => [
      {
        title: 'My Profile Details',
        icon: User,
        desc: 'View & update personal profile information',
        route: '/admin/settings/profile/Profile',
        color: '#10b981',
      },
      {
        title: 'System Settings',
        icon: Settings,
        desc: 'Workspace preferences & configurations',
        route: '/admin/settings/systemsettings/setting',
        color: '#3b82f6',
      },
      {
        title: 'Email Configuration',
        icon: Mail,
        desc: 'SMTP server & mail notifications setup',
        route: '/admin/settings/emailconfig/EmailConfig',
        color: '#f59e0b',
      },
    ],
    []
  );

  const cardShadow = useMemo(
    () =>
      Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.2 : 0.04,
          shadowRadius: 10,
        },
        android: { elevation: isDark ? 3 : 1 },
      }),
    [isDark]
  );

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, flexGrow: 1, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Simple Admin Hero Header */}
        <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: borderCol, ...cardShadow }]}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.08)',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                },
              ]}
            >
              <Text style={[styles.avatarText, { color: '#10b981' }]}>
                {getInitials(user?.username || 'Admin')}
              </Text>
            </View>
            <View style={[styles.verifiedBadge, { borderColor: cardBg }]}>
              <ShieldCheck size={11} color="#ffffff" />
            </View>
          </View>

          <Text style={[styles.userName, { color: textColor }]}>
            {user?.username || 'Administrator'}
          </Text>
          <Text style={[styles.userEmail, { color: subTextColor }]}>
            {user?.email || 'admin@crm.com'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.15)',
                },
              ]}
            >
              <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {user?.role || 'Admin'}
              </Text>
            </View>
            {(user as any)?.tenantId && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                    borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  },
                ]}
              >
                <Building2 size={10} color="#3b82f6" />
                <Text style={{ color: '#3b82f6', fontSize: 10, fontWeight: '600' }}>
                  Workspace #{(user as any).tenantId}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Workspace Settings Section */}
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol, ...cardShadow }]}>
          <Text style={[styles.sectionTitle, { color: textColor, borderBottomColor: borderCol }]}>
            Workspace Settings
          </Text>

          <View style={{ flexDirection: 'column' }}>
            {adminLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => router.push(link.route as any)}
                  style={[
                    styles.linkRow,
                    {
                      borderBottomColor: borderCol,
                      borderBottomWidth: idx === adminLinks.length - 1 ? 0 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: isDark ? `${link.color}15` : `${link.color}08` }]}>
                    <Icon size={17} color={link.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.linkLabel, { color: textColor }]}>{link.title}</Text>
                    <Text style={[styles.linkSub, { color: subTextColor }]}>{link.desc}</Text>
                  </View>
                  <ChevronRight size={15} color={subTextColor} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Account Security & Actions */}
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol, ...cardShadow }]}>
          <Text style={[styles.sectionTitle, { color: textColor, borderBottomColor: borderCol }]}>
            Account Actions
          </Text>

          <View style={{ gap: 10, marginTop: 6 }}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: cardBg, borderColor: borderCol }]}
              onPress={handleChangePassword}
              activeOpacity={0.7}
            >
              <Key size={15} color={textColor} style={{ marginRight: 8 }} />
              <Text style={[styles.actionBtnText, { color: textColor }]}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.logoutBtn,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fca5a5',
                },
              ]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogOut size={15} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AppFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10b981',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    borderBottomWidth: 1,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  linkSub: {
    fontSize: 11,
    marginTop: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
