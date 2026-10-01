import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, LogOut, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme, getSuperAdminTheme } from '../../theme/adminTheme';
import { useBrandingQuery } from '../../admin/hooks/useBranding';
import { BrandingService } from '../../admin/services/BrandingService';

interface UserMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
}

export default function UserMenuModal({ isOpen, onClose, isSuperAdmin = false }: UserMenuModalProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const themeTokens = isSuperAdmin ? getSuperAdminTheme(isDark) : getAdminTheme(isDark);
  
  // Header height is 57px (paddingTop 12 + avatar 32 + paddingBottom 12 + border 1).
  // Modal sits on the screen overlay, so topOffset must include the top status bar/notch inset + header height.
  const topInset = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44);
  const topOffset = topInset + 58;

  const username = user?.username || (isSuperAdmin ? 'Super Admin' : 'Admin User');
  const initial = username.trim().charAt(0).toUpperCase() || (isSuperAdmin ? 'S' : 'A');
  const role = user?.role || (isSuperAdmin ? 'superadmin' : 'admin');
  const tenantName = user?.tenantName;

  const { data: branding } = useBrandingQuery();
  const logoUrl = !isSuperAdmin ? BrandingService.resolveLogoUri(branding?.companyLogo || branding?.logoPath) : null;

  const handleProfilePress = () => {
    onClose();
    if (isSuperAdmin) {
      router.push('/superadmin/profile' as any);
    } else {
      router.push('/profile' as any);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutConfirm(false);
      onClose();
      router.replace('/main-login');
    } catch (err) {
      console.error('Logout error:', err);
      setShowLogoutConfirm(false);
      onClose();
      router.replace('/main-login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isOpen) return null;

  const cardShadow = {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.35 : 0.12,
    shadowRadius: 16,
    elevation: isDark ? 8 : 4,
  };

  return (
    <>
      {/* Dropdown Menu Modal */}
      <Modal
        visible={isOpen && !showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalContainer,
                  {
                    top: topOffset,
                    backgroundColor: themeTokens.cardBg,
                    borderColor: themeTokens.border,
                    ...cardShadow,
                  },
                ]}
              >
                {/* Triangle pointing up directly to profile avatar */}
                <View style={[styles.triangleBorder, { borderBottomColor: themeTokens.border }]} />
                <View style={[styles.triangleFill, { borderBottomColor: themeTokens.cardBg }]} />

                {/* User Info Header */}
                <View style={[styles.header, { borderBottomColor: themeTokens.border }]}>
                  <View style={[styles.avatar, { backgroundColor: themeTokens.brand, overflow: 'hidden' }]}>
                    {logoUrl ? (
                      <Image
                        source={{ uri: logoUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>{initial}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.usernameText, { color: themeTokens.textPrimary }]} numberOfLines={1}>
                      {username}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.roleBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)' }]}>
                        <Text style={[styles.roleBadgeText, { color: themeTokens.brand }]}>
                          {role.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    {tenantName ? (
                      <Text style={[styles.tenantText, { color: themeTokens.textSecondary }]} numberOfLines={1}>
                        {tenantName}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuList}>
                  {/* My Profile */}
                  <TouchableOpacity
                    onPress={handleProfilePress}
                    style={[styles.menuItem, { borderBottomColor: themeTokens.border, borderBottomWidth: 1 }]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.itemIconContainer, { backgroundColor: isDark ? '#18181b' : '#f1f5f9' }]}>
                      <User size={16} color={themeTokens.textPrimary} />
                    </View>
                    <Text style={[styles.itemText, { color: themeTokens.textPrimary }]}>My Profile</Text>
                    <ChevronRight size={16} color={themeTokens.textSecondary} />
                  </TouchableOpacity>

                  {/* Log Out */}
                  <TouchableOpacity
                    onPress={handleLogoutClick}
                    style={styles.menuItem}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.itemIconContainer, { backgroundColor: isDark ? '#450a0a' : '#fee2e2' }]}>
                      <LogOut size={16} color="#ef4444" />
                    </View>
                    <Text style={[styles.itemText, { color: '#ef4444', fontWeight: '600' }]}>Log Out</Text>
                    <ChevronRight size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Custom Themed Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <View style={styles.confirmOverlay}>
          <View
            style={[
              styles.confirmCard,
              {
                backgroundColor: themeTokens.cardBg,
                borderColor: themeTokens.border,
              },
            ]}
          >
            {/* Warning Icon Badge */}
            <View style={styles.confirmIconBadge}>
              <LogOut size={26} color="#ef4444" />
            </View>

            {/* Title & Description */}
            <Text style={[styles.confirmTitle, { color: themeTokens.textPrimary }]}>
              Log Out
            </Text>
            <Text style={[styles.confirmDesc, { color: themeTokens.textSecondary }]}>
              Are you sure you want to log out of your account?
            </Text>

            {/* Action Buttons */}
            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                onPress={handleCancelLogout}
                disabled={isLoggingOut}
                style={[styles.cancelBtn, { borderColor: themeTokens.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: themeTokens.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmLogout}
                disabled={isLoggingOut}
                style={styles.logoutBtn}
                activeOpacity={0.8}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.logoutBtnText}>
                    Log Out
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    position: 'absolute',
    right: 16,
    width: 240,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'visible',
    zIndex: 9999,
  },
  triangleBorder: {
    position: 'absolute',
    top: -8,
    right: 16,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 100,
  },
  triangleFill: {
    position: 'absolute',
    top: -6.5,
    right: 17,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 101,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  usernameText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tenantText: {
    fontSize: 11,
    marginTop: 2,
  },
  menuList: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  itemIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  confirmIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ef444415',
    borderWidth: 1,
    borderColor: '#ef444430',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  confirmDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
