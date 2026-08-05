import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../auth/store/authStore';
import {
  ChevronRight,
  Settings,
  CreditCard,
  LogOut,
  User,
  Mail,
  Landmark,
} from 'lucide-react-native';
import { getAdminTheme } from '@/theme/adminTheme';
import AppFooter from '../../auth/components/AppFooter';

export default function AdminSettingsContent() {
  const { isDark } = useTheme();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const isImpersonating = useAuthStore((state) => state.isImpersonating);
  const stopImpersonation = useAuthStore((state) => state.stopImpersonation);
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const handleLogout = useCallback(() => {
    logout();
    router.replace('/main-login');
  }, [logout, router]);

  const handleStopImpersonation = useCallback(async () => {
    await stopImpersonation();
    router.replace('/admin/dashboard');
  }, [stopImpersonation, router]);

  const menuSections = useMemo(
    () => [
      {
        title: 'System Settings',
        items: [
          { title: 'My Profile', icon: User, desc: 'View and update your profile details', route: '/admin/settings/profile/Profile', color: '#10b981' },
          { title: 'System Settings', icon: Settings, desc: 'General app settings and configurations', route: '/admin/settings/systemsettings/setting', color: '#3b82f6' },
          { title: 'Email Settings', icon: Mail, desc: 'Configure SMTP, mail server, and templates', route: '/admin/settings/emailconfig/EmailConfig', color: '#eab308' },
        ],
      },
      {
        title: 'Financial Settings',
        items: [
          { title: 'Payment Gateways', icon: CreditCard, desc: 'Manage Razorpay, Stripe, and other gateways', route: '/admin/paymentconfig', color: '#ec4899' },
          { title: 'Bank Accounts', icon: Landmark, desc: 'Organization bank details & payouts setup', route: '/admin/bankaccountconfig', color: '#8b5cf6' },
        ],
      },
    ],
    []
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bgColor }} contentContainerStyle={{ padding: 16, paddingBottom: 24, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      {menuSections.map((sec, idx) => (
        <View key={idx} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
            {sec.title}
          </Text>
          <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, overflow: 'hidden' }}>
            {sec.items.map((item, itemIdx) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={itemIdx}
                  onPress={() => router.push(item.route as any)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderBottomWidth: itemIdx === sec.items.length - 1 ? 0 : 1,
                    borderColor: borderCol,
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    backgroundColor: isDark ? `${item.color}15` : `${item.color}08`,
                    padding: 8,
                    borderRadius: 8,
                    marginRight: 16
                  }}>
                    <Icon size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{item.title}</Text>
                    <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>{item.desc}</Text>
                  </View>
                  <ChevronRight size={16} color={subTextColor} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* Stop Impersonating button */}
      {isImpersonating && (
        <TouchableOpacity
          onPress={handleStopImpersonation}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#eab30820',
            borderWidth: 1,
            borderColor: '#eab30840',
            borderRadius: 12,
            padding: 14,
            marginTop: 8,
            marginBottom: 8,
            gap: 8
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 16 }}>🕵️</Text>
          <Text style={{ color: isDark ? '#fef08a' : '#a16207', fontWeight: '600', fontSize: 14 }}>
            Stop Impersonating
          </Text>
        </TouchableOpacity>
      )}

      {/* Logout button */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? '#7f1d1d15' : '#fef2f2',
          borderWidth: 1,
          borderColor: isDark ? '#7f1d1d40' : '#fecaca',
          borderRadius: 12,
          padding: 14,
          marginTop: 8,
          gap: 8
        }}
        activeOpacity={0.7}
      >
        <LogOut size={16} color="#ef4444" />
        <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 14 }}>Log Out Workspace</Text>
      </TouchableOpacity>
      {/* Footer */}
      <AppFooter />
    </ScrollView>
  );
}
