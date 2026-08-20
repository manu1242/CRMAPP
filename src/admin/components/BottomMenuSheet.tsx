import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  PanResponder,
  Platform,
  Easing,
  BackHandler,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
import { getAdminTheme } from '../../theme/adminTheme';

const windowHeight = Dimensions.get('window').height;

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
  blurTargetRef?: React.RefObject<any>;
}

export function BottomMenuSheet({ isOpen, onClose, blurTargetRef }: BottomMenuSheetProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const [searchQuery, setSearchQuery] = useState('');
  const [focusedModuleId, setFocusedModuleId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(isOpen);

  // Handle hardware back button on Android when sheet is visible
  useEffect(() => {
    if (modalVisible) {
      const backAction = () => {
        onClose();
        return true;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );
      return () => backHandler.remove();
    }
  }, [modalVisible]);

  // Dynamic height configuration
  const [contentHeight, setContentHeight] = useState(320); // Fallback content height
  const contentHeightRef = useRef(320);

  const getMinHeight = () => Math.min(contentHeightRef.current, windowHeight * 0.40);
  const getMaxHeight = () => Math.min(contentHeightRef.current, windowHeight * 0.92);

  const sheetHeight = useRef(new Animated.Value(320)).current;
  const translateY = useRef(new Animated.Value(windowHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Staggered animated values for each module card
  const itemAnims = useRef(MODULES.map(() => new Animated.Value(0))).current;

  // Sub-links sliding spring animation
  const subLinkAnim = useRef(new Animated.Value(0)).current;

  const committedHeightRef = useRef(320); // last settled snap value
  const startHeightRef = useRef(320);     // height when gesture starts
  const currentHeightRef = useRef(320);   // live value during drag
  const scrollYRef = useRef(0);            // ScrollView scroll position
  const isExpandedRef = useRef(false);     // mirrors isExpanded for PanResponder

  // Keep onClose fresh inside the memoised PanResponder
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Track animated value live
  useEffect(() => {
    const id = sheetHeight.addListener(({ value }) => {
      currentHeightRef.current = value;
    });
    return () => sheetHeight.removeListener(id);
  }, [sheetHeight]);

  // Open / Close Animation Orchestration
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      setSearchQuery('');
      setFocusedModuleId(null);
      setIsExpanded(false);
      isExpandedRef.current = false;
      
      const initialHeight = getMinHeight();
      committedHeightRef.current = initialHeight;
      scrollYRef.current = 0;
      sheetHeight.setValue(initialHeight);
      translateY.setValue(windowHeight);

      // Start entering transition
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 24,
          mass: 1.0,
          stiffness: 90,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Reset and trigger staggered grid items animation
      itemAnims.forEach((anim) => anim.setValue(0));
      const staggerAnimations = itemAnims.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 250,
          delay: 150 + index * 30, // 30ms stagger delay
          useNativeDriver: true,
        })
      );
      Animated.parallel(staggerAnimations).start();
    } else {
      // Start exit animations
      Animated.parallel([
        Animated.timing(sheetHeight, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: windowHeight,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [isOpen]);

  // Focus module sublinks transition
  useEffect(() => {
    if (focusedModuleId) {
      subLinkAnim.setValue(0);
      Animated.spring(subLinkAnim, {
        toValue: 1,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    }
  }, [focusedModuleId]);

  // Helper: animate to a snap point
  const snapTo = (target: number, onDone?: () => void) => {
    committedHeightRef.current = target;
    const maxH = getMaxHeight();
    const minH = getMinHeight();
    const expanding = target >= maxH - 10 && maxH > minH;
    setIsExpanded(expanding);
    isExpandedRef.current = expanding;
    Animated.spring(sheetHeight, {
      toValue: target,
      useNativeDriver: false,
      tension: 65,
      friction: 11,
    }).start(onDone);
  };

  // Helper: dismiss (slide to 0 then call onClose)
  const dismiss = () => {
    onCloseRef.current();
  };

  const panResponder = useRef(
    PanResponder.create({
      // Always claim the gesture start on the drag handle zone
      onStartShouldSetPanResponder: () => false,

      onMoveShouldSetPanResponder: (_evt, gs) => {
        const isVertical = Math.abs(gs.dy) > Math.abs(gs.dx);
        if (!isVertical) return false;

        // When collapsed — grab ALL upward and downward gestures
        if (!isExpandedRef.current) return Math.abs(gs.dy) > 6;

        // When expanded — only grab downward gesture when content is scrolled to top
        if (gs.dy > 6 && scrollYRef.current <= 0) return true;

        return false;
      },

      onPanResponderGrant: () => {
        startHeightRef.current = committedHeightRef.current;
      },

      onPanResponderMove: (_evt, gs) => {
        let newH = startHeightRef.current - gs.dy;
        const maxH = getMaxHeight();
        newH = Math.max(0, Math.min(maxH, newH));
        sheetHeight.setValue(newH);
      },

      onPanResponderRelease: (_evt, gs) => {
        const minH = getMinHeight();
        const maxH = getMaxHeight();
        const mid = minH + (maxH - minH) * 0.35;

        // ── UPWARD DRAG (expanding) ─────────────────────────────────────
        if (gs.dy <= 0) {
          if (gs.vy < -0.5 || currentHeightRef.current > mid) {
            snapTo(maxH);
          } else {
            snapTo(minH);
          }
          return;
        }

        // ── DOWNWARD DRAG (collapsing / dismissing) ─────────────────────
        const draggedDown = startHeightRef.current - currentHeightRef.current;
        if (gs.vy > 0.6 || draggedDown > minH * 0.35) {
          dismiss();
          return;
        }

        // Otherwise snap by position
        snapTo(currentHeightRef.current > mid ? maxH : minH);
      },
    })
  ).current;

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

  const handleContentHeightChange = (height: number) => {
    const roundedHeight = Math.round(height);
    if (Math.abs(roundedHeight - contentHeightRef.current) > 2) {
      contentHeightRef.current = roundedHeight;
      setContentHeight(roundedHeight);
      
      if (isOpen) {
        const targetHeight = isExpandedRef.current || focusedModuleId 
          ? getMaxHeight() 
          : getMinHeight();

        committedHeightRef.current = targetHeight;
        Animated.spring(sheetHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: 80,
          friction: 12,
        }).start();
      }
    }
  };

  const handleInnerContentLayout = (height: number) => {
    const roundedHeight = Math.round(height);
    // Add header, search wrapper, margins, and padding heights
    const nonContentHeight = focusedModuleId ? 140 : 196;
    handleContentHeightChange(roundedHeight + nonContentHeight);
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

  if (!modalVisible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
      <View style={styles.overlay}>
        {/* Backdrop container with Gaussian Blur */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
          <BlurView
            intensity={4}
            tint={isDark ? 'dark' : 'light'}
            blurMethod="dimezisBlurView"
            blurTarget={blurTargetRef}
            blurReductionFactor={1}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            style={[
              styles.backdrop,
              { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)' }
            ]}
            onPress={onClose}
          />
        </Animated.View>

        {/* Bottom Sheet Outer Container — TranslateY for slide in (uses native driver) */}
        <Animated.View
          style={{
            width: '100%',
            transform: [{ translateY }],
          }}
        >
          {/* Bottom Sheet Inner Container — Height driven by Animated.Value (uses non-native driver) */}
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: sheetBg,
                height: sheetHeight,
              },
            ]}
          >
          {/* Drag Handle — always interactive */}
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          {/* Animating overall content opacity */}
          <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
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

            {/* Content Area — wrap with panHandlers so swipe-up anywhere expands */}
            <View style={{ flex: 1 }} {...panResponder.panHandlers}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                scrollEnabled={isExpanded}
                onScroll={(e) => {
                  scrollYRef.current = e.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
              >
                {focusedModule ? (
                  /* Focused Module Sub-Links View */
                  <Animated.View
                    onLayout={(e) => handleInnerContentLayout(e.nativeEvent.layout.height)}
                    style={[
                      styles.focusedContainer,
                      {
                        opacity: subLinkAnim,
                        transform: [
                          {
                            translateY: subLinkAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [15, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
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
                  </Animated.View>
                ) : (
                  /* 3-Column Modules Grid with Staggered Entrance */
                  <View 
                    onLayout={(e) => handleInnerContentLayout(e.nativeEvent.layout.height)}
                    style={styles.gridContainer}
                  >
                    {filteredModules.length > 0 ? (
                      filteredModules.map((module, index) => {
                        const IconComp = module.icon;
                        const anim = itemAnims[index] || new Animated.Value(1);

                        return (
                          <Animated.View
                            key={module.id}
                            style={[
                              styles.moduleCardWrapper,
                              {
                                opacity: anim,
                                transform: [
                                  {
                                    translateY: anim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [20, 0],
                                    }),
                                  },
                                  {
                                    scale: anim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0.93, 1],
                                    }),
                                  },
                                ],
                              },
                            ]}
                          >
                            <TouchableOpacity
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
                          </Animated.View>
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
            </View>

          </Animated.View>
        </Animated.View>
      </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 24,
    overflow: 'hidden',
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
  moduleCardWrapper: {
    width: '31%',
    aspectRatio: 1.05,
  },
  moduleCard: {
    width: '100%',
    height: '100%',
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

});

export default BottomMenuSheet;

