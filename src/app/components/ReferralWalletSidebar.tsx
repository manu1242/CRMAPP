import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Dimensions,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import {
  Coins,
  Users,
  Copy,
  X,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import { rewardsService, RewardsDetails } from '../../admin/services/RewardsService';

interface ReferralWalletSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 320);

export default function ReferralWalletSidebar({ isOpen, onClose }: ReferralWalletSidebarProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RewardsDetails | null>(null);

  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

  // Animation logic
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchDetails();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const fetchDetails = async () => {
    try {
      const res = await rewardsService.getRewardsDetails();
      if (res && res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.warn('Error fetching rewards details:', err?.message);
      Toast.show({
        type: 'error',
        text1: 'Sync Error',
        text2: err?.message || 'Failed to fetch referral details',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SIDEBAR_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleCopyCode = () => {
    if (data?.referralCode) {
      Clipboard.setString(data.referralCode);
      Toast.show({
        type: 'success',
        text1: 'Code Copied',
        text2: 'Referral code copied to clipboard!',
      });
    }
  };

  const cardShadow = {
    shadowColor: '#000000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 12,
    elevation: isDark ? 8 : 4,
  };

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {/* Backdrop Pressable */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sliding Sidebar */}
        <Animated.View
          style={[
            styles.sidebarContainer,
            {
              width: SIDEBAR_WIDTH,
              backgroundColor: adminTheme.cardBg,
              borderColor: adminTheme.border,
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top || 16,
              paddingBottom: insets.bottom || 16,
              ...cardShadow,
            },
          ]}
        >
          {/* Header Row */}
          <View style={[styles.header, { borderBottomColor: adminTheme.border }]}>
            <View style={styles.titleRow}>
              <View style={styles.coinsIconContainer}>
                <Coins size={20} color="#d97706" />
              </View>
              <Text style={[styles.headerTitle, { color: adminTheme.textPrimary }]}>
                Referral Wallet
              </Text>
            </View>

            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={adminTheme.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#d97706" />
              <Text style={[styles.statusText, { color: adminTheme.textSecondary, marginTop: 12 }]}>
                Syncing wallet logs...
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Balance Card */}
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceAmount}>
                  ₹{data?.balance ?? 0}
                </Text>
                <Text style={[styles.balanceLabel, { color: adminTheme.textSecondary }]}>
                  Available Balance
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: adminTheme.border }]} />

              {/* Referrals Section */}
              <View style={styles.referralsSection}>
                <View style={styles.sectionHeader}>
                  <Users size={16} color={adminTheme.textPrimary} />
                  <Text style={[styles.sectionTitle, { color: adminTheme.textPrimary }]}>
                    Joined by your referral:
                  </Text>
                </View>

                {!data?.referrals || data.referrals.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: adminTheme.textSecondary }]}>
                      No referrals yet.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.referralsList}>
                    {data.referrals.map((ref) => (
                      <View
                        key={ref.id}
                        style={[
                          styles.referralCard,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                            borderColor: adminTheme.border,
                          },
                        ]}
                      >
                        <View style={styles.referralHeader}>
                          <Text style={[styles.companyName, { color: adminTheme.textPrimary }]}>
                            {ref.joinedCompany}
                          </Text>
                          <Text style={styles.rewardAmount}>
                            +₹{ref.amount}
                          </Text>
                        </View>
                        <Text style={[styles.description, { color: adminTheme.textSecondary }]}>
                          {ref.description}
                        </Text>
                        <View style={styles.dateContainer}>
                          <Clock size={10} color={adminTheme.textSecondary} />
                          <Text style={[styles.dateText, { color: adminTheme.textSecondary }]}>
                            {new Date(ref.joinedOn).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={[styles.divider, { backgroundColor: adminTheme.border }]} />

              {/* Referral Code Box */}
              {data?.referralCode ? (
                <View style={styles.referralCodeSection}>
                  <Text style={[styles.codeLabel, { color: adminTheme.textSecondary }]}>
                    Your Referral Code:
                  </Text>

                  <View
                    style={[
                      styles.codeContainer,
                      {
                        backgroundColor: isDark ? '#18181b' : '#f1f5f9',
                        borderColor: adminTheme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.codeText, { color: adminTheme.textPrimary }]}>
                      {data.referralCode}
                    </Text>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={handleCopyCode}
                      style={styles.copyBtn}
                      activeOpacity={0.8}
                    >
                      <Copy size={16} color="#d97706" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  sidebarContainer: {
    height: '100%',
    borderLeftWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinsIconContainer: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusText: {
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
  },
  balanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#d97706',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  referralsSection: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  referralsList: {
    gap: 10,
  },
  referralCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '700',
  },
  rewardAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  description: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 9,
  },
  referralCodeSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  codeContainer: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  actionRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  copyBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#eab308',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
