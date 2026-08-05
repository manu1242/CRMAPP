import React, { useEffect, useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  TouchableWithoutFeedback,
  StyleSheet
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { NotificationService } from '../../Services/NotificationService';
import { Notification } from '../../authorization/models/Notification';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import {
  BellOff,
  CheckCheck,
  Clock,
  AlertCircle,
} from 'lucide-react-native';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal = ({ isOpen, onClose }: NotificationModalProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const insets = useSafeAreaInsets();
  
  // Header height is exactly insets.top + 44
  const topOffset = insets.top + 44;

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await NotificationService.getNotifications();
      const list = res.notifications || [];
      const count = res.count || 0;
      
      setNotifications(list);
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      const res = await NotificationService.markAllAsRead();
      if (res && res.success) {
        setUnreadCount(0);
        fetchNotifications();
      }
    } catch (err: any) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const cardShadow = {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.25 : 0.08,
    shadowRadius: 16,
    elevation: isDark ? 4 : 2,
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <BlurView 
            intensity={isDark ? 25 : 15} 
            tint={isDark ? 'dark' : 'light'} 
            style={[StyleSheet.absoluteFill, { top: topOffset }]}
          />
          
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View 
              style={[
                styles.modalContainer, 
                { 
                  top: topOffset + 8, 
                  backgroundColor: adminTheme.cardBg, 
                  borderColor: adminTheme.border,
                  ...cardShadow 
                }
              ]}
            >
              {/* Triangle pointing up */}
              <View style={[styles.triangle, { borderBottomColor: adminTheme.cardBg }]} />

              {/* Header */}
              <View style={[styles.header, { borderBottomColor: adminTheme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }]}>
                <Text style={[styles.headerTitle, { color: adminTheme.textPrimary }]}>
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: `${adminTheme.brand}15` }]}>
                    <Text style={[styles.badgeText, { color: adminTheme.brand }]}>
                      {unreadCount} new
                    </Text>
                  </View>
                )}
              </View>

              {/* Body */}
              <View style={{ maxHeight: 300, padding: 12 }}>
                {isLoading ? (
                  <View style={styles.centerContainer}>
                    <ActivityIndicator size="small" color={adminTheme.brand} />
                    <Text style={[styles.statusText, { color: adminTheme.textSecondary, marginTop: 8 }]}>Updating alerts...</Text>
                  </View>
                ) : error ? (
                  <View style={styles.centerContainer}>
                    <AlertCircle size={20} color="#ef4444" />
                    <Text style={[styles.errorText, { color: adminTheme.textPrimary }]}>{error}</Text>
                    <TouchableOpacity 
                      onPress={fetchNotifications} 
                      style={[styles.retryBtn, { backgroundColor: adminTheme.brand }]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : notifications.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <BellOff size={24} color={adminTheme.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: adminTheme.textPrimary }]}>All caught up</Text>
                    <Text style={[styles.emptyDesc, { color: adminTheme.textSecondary }]}>No alerts to display</Text>
                  </View>
                ) : (
                  <ScrollView 
                    showsVerticalScrollIndicator={true} 
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {notifications.map((item) => (
                      <View 
                        key={item.id} 
                        style={[
                          styles.notificationCard, 
                          { 
                            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                            borderColor: adminTheme.border,
                            borderLeftColor: adminTheme.brand
                          }
                        ]}
                      >
                        <Text style={[styles.notifTitle, { color: adminTheme.textPrimary }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[styles.notifDesc, { color: adminTheme.textSecondary }]}>
                          {item.message}
                        </Text>
                        <View style={styles.timeContainer}>
                          <Clock size={10} color={adminTheme.textSecondary} />
                          <Text style={[styles.timeText, { color: adminTheme.textSecondary }]}>
                            {item.createdOn}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Footer */}
              {unreadCount > 0 && (
                <TouchableOpacity 
                  onPress={handleMarkAllRead}
                  activeOpacity={0.7}
                  style={[
                    styles.footer, 
                    { 
                      borderTopColor: adminTheme.border, 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' 
                    }
                  ]}
                >
                  <CheckCheck size={14} color={adminTheme.brand} style={{ marginRight: 6 }} />
                  <Text style={[styles.footerText, { color: adminTheme.brand }]}>
                    Mark all as read
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    position: 'absolute', 
    right: 16,
    width: 300,
    borderRadius: 12,
    borderWidth: 1,
  },
  triangle: {
    position: 'absolute',
    top: -8,
    right: 50,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  notificationCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 10,
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  notifDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  timeText: {
    fontSize: 9,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default NotificationModal;