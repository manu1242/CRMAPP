import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  Clock,
  AlertCircle,
  IndianRupee,
  User,
  Settings,
  Shield,
  Building2,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../theme/adminTheme';
import { NotificationService } from '../../Services/NotificationService';
import { Notification } from '../../authorization/models/Notification';

export default function SuperAdminNotificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const superTheme = getSuperAdminTheme(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await NotificationService.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err: any) {
      console.error('Failed to load superadmin notifications:', err);
      setError(err?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await NotificationService.markAllAsRead();
      if (res && res.success) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (title: string, message: string) => {
    const combined = (title + ' ' + message).toLowerCase();
    if (combined.includes('tenant') || combined.includes('company') || combined.includes('workspace')) {
      return <Building2 size={16} color="#3b82f6" />;
    }
    if (combined.includes('payment') || combined.includes('plan') || combined.includes('subscription') || combined.includes('invoice')) {
      return <IndianRupee size={16} color="#10b981" />;
    }
    if (combined.includes('security') || combined.includes('role') || combined.includes('permission')) {
      return <Shield size={16} color="#8b5cf6" />;
    }
    if (combined.includes('user') || combined.includes('admin')) {
      return <User size={16} color="#6366f1" />;
    }
    if (combined.includes('system') || combined.includes('config') || combined.includes('setting')) {
      return <Settings size={16} color="#64748b" />;
    }
    return <Bell size={16} color="#f59e0b" />;
  };

  const hasUnread = unreadCount > 0;

  return (
    <View style={{ flex: 1, backgroundColor: superTheme.primaryBg }}>
      {/* ── Top Bar with Back Navigation ── */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: superTheme.secondaryBg,
            borderBottomColor: superTheme.border,
            paddingTop: insets.top > 0 ? 8 : 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={superTheme.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.topBarTitle, { color: superTheme.textPrimary }]}>
            Notifications & System Alerts
          </Text>
          {hasUnread && (
            <Text style={[styles.topBarSubtitle, { color: superTheme.brand }]}>
              {unreadCount} unread alert{unreadCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {hasUnread && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
            style={[
              styles.markAllBtn,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe',
              },
            ]}
          >
            <CheckCheck size={13} color={superTheme.brand} />
            <Text style={{ color: superTheme.brand, fontSize: 11, fontWeight: '700' }}>
              Mark All Read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Content Area ── */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={superTheme.brand} />
          <Text style={[styles.loadingText, { color: superTheme.textSecondary }]}>
            Loading system alerts...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={32} color="#ef4444" />
          <Text style={[styles.errorTitle, { color: superTheme.textPrimary }]}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => fetchNotifications()}
            style={[styles.retryBtn, { backgroundColor: superTheme.brand }]}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              colors={[superTheme.brand]}
              tintColor={superTheme.brand}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
            ]}
          >
            <BellOff size={32} color={superTheme.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: superTheme.textPrimary }]}>
            All caught up
          </Text>
          <Text style={[styles.emptySubtitle, { color: superTheme.textSecondary }]}>
            No unread or archived system alerts in your history.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              colors={[superTheme.brand]}
              tintColor={superTheme.brand}
            />
          }
        >
          <View style={{ backgroundColor: superTheme.cardBg }}>
            {notifications.map((item, index) => {
              const isUnread = index < unreadCount;
              return (
                <View
                  key={item.id || index}
                  style={[
                    styles.notificationRow,
                    {
                      borderColor: superTheme.border,
                      backgroundColor: isUnread
                        ? (isDark ? 'rgba(59, 130, 246, 0.06)' : '#f0f9ff')
                        : 'transparent',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                      },
                    ]}
                  >
                    {getNotificationIcon(item.title, item.message)}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[styles.itemTitle, { color: superTheme.textPrimary }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {isUnread && (
                        <View style={[styles.newBadge, { backgroundColor: superTheme.brand }]}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.itemMessage, { color: superTheme.textSecondary }]}>
                      {item.message}
                    </Text>
                    <View style={styles.timeRow}>
                      <Clock size={10} color={superTheme.textMuted} />
                      <Text style={[styles.timeText, { color: superTheme.textMuted }]}>
                        {item.createdOn ? new Date(item.createdOn).toLocaleString() : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  topBarSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  itemMessage: {
    fontSize: 12,
    lineHeight: 16,
    marginVertical: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 9,
  },
});
