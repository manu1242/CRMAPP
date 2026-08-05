import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  FolderOpen,
  Building2,
  ShoppingCart,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  Package,
  Calendar,
  Megaphone,
  CreditCard,
  Briefcase,
  Search,
  X,
  ChevronRight,
  ArrowLeft,
  HelpCircle,
  LogOut,
  Sparkles,
  Info,
  User,
  Clock,
  CheckCircle,
  TrendingUp,
  Mail,
  Shield,
  Bot,
  MessageSquare,
  Landmark,
  DollarSign,
} from 'lucide-react-native';


import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../auth/store/authStore';
import { getAdminTheme } from '../../theme/adminTheme';


export interface SubLinkItem {
  label: string;
  route: string;
}

export interface ModuleItem {
  id: string;
  title: string;
  icon: any;
  color: string; // Icon color hex
  bgColor: string; // Badge bg color hex
  category: string;
  subLinks: SubLinkItem[];
}

export const MODULES: ModuleItem[] = [
  {
    id: 'leads-properties',
    title: 'Leads & Props',
    icon: FolderOpen,
    color: '#10b981',
    bgColor: '#10b9811f',
    category: 'Sales & Marketing',
    subLinks: [
      { label: 'Leads', route: '/admin/leads' },
      { label: 'Sales Pipeline', route: '/admin/sales' },
      { label: 'Tasks', route: '/admin/Tasks' },
      { label: 'Unassigned Leads', route: '/admin/unassigned' },
      { label: 'Properties', route: '/admin/properties' },
    ],
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: ShoppingCart,
    color: '#6366f1',
    bgColor: '#6366f11f',
    category: 'Sales & Marketing',
    subLinks: [
      { label: 'Quotations', route: '/admin/SalesUnit/quotation' },
      { label: 'Bookings', route: '/admin/SalesUnit/bookings' },
      { label: 'Invoices', route: '/admin/SalesUnit/invoice' },
      { label: 'Payments', route: '/admin/SalesUnit/payments' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: CreditCard,
    color: '#f59e0b',
    bgColor: '#f59e0b1f',
    category: 'Financial Management',
    subLinks: [
      { label: 'Expenses', route: '/admin/finance/expenses' },
      { label: 'Revenue', route: '/admin/finance/revenue' },
      { label: 'Profit', route: '/admin/finance/profit' },
    ],
  },
  {
    id: 'team-management',
    title: 'Team Mgmt',
    icon: Users,
    color: '#a855f7',
    bgColor: '#a855f71f',
    category: 'Human Resources',
    subLinks: [
      { label: 'Agent List', route: '/admin/teammanagement/Agent' },
      { label: 'Channel Partner', route: '/admin/teammanagement/channelpartner/channel' },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance',
    icon: Clock,
    color: '#06b6d4',
    bgColor: '#06b6d41f',
    category: 'Human Resources',
    subLinks: [
      { label: 'Agent Attendance', route: '/admin/attendance/AgentAttendance' },
    ],
  },
  {
    id: 'payouts',
    title: 'Payouts',
    icon: DollarSign,
    color: '#ec4899',
    bgColor: '#ec48991f',
    category: 'Financial Management',
    subLinks: [
      { label: 'Agent Payouts', route: '/admin/payouts/AgentPayout' },
      { label: 'Partner Payouts', route: '/admin/payouts/PartnerPayout' },
    ],
  },
  {
    id: 'user-management',
    title: 'User Mgmt',
    icon: Shield,
    color: '#ef4444',
    bgColor: '#ef44441f',
    category: 'System & Security',
    subLinks: [
      { label: 'Manage Users', route: '/admin/usemanagement/ManageUsers' },
      { label: 'Roles Management', route: '/admin/usemanagement/RolesManagement' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    color: '#64748b',
    bgColor: '#64748b1f',
    category: 'System Settings',
    subLinks: [
      { label: 'My Profile', route: '/admin/settings/profile/Profile' },
      { label: 'System Settings', route: '/admin/settings/systemsettings/setting' },
      { label: 'Email Settings', route: '/admin/settings/emailconfig/EmailConfig' },
    ],
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    icon: Package,
    color: '#14b8a6',
    bgColor: '#14b8a61f',
    category: 'Subscriptions & Billing',
    subLinks: [
      { label: 'Subscription Plans', route: '/admin/subscriptions/plans/Plans' },
      { label: 'Partner Subscriptions', route: '/admin/subscriptions/partnersubscriptions/PartnerSubscriptions' },
      { label: 'Razorpay Transactions', route: '/admin/subscriptions/razaorpay/RazorpayTransactions' },
      { label: 'Pending Refunds', route: '/admin/subscriptions/pendingrefunds/PendingRefunds' },
      { label: 'My CRM Plan', route: '/admin/subscriptions/crmplans/MyCrmPlan' },
      { label: 'CRM Transactions', route: '/admin/subscriptions/crmtransactions/CrmTransactions' },
    ],
  },
  {
    id: 'financial-settings',
    title: 'Financial Settings',
    icon: Landmark,
    color: '#8b5cf6',
    bgColor: '#8b5cf61f',
    category: 'Financial Management',
    subLinks: [
      { label: 'Payment Gateways', route: '/admin/paymentconfig' },
      { label: 'Bank Accounts', route: '/admin/bankaccountconfig' },
    ],
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    icon: MessageSquare,
    color: '#f43f5e',
    bgColor: '#f43f5e1f',
    category: 'Marketing & Feedback',
    subLinks: [
      { label: 'Manage Testimonials', route: '/admin/testimonial' },
    ],
  },

  {
    id: 'chatbot-dashboard',
    title: 'Chatbot',
    icon: Bot,
    color: '#0284c7',
    bgColor: '#0284c71f',
    category: 'AI & Automation',
    subLinks: [
      { label: 'Chatbot Dashboard', route: '/admin/chatbot' },
    ],
  },
];

interface BottomMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export function BottomMenuSheet({ isOpen, onClose, onLogout }: BottomMenuSheetProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const logout = useAuthStore((state) => state.logout);

  const [searchQuery, setSearchQuery] = useState('');
  const [focusedModuleId, setFocusedModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setFocusedModuleId(null);
    }
  }, [isOpen]);

  const handleNavigate = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const handleModulePress = (module: ModuleItem) => {
    if (module.subLinks && module.subLinks.length === 1) {
      handleNavigate(module.subLinks[0].route);
    } else {
      setFocusedModuleId(module.id);
    }
  };

  const handleLogout = () => {
    onClose();
    if (onLogout) {
      onLogout();
    } else {
      logout();
      router.replace('/main-login');
    }
  };

  const filteredModules = MODULES.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const focusedModule = MODULES.find((m) => m.id === focusedModuleId);

  // Theme colors
  const cardBg = adminTheme.cardBg;
  const sheetBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderColor = adminTheme.border;
  const inputBg = adminTheme.inputBg;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop Pressable */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Bottom Sheet Container */}
        <View style={[styles.sheetContainer, { backgroundColor: sheetBg }]}>
          {/* Drag Handle Capsule */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header Row */}
          <View style={[styles.headerRow, { borderBottomColor: borderColor }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: textColor }]}>
                {focusedModule ? focusedModule.title : 'Role:Admin'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
                {focusedModule ? focusedModule.category : 'Quick Actions & Modules'}
              </Text>
            </View>

            {focusedModule ? (
              <TouchableOpacity
                onPress={() => setFocusedModuleId(null)}
                style={[styles.backButton, { backgroundColor: inputBg }]}
              >
                <ArrowLeft size={16} color={textColor} />
                <Text style={[styles.backButtonText, { color: textColor }]}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: inputBg }]}>
                <X size={18} color={textColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Input (When not focused) */}
          {!focusedModuleId && (
            <View style={[styles.searchWrapper, { backgroundColor: inputBg, borderColor }]}>
              <Search size={16} color={subTextColor} />
              <TextInput
                placeholder="Search modules..."
                placeholderTextColor={subTextColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: textColor }]}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={subTextColor} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content Area */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {focusedModule ? (
              /* Focused Module Sub-Links View */
              <View style={styles.focusedContainer}>
                <View style={[styles.focusedBadgeCard, { backgroundColor: focusedModule.bgColor }]}>
                  <focusedModule.icon size={28} color={focusedModule.color} />
                  <Text style={[styles.focusedBadgeTitle, { color: textColor }]}>
                    {focusedModule.title}
                  </Text>
                  <Text style={[styles.focusedBadgeCategory, { color: subTextColor }]}>
                    {focusedModule.category}
                  </Text>
                </View>

                <Text style={[styles.subLinksHeading, { color: subTextColor }]}>SELECT ACTION ITEM</Text>

                {focusedModule.subLinks.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleNavigate(item.route)}
                    style={[styles.subLinkCard, { backgroundColor: cardBg, borderColor }]}
                  >
                    <View style={styles.subLinkRow}>
                      <View style={[styles.subLinkIconBadge, { backgroundColor: inputBg }]}>
                        <ChevronRight size={16} color={focusedModule.color} />
                      </View>
                      <Text style={[styles.subLinkLabel, { color: textColor }]}>{item.label}</Text>
                    </View>
                    <ChevronRight size={16} color={subTextColor} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              /* 3-Column Modules Grid */
              <View style={styles.gridContainer}>
                {filteredModules.length > 0 ? (
                  filteredModules.map((module) => {
                    const IconComp = module.icon;
                    return (
                      <TouchableOpacity
                        key={module.id}
                        onPress={() => handleModulePress(module)}
                        style={[styles.moduleCard, { backgroundColor: cardBg, borderColor }]}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconBadge, { backgroundColor: module.bgColor }]}>
                          <IconComp size={22} color={module.color} />
                        </View>
                        <Text style={[styles.moduleTitle, { color: textColor }]} numberOfLines={1}>
                          {module.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyState}>
                    <Info size={24} color={subTextColor} />
                    <Text style={[styles.emptyText, { color: subTextColor }]}>No modules match "{searchQuery}"</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: borderColor }]}>
            <TouchableOpacity onPress={() => handleNavigate('/profile')} style={styles.footerHelp}>
              <HelpCircle size={16} color={subTextColor} />
              <Text style={[styles.footerHelpText, { color: subTextColor }]}>Account & Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={16} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  sheetContainer: {
    maxHeight: windowHeight * 0.58,
    minHeight: windowHeight * 0.35,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#64748b',
    opacity: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  moduleCard: {
    width: '31%',
    aspectRatio: 1.05,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  moduleTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    width: '100%',
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
  },
  focusedContainer: {
    paddingVertical: 4,
  },
  focusedBadgeCard: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  focusedBadgeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  focusedBadgeCategory: {
    fontSize: 11,
    marginTop: 2,
  },
  subLinksHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  subLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  subLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subLinkIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subLinkLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  footerHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  footerHelpText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ef444415',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default BottomMenuSheet;
