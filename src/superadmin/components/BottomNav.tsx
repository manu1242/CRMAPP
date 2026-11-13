import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  LayoutDashboard,
  School,
  MailCheck,
  CreditCard,
  User,
  CircleEllipsis,
  Bot,
  Globe,
  Bell,
  Building2,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../theme/adminTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '../../utils/haptics';

export type SuperAdminActiveTab =
  | 'dashboard'
  | 'tenants'
  | 'inquiries'
  | 'subscriptions'
  | 'profile'
  | 'more'
  | 'chatbot'
  | 'pending-properties';

interface BottomNavProps {
  active: SuperAdminActiveTab;
}

const TABS = ['dashboard', 'tenants', 'inquiries', 'subscriptions', 'more', 'profile'] as const;

const BottomNav = React.memo(({ active }: BottomNavProps) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const superTheme = getSuperAdminTheme(isDark);
  const insets = useSafeAreaInsets();

  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);

  const activeColor = superTheme.brand;
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)';

  const navigateToDashboard = useCallback(() => {
    triggerHaptic('selection');
    if (active === 'dashboard') return;
    router.navigate('/superadmin/dashboard');
  }, [router, active]);

  const navigateToTenants = useCallback(() => {
    triggerHaptic('selection');
    if (active === 'tenants') return;
    router.navigate('/superadmin/tenants-hub');
  }, [router, active]);

  const navigateToInquiries = useCallback(() => {
    triggerHaptic('selection');
    if (active === 'inquiries') return;
    router.navigate('/superadmin/inquiries');
  }, [router, active]);

  const navigateToSubscriptions = useCallback(() => {
    triggerHaptic('selection');
    if (active === 'subscriptions') return;
    router.navigate('/superadmin/subscriptions-hub');
  }, [router, active]);

  const navigateToProfile = useCallback(() => {
    triggerHaptic('selection');
    if (active === 'profile') return;
    router.navigate('/superadmin/profile' as any);
  }, [router, active]);

  const navigateToChatbot = useCallback(() => {
    triggerHaptic('selection');
    setIsMoreMenuVisible(false);
    if (active === 'chatbot') return;
    router.navigate('/superadmin/chatbot' as any);
  }, [router, active]);

  const navigateToPendingProperties = useCallback(() => {
    triggerHaptic('selection');
    setIsMoreMenuVisible(false);
    if (active === 'pending-properties') return;
    router.navigate('/superadmin/pending-properties' as any);
  }, [router, active]);

  const navigateToPublicLeads = useCallback(() => {
    triggerHaptic('selection');
    setIsMoreMenuVisible(false);
    if (active === 'inquiries') return;
    router.navigate('/superadmin/public-leads' as any);
  }, [router, active]);

  const navigateToNotifications = useCallback(() => {
    triggerHaptic('selection');
    setIsMoreMenuVisible(false);
    router.navigate('/superadmin/notifications' as any);
  }, [router]);

  const isMoreActive =
    active === 'more' || active === 'chatbot' || active === 'pending-properties';

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: superTheme.cardBg,
        borderColor: superTheme.border,
        shadowOpacity: isDark ? 0.35 : 0.06,
        bottom: Platform.select({ ios: 8, android: 14, default: 12 }),
      },
    ],
    [isDark, superTheme.cardBg, superTheme.border]
  );

  return (
    <>
      <View style={containerStyle}>
        <View style={{ flex: 1, borderRadius: 32, overflow: 'hidden' }}>
          <View style={styles.content}>
            {/* 1. Dashboard */}
            <TouchableOpacity onPress={navigateToDashboard} style={styles.tabButton} activeOpacity={0.8}>
              <LayoutDashboard size={21} color={active === 'dashboard' ? activeColor : inactiveColor} />
              <View
                style={[
                  styles.tabIndicator,
                  { backgroundColor: active === 'dashboard' ? activeColor : 'transparent' },
                ]}
              />
            </TouchableOpacity>

            {/* 2. Tenants */}
            <TouchableOpacity onPress={navigateToTenants} style={styles.tabButton} activeOpacity={0.8}>
              <School size={21} color={active === 'tenants' ? activeColor : inactiveColor} />
              <View
                style={[
                  styles.tabIndicator,
                  { backgroundColor: active === 'tenants' ? activeColor : 'transparent' },
                ]}
              />
            </TouchableOpacity>

            {/* 3. Inquiries */}
            <TouchableOpacity onPress={navigateToInquiries} style={styles.tabButton} activeOpacity={0.8}>
              <MailCheck size={21} color={active === 'inquiries' ? activeColor : inactiveColor} />
              <View
                style={[
                  styles.tabIndicator,
                  { backgroundColor: active === 'inquiries' ? activeColor : 'transparent' },
                ]}
              />
            </TouchableOpacity>

            {/* 4. Subscriptions */}
            <TouchableOpacity onPress={navigateToSubscriptions} style={styles.tabButton} activeOpacity={0.8}>
              <CreditCard size={21} color={active === 'subscriptions' ? activeColor : inactiveColor} />
              <View
                style={[
                  styles.tabIndicator,
                  { backgroundColor: active === 'subscriptions' ? activeColor : 'transparent' },
                ]}
              />
            </TouchableOpacity>

            {/* 5. More (Right beside Subscriptions) */}
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setIsMoreMenuVisible(true);
              }}
              style={styles.tabButton}
              activeOpacity={0.8}
            >
              <CircleEllipsis size={22} color={isMoreActive ? activeColor : inactiveColor} />
              <View
                style={[
                  styles.tabIndicator,
                  { backgroundColor: isMoreActive ? activeColor : 'transparent' },
                ]}
              />
            </TouchableOpacity>

            {/* 6. Profile */}
            <TouchableOpacity onPress={navigateToProfile} style={styles.tabButton} activeOpacity={0.8}>
              <User size={21} color={active === 'profile' ? activeColor : inactiveColor} />
              <View
                style={[
                  styles.tabIndicator,
                  { backgroundColor: active === 'profile' ? activeColor : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* More Features Modal Sheet */}
      <Modal
        visible={isMoreMenuVisible}
        transparent
        animationType="none"
        onRequestClose={() => setIsMoreMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMoreMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.sheetContainer,
                  {
                    backgroundColor: superTheme.cardBg,
                    borderTopColor: superTheme.border,
                    paddingBottom: Math.max(24, insets.bottom + 12),
                  },
                ]}
              >
                {/* Sheet Handle */}
                <View style={styles.sheetHandleWrap}>
                  <View
                    style={[
                      styles.sheetHandle,
                      { backgroundColor: isDark ? '#3a3a3a' : '#d4d4d8' },
                    ]}
                  />
                </View>

                {/* Sheet Header */}
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={[styles.sheetTitle, { color: superTheme.textPrimary }]}>
                      SuperAdmin More
                    </Text>
                    <Text style={[styles.sheetSubtitle, { color: superTheme.textSecondary }]}>
                      Website bots, public leads & system tools
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsMoreMenuVisible(false)}
                    style={[
                      styles.sheetCloseBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      },
                    ]}
                  >
                    <X size={18} color={superTheme.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Menu Items */}
                <View style={styles.menuList}>
                  {/* Item 1: Chatbot Conversations */}
                  <TouchableOpacity
                    onPress={navigateToChatbot}
                    activeOpacity={0.7}
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: isDark
                          ? 'rgba(131, 92, 238, 0.1)'
                          : 'rgba(131, 92, 238, 0.06)',
                        borderColor: isDark ? 'rgba(131, 92, 238, 0.3)' : 'rgba(131, 92, 238, 0.2)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.menuIconWrap,
                        {
                          backgroundColor: isDark
                            ? 'rgba(131, 92, 238, 0.2)'
                            : 'rgba(131, 92, 238, 0.12)',
                        },
                      ]}
                    >
                      <Bot size={22} color={isDark ? '#a78bfa' : '#835CEE'} />
                    </View>
                    <View style={styles.menuInfo}>
                      <View style={styles.menuTitleRow}>
                        <Text style={[styles.menuTitle, { color: superTheme.textPrimary }]}>
                          Chatbot Conversations
                        </Text>
                        <View style={styles.liveBadge}>
                          <Sparkles size={10} color="#10b981" />
                          <Text style={styles.liveBadgeText}>Live</Text>
                        </View>
                      </View>
                      <Text style={[styles.menuDesc, { color: superTheme.textSecondary }]}>
                        Website visitor chats, AI logs & captured customer leads
                      </Text>
                    </View>
                    <ChevronRight size={18} color={superTheme.textMuted} />
                  </TouchableOpacity>

                  {/* Item 2: Pending Properties */}
                  <TouchableOpacity
                    onPress={navigateToPendingProperties}
                    activeOpacity={0.7}
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16, 185, 129, 0.08)'
                          : 'rgba(16, 185, 129, 0.05)',
                        borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.menuIconWrap,
                        {
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(16, 185, 129, 0.12)',
                        },
                      ]}
                    >
                      <Building2 size={22} color="#10b981" />
                    </View>
                    <View style={styles.menuInfo}>
                      <View style={styles.menuTitleRow}>
                        <Text style={[styles.menuTitle, { color: superTheme.textPrimary }]}>
                          Pending Properties
                        </Text>
                        <View
                          style={[
                            styles.liveBadge,
                            { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                          ]}
                        >
                          <Text style={[styles.liveBadgeText, { color: '#f59e0b' }]}>Review</Text>
                        </View>
                      </View>
                      <Text style={[styles.menuDesc, { color: superTheme.textSecondary }]}>
                        Review & approve property submissions from independent owners
                      </Text>
                    </View>
                    <ChevronRight size={18} color={superTheme.textMuted} />
                  </TouchableOpacity>

                  {/* Item 2: Public Leads */}
                  <TouchableOpacity
                    onPress={navigateToPublicLeads}
                    activeOpacity={0.7}
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: isDark
                          ? 'rgba(245, 158, 11, 0.08)'
                          : 'rgba(245, 158, 11, 0.05)',
                        borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.menuIconWrap,
                        {
                          backgroundColor: isDark
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(245, 158, 11, 0.12)',
                        },
                      ]}
                    >
                      <Globe size={22} color="#f59e0b" />
                    </View>
                    <View style={styles.menuInfo}>
                      <Text style={[styles.menuTitle, { color: superTheme.textPrimary }]}>
                        Public Leads
                      </Text>
                      <Text style={[styles.menuDesc, { color: superTheme.textSecondary }]}>
                        Enquiries, callbacks, site visits & support requests
                      </Text>
                    </View>
                    <ChevronRight size={18} color={superTheme.textMuted} />
                  </TouchableOpacity>

                  {/* Item 3: System Notifications */}
                  <TouchableOpacity
                    onPress={navigateToNotifications}
                    activeOpacity={0.7}
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: isDark
                          ? 'rgba(131, 92, 238, 0.08)'
                          : 'rgba(131, 92, 238, 0.05)',
                        borderColor: isDark ? 'rgba(131, 92, 238, 0.3)' : 'rgba(131, 92, 238, 0.2)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.menuIconWrap,
                        {
                          backgroundColor: isDark
                            ? 'rgba(131, 92, 238, 0.2)'
                            : 'rgba(131, 92, 238, 0.12)',
                        },
                      ]}
                    >
                      <Bell size={22} color="#835CEE" />
                    </View>
                    <View style={styles.menuInfo}>
                      <Text style={[styles.menuTitle, { color: superTheme.textPrimary }]}>
                        System Notifications
                      </Text>
                      <Text style={[styles.menuDesc, { color: superTheme.textSecondary }]}>
                        Platform alerts, registrations & activity feeds
                      </Text>
                    </View>
                    <ChevronRight size={18} color={superTheme.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    paddingTop: 8,
  },
  tabIndicator: {
    width: 14,
    height: 3.5,
    borderRadius: 2,
    marginTop: 5,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuList: {
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
    minWidth: 0,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 9999,
  },
  liveBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10b981',
  },
  menuDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});

BottomNav.displayName = 'SuperAdminBottomNav';
export default BottomNav;
