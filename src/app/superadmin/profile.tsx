import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import AppFooter from '../../auth/components/AppFooter';
import {
  CreditCard,
  Receipt,
  Settings,
  School,
  MailCheck,
  Crown,
  Key,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Sparkles,
  Layers,
  Activity,
  ArrowRightLeft,
  Sun,
  Moon,
  Smartphone,
} from 'lucide-react-native';

export default function SuperAdminProfileScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { isDark, preference, setPreference } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.replace('/main-login');
  };

  // Superadmin theme palette
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#e2e8f0';
  const brandColor = '#2563eb';

  const getInitials = (name: string) => {
    if (!name) return 'SA';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const saasAdminLinks = [
    {
      title: 'Payment Gateway Configuration',
      icon: CreditCard,
      desc: 'Razorpay, Stripe & payment keys setup',
      route: '/superadmin/payment-config',
      color: '#2563eb',
    },
    {
      title: 'Subscription Plans & Tiers',
      icon: Layers,
      desc: 'Create and edit pricing tiers & features',
      route: '/superadmin/plans',
      color: '#8b5cf6',
    },
    {
      title: 'Client Tenants Directory',
      icon: School,
      desc: 'Manage all tenant accounts & subscriptions',
      route: '/superadmin/tenants-hub',
      color: '#06b6d4',
    },
    {
      title: 'Platform Transactions & Billing',
      icon: Receipt,
      desc: 'Monitor platform revenue & transaction logs',
      route: '/superadmin/transactions',
      color: '#10b981',
    },
    {
      title: 'Lead Inquiries Desk',
      icon: MailCheck,
      desc: 'Review incoming contact & demo inquiries',
      route: '/superadmin/inquiries',
      color: '#f59e0b',
    },
    {
      title: 'System & Metadata Settings',
      icon: Settings,
      desc: 'Global company info & platform metadata',
      route: '/superadmin/settings',
      color: '#ea580c',
    },
  ];

  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 14,
    },
    android: { elevation: isDark ? 4 : 1 },
  });

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 160, flexGrow: 1, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SUPERADMIN HERO HEADER CARD ──────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: borderCol, ...cardShadow }]}>
          {/* Top Banner Chip */}
          <View style={styles.topStatusBanner}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10b981' }} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#10b981', letterSpacing: 0.5 }}>
              PLATFORM OVERSEER • SYSTEM OPERATIONAL
            </Text>
          </View>

          {/* Avatar with Crown Badge */}
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: isDark ? 'rgba(37, 99, 235, 0.16)' : 'rgba(37, 99, 235, 0.08)',
                  borderColor: isDark ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.2)',
                },
              ]}
            >
              <Text style={[styles.avatarText, { color: brandColor }]}>
                {getInitials(user?.username || 'Super Admin')}
              </Text>
            </View>
            <View style={[styles.crownBadge, { borderColor: cardBg }]}>
              <Crown size={11} color="#ffffff" />
            </View>
          </View>

          {/* Profile Name & Email */}
          <Text style={[styles.userName, { color: textColor }]}>
            {user?.username || 'Super Administrator'}
          </Text>
          <Text style={[styles.userEmail, { color: subTextColor }]}>
            {user?.email || 'superadmin@crm.com'}
          </Text>

          {/* Role Pill */}
          <View style={styles.rolePill}>
            <Sparkles size={11} color="#2563eb" />
            <Text style={styles.rolePillText}>
              {user?.role?.toUpperCase() || 'SUPERADMIN'}
            </Text>
          </View>

          {/* Platform Metrics Micro Strip */}
          <View style={[styles.metricsStrip, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: borderCol }]}>
            <View style={styles.metricItem}>
              <Text style={{ fontSize: 9, color: subTextColor, fontWeight: '600' }}>ROLE</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: brandColor, marginTop: 2 }}>SUPERADMIN</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: borderCol }]} />
            <View style={styles.metricItem}>
              <Text style={{ fontSize: 9, color: subTextColor, fontWeight: '600' }}>STATUS</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#10b981', marginTop: 2 }}>ACTIVE</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: borderCol }]} />
            <View style={styles.metricItem}>
              <Text style={{ fontSize: 9, color: subTextColor, fontWeight: '600' }}>SECURITY</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#f59e0b', marginTop: 2 }}>ENFORCED</Text>
            </View>
          </View>
        </View>

        {/* ── SAAS PLATFORM ADMINISTRATION ──────────────────────────── */}
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol, ...cardShadow }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', padding: 6, borderRadius: 8 }}>
              <Sliders size={15} color="#2563eb" />
            </View>
            <Text style={[styles.sectionTitleText, { color: textColor }]}>
              SaaS Administration
            </Text>
          </View>

          <View style={{ flexDirection: 'column' }}>
            {saasAdminLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => router.push(link.route as any)}
                  style={[
                    styles.linkRow,
                    {
                      borderBottomColor: borderCol,
                      borderBottomWidth: idx === saasAdminLinks.length - 1 ? 0 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: isDark ? `${link.color}18` : `${link.color}09` }]}>
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

        {/* ── APPEARANCE & THEME SETTINGS ──────────────────────────── */}
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol, ...cardShadow }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', padding: 6, borderRadius: 8 }}>
              <Sun size={15} color="#2563eb" />
            </View>
            <Text style={[styles.sectionTitleText, { color: textColor }]}>
              Appearance & Theme
            </Text>
          </View>

          <Text style={{ fontSize: 11, color: subTextColor, marginBottom: 12 }}>
            Select how the CRM application looks on your device. Choose to match system display settings or force a specific mode.
          </Text>

          <View style={styles.themeSelectorRow}>
            {(['light', 'dark'] as const).map((pref) => {
              const isActive = preference === pref;
              const Icon = pref === 'light' ? Sun : pref === 'dark' ? Moon : Smartphone;
              const label = pref.charAt(0).toUpperCase() + pref.slice(1);

              return (
                <TouchableOpacity
                  key={pref}
                  onPress={() => setPreference(pref)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isActive
                        ? (isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.08)')
                        : cardBg,
                      borderColor: isActive ? brandColor : borderCol,
                    }
                  ]}
                  activeOpacity={0.7}
                >
                  <Icon size={16} color={isActive ? brandColor : subTextColor} />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: isActive ? textColor : subTextColor, fontWeight: isActive ? '700' : '500' }
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── GOVERNANCE & ACCOUNT ACTIONS ──────────────────────────── */}
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol, ...cardShadow }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: 6, borderRadius: 8 }}>
              <ShieldAlert size={15} color="#10b981" />
            </View>
            <Text style={[styles.sectionTitleText, { color: textColor }]}>
              Account Governance
            </Text>
          </View>

          <View style={{ gap: 10, marginTop: 4 }}>
            {/* Switch Workspace */}
            {/* <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: cardBg, borderColor: borderCol }]}
              onPress={() => router.push('/select-workspace')}
              activeOpacity={0.7}
            >
              <ArrowRightLeft size={15} color={brandColor} style={{ marginRight: 8 }} />
              <Text style={[styles.actionBtnText, { color: textColor }]}>Switch Workspace</Text>
            </TouchableOpacity> */}

            {/* Change Password */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: cardBg, borderColor: borderCol }]}
              onPress={() => router.push('/change-password')}
              activeOpacity={0.7}
            >
              <Key size={15} color={textColor} style={{ marginRight: 8 }} />
              <Text style={[styles.actionBtnText, { color: textColor }]}>Change Password</Text>
            </TouchableOpacity>

            {/* Log Out */}
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  topStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderColor: 'rgba(16, 185, 129, 0.22)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  crownBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563eb',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    borderColor: 'rgba(37, 99, 235, 0.22)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
  },
  rolePillText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 20,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitleText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
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
    height: 44,
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
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 12,
  },
});
