import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.5;
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
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../theme/adminTheme';
import { NotificationService } from '../../Services/NotificationService';
import { Notification } from '../../authorization/models/Notification';
import { useBottomNavSpacing } from '../../hooks/useBottomNavSpacing';
import { triggerHaptic } from '../../utils/haptics';
import { resolveNotificationRoute, navigateToNotification } from '../../utils/notificationNavigator';

export default function SuperAdminNotificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const superTheme = getSuperAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const queryClient = useQueryClient();

  const {
    data: notifData,
    isLoading,
    isRefetching,
    refetch,
    error: queryError,
  } = useQuery({
    queryKey: ['superadmin-unread-notifications'],
    queryFn: () => NotificationService.getNotifications(),
    staleTime: 45 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const notifications: Notification[] = notifData?.notifications || [];
  const unreadCount: number = notifData?.unreadCount ?? (notifData as any)?.count ?? 0;
  const error = queryError ? (queryError as any).message || 'Failed to fetch notifications' : null;

  const handleMarkAllRead = async () => {
    try {
      triggerHaptic('light');
      const res = await NotificationService.markAllAsRead();
      if (res && res.success) {
        queryClient.invalidateQueries({ queryKey: ['superadmin-unread-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to permanently clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerHaptic('warning');
              await NotificationService.clearAllNotifications();
              queryClient.invalidateQueries({ queryKey: ['superadmin-unread-notifications'] });
              queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            } catch (err: any) {
              console.error('Failed to clear all notifications:', err);
            }
          },
        },
      ]
    );
  };

  const clearingIds = useRef(new Set<string | number>());

  const handleClearSingle = async (notifId?: number | string) => {
    if (!notifId || clearingIds.current.has(notifId)) return;
    clearingIds.current.add(notifId);
    try {
      triggerHaptic('light');
      // Instant optimistic cache update with zero lag
      queryClient.setQueryData(['superadmin-unread-notifications'], (old: any) => {
        if (!old) return old;
        const currentList: Notification[] = old.notifications || [];
        const nextList = currentList.filter((n: any) => (n.id || n.notificationId) !== notifId);
        return {
          ...old,
          notifications: nextList,
          unreadCount: Math.max(0, (old.unreadCount || 1) - 1),
        };
      });
      await NotificationService.clearNotification(notifId);
      queryClient.invalidateQueries({ queryKey: ['superadmin-unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error('Failed to clear alert:', err);
    } finally {
      clearingIds.current.delete(notifId);
    }
  };

  const handleNotificationClick = async (item: Notification) => {
    const notifId = item.notificationId ?? item.id;
    if (notifId) {
      NotificationService.markAsRead(notifId).catch(() => {});
      queryClient.setQueryData(['superadmin-unread-notifications'], (old: any) => {
        if (!old) return old;
        const currentList: Notification[] = old.notifications || [];
        return {
          ...old,
          notifications: currentList.map((n: any) =>
            (n.id || n.notificationId) === notifId ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, (old.unreadCount || 1) - 1),
        };
      });
    }
    await navigateToNotification(item, router);
  };

  const getNotificationIcon = (title: string, message: string) => {
    const combined = (title + ' ' + message).toLowerCase();
    if (combined.includes('tenant') || combined.includes('company') || combined.includes('workspace')) {
      return <Building2 size={16} color="#835CEE" />;
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
                Read All
              </Text>
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              activeOpacity={0.7}
              style={[
                styles.markAllBtn,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
                },
              ]}
            >
              <Trash2 size={13} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Content Area ── */}
      {isLoading && !notifData ? (
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
            onPress={() => refetch()}
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
              refreshing={isRefetching}
              onRefresh={() => refetch()}
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
          contentContainerStyle={{ paddingBottom: bottomSpacing, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              colors={[superTheme.brand]}
              tintColor={superTheme.brand}
            />
          }
        >
          <View style={{ backgroundColor: superTheme.cardBg }}>
            {notifications.map((item, index) => {
              const isUnread = index < unreadCount;
              const notifId = item.id || (item as any).notificationId;

              const renderRightActions = (
                _progress: Animated.AnimatedInterpolation<number>,
                dragX: Animated.AnimatedInterpolation<number>
              ) => {
                const scale = dragX.interpolate({
                  inputRange: [-SWIPE_THRESHOLD, -40, 0],
                  outputRange: [1, 0.8, 0],
                  extrapolate: 'clamp',
                });

                return (
                  <View
                    style={{
                      width: SCREEN_WIDTH,
                      backgroundColor: '#ef4444',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      paddingRight: 24,
                    }}
                  >
                    <Animated.View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        transform: [{ scale }],
                      }}
                    >
                      <Trash2 size={20} color="#ffffff" strokeWidth={2.5} />
                      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>
                        Delete
                      </Text>
                    </Animated.View>
                  </View>
                );
              };

              const renderLeftActions = (
                _progress: Animated.AnimatedInterpolation<number>,
                dragX: Animated.AnimatedInterpolation<number>
              ) => {
                const scale = dragX.interpolate({
                  inputRange: [0, 40, SWIPE_THRESHOLD],
                  outputRange: [0, 0.8, 1],
                  extrapolate: 'clamp',
                });

                return (
                  <View
                    style={{
                      width: SCREEN_WIDTH,
                      backgroundColor: '#ef4444',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      paddingLeft: 24,
                    }}
                  >
                    <Animated.View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        transform: [{ scale }],
                      }}
                    >
                      <Trash2 size={20} color="#ffffff" strokeWidth={2.5} />
                      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>
                        Delete
                      </Text>
                    </Animated.View>
                  </View>
                );
              };

              return (
                <Swipeable
                  key={notifId || index}
                  friction={1}
                  enableTrackpadTwoFingerGesture
                  activeOffsetX={[-25, 25]}
                  failOffsetY={[-15, 15]}
                  leftThreshold={SWIPE_THRESHOLD}
                  rightThreshold={SWIPE_THRESHOLD}
                  overshootRight={false}
                  overshootLeft={false}
                  renderRightActions={renderRightActions}
                  renderLeftActions={renderLeftActions}
                  onSwipeableWillOpen={() => handleClearSingle(notifId)}
                  onSwipeableOpen={() => handleClearSingle(notifId)}
                >
                  <TouchableOpacity
                    onPress={() => handleNotificationClick(item)}
                    activeOpacity={0.7}
                    style={[
                      styles.notificationRow,
                      {
                        borderColor: superTheme.border,
                        backgroundColor: isUnread
                          ? (isDark ? 'rgba(59, 130, 246, 0.06)' : '#f0f9ff')
                          : superTheme.cardBg,
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <View style={styles.timeRow}>
                          <Clock size={10} color={superTheme.textMuted} />
                          <Text style={[styles.timeText, { color: superTheme.textMuted }]}>
                            {item.createdOn ? new Date(item.createdOn).toLocaleString() : ''}
                          </Text>
                        </View>
                        {Boolean(resolveNotificationRoute(item)) && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Text style={{ fontSize: 10, color: superTheme.brand, fontWeight: '600' }}>View Details</Text>
                            <ChevronRight size={10} color={superTheme.brand} />
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
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
