import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../auth/store/authStore';
// No safe area context imports needed here since it's handled globally in layout
import {
  ChevronRight,
  Settings,
  CreditCard,


  Mail,
  Landmark,
  ArrowUpCircle,
} from 'lucide-react-native';
import { getAdminTheme } from '../../theme/adminTheme';
// import AppFooter from '../../auth/components/AppFooter';
import { useUpdateStore } from '../../hooks/useUpdateStore';

export default function AdminSettingsContent() {
  const { isDark } = useTheme();
  const router = useRouter();
  const isImpersonating = useAuthStore((state) => state.isImpersonating);
  const stopImpersonation = useAuthStore((state) => state.stopImpersonation);
  const adminTheme = getAdminTheme(isDark);
  const isUpdateAvailable = useUpdateStore((state) => state.isUpdateAvailable);

  const handleUpdateApp = useCallback(() => {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/idYOUR_APP_ID'
      : 'https://play.google.com/store/apps/details?id=com.ultrakey.crm';
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open play store URL:', err);
    });
  }, []);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;


  const handleStopImpersonation = useCallback(async () => {
    await stopImpersonation();
    router.replace('/admin/dashboard');
  }, [stopImpersonation, router]);

  const menuSections = useMemo(
    () => [
      {
        title: 'Settings',
        items: [
          { title: 'Company Information', icon: Settings, desc: 'General app settings and configurations', route: '/admin/settings/systemsettings/setting', color: '#3b82f6' },
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
    <ScrollView style={{ flex: 1, backgroundColor: bgColor }} contentContainerStyle={{ padding: 16, paddingBottom: 160, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      {isUpdateAvailable && (
        <TouchableOpacity
          onPress={handleUpdateApp}
          style={{
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
          activeOpacity={0.7}
        >
          <View style={{
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            padding: 10,
            borderRadius: 10,
          }}>
            <ArrowUpCircle size={22} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#10b981' }}>Update Available!</Text>
            <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>A new version of the app is available. Click here to update via Google Play Store.</Text>
          </View>
          <ChevronRight size={18} color="#10b981" />
        </TouchableOpacity>
      )}

      {menuSections.map((sec, idx) => (
        <View key={idx} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12, textAlign: 'center' }}>
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


      {/* Footer */}
      {/* <AppFooter /> */}
    </ScrollView>
  );
}
