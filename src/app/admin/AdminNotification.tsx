import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    StyleSheet,
    Platform,
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
    MessageSquare,
    DollarSign,
    User,
    Settings,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { NotificationService } from '../../Services/NotificationService';
import { Notification } from '../../authorization/models/Notification';

export default function AdminNotificationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const adminTheme = getAdminTheme(isDark);

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
            setUnreadCount(res.count || 0);
        } catch (err: any) {
            console.error('Failed to load notifications:', err);
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
                fetchNotifications(true);
            }
        } catch (err: any) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const getNotificationIcon = (title: string, message: string) => {
        const combined = (title + ' ' + message).toLowerCase();
        if (combined.includes('payment') || combined.includes('refund') || combined.includes('transaction') || combined.includes('invoice')) {
            return <DollarSign size={16} color="#10b981" />;
        }
        if (combined.includes('agent') || combined.includes('partner') || combined.includes('user')) {
            return <User size={16} color="#6366f1" />;
        }
        if (combined.includes('chat') || combined.includes('message') || combined.includes('bot')) {
            return <MessageSquare size={16} color="#0ea5e9" />;
        }
        if (combined.includes('system') || combined.includes('setting') || combined.includes('config')) {
            return <Settings size={16} color="#64748b" />;
        }
        return <Bell size={16} color="#f59e0b" />;
    };

    const hasUnread = unreadCount > 0;

    return (
        <View style={{ flex: 1, backgroundColor: adminTheme.primaryBg }}>
            {/* ── Inner Title Bar ── */}
            <View
                style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    minHeight: 52,
                    justifyContent: 'center',
                }}
            >
                {/* Centered Title */}
                <View
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ fontSize: 15, fontWeight: '700', color: adminTheme.textPrimary, textAlign: 'center' }}>
                        System Notifications
                    </Text>
                    {hasUnread && (
                        <Text style={{ fontSize: 11, color: adminTheme.textSecondary, marginTop: 1, textAlign: 'center' }}>
                            {unreadCount} unread alert{unreadCount > 1 ? 's' : ''}
                        </Text>
                    )}
                </View>

                {/* Right Action Button */}
                {hasUnread && (
                    <View style={{ alignSelf: 'flex-end', zIndex: 10 }}>
                        <TouchableOpacity
                            onPress={handleMarkAllRead}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                            }}
                        >
                            <CheckCheck size={13} color={adminTheme.brand} />
                            <Text style={{ color: adminTheme.brand, fontSize: 11, fontWeight: '700' }}>
                                Mark All Read
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* ── Content Container ── */}
            {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={adminTheme.brand} />
                    <Text style={{ marginTop: 12, color: adminTheme.textSecondary, fontSize: 12 }}>
                        Loading notification feed...
                    </Text>
                </View>
            ) : error ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <AlertCircle size={32} color="#ef4444" />
                    <Text style={{ marginTop: 12, fontSize: 14, fontWeight: '600', color: adminTheme.textPrimary, textAlign: 'center' }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={() => fetchNotifications()}
                        style={{
                            marginTop: 16,
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 8,
                            backgroundColor: adminTheme.brand,
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : notifications.length === 0 ? (
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchNotifications(true)}
                            colors={[adminTheme.brand]}
                            tintColor={adminTheme.brand}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <BellOff size={28} color={adminTheme.textSecondary} />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: adminTheme.textPrimary }}>
                        All caught up
                    </Text>
                    <Text style={{ fontSize: 12, color: adminTheme.textSecondary, textAlign: 'center', marginTop: 4 }}>
                        You do not have any new or archived notifications in your history.
                    </Text>
                </ScrollView>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchNotifications(true)}
                            colors={[adminTheme.brand]}
                            tintColor={adminTheme.brand}
                        />
                    }
                >
                    <View style={{ backgroundColor: adminTheme.cardBg }}>
                        {notifications.map((item, index) => {
                            const isUnread = index < unreadCount; // local approximation, or based on priority
                            return (
                                <View
                                    key={item.id || index}
                                    style={[
                                        styles.notificationRow,
                                        {
                                            borderColor: adminTheme.border,
                                            backgroundColor: isUnread
                                                ? (isDark ? 'rgba(16, 185, 129, 0.05)' : '#f0fdf4')
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
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: '700',
                                                    color: adminTheme.textPrimary,
                                                }}
                                            >
                                                {item.title}
                                            </Text>
                                            {isUnread && (
                                                <View
                                                    style={{
                                                        backgroundColor: adminTheme.brand,
                                                        paddingHorizontal: 6,
                                                        paddingVertical: 2,
                                                        borderRadius: 4,
                                                    }}
                                                >
                                                    <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '700' }}>
                                                        New
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: adminTheme.textSecondary,
                                                lineHeight: 16,
                                                marginVertical: 4,
                                            }}
                                        >
                                            {item.message}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Clock size={10} color={adminTheme.textMuted} />
                                            <Text style={{ fontSize: 9, color: adminTheme.textMuted }}>
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
    notificationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
