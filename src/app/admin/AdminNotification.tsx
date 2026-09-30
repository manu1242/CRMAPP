import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    StyleSheet,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Bell,
    BellOff,
    CheckCheck,
    Clock,
    AlertCircle,
    MessageSquare,
    DollarSign,
    User,
    Settings,
    Calendar,
    Phone,
    ChevronRight,
    Tag,
    Layers,
    FileText,
    Receipt,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { NotificationService } from '../../Services/NotificationService';
import { NotificationItem, TodayTaskItem } from '../../authorization/models/Notification';

export default function AdminNotificationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const adminTheme = getAdminTheme(isDark);

    const [activeTab, setActiveTab] = useState<'notifications' | 'tasks'>('notifications');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [tasks, setTasks] = useState<TodayTaskItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [taskCount, setTaskCount] = useState(0);
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
            setTasks(res.tasks || []);
            setUnreadCount(res.unreadCount || 0);
            setTaskCount(res.taskCount || (res.tasks ? res.tasks.length : 0));
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
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            }
        } catch (err: any) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const handleMarkSingleRead = async (item: NotificationItem) => {
        const notifId = item.notificationId || item.id;
        if (!notifId || item.isRead) return;

        try {
            await NotificationService.markAsRead(notifId);
            setNotifications((prev) =>
                prev.map((n) => ((n.notificationId || n.id) === notifId ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.warn('Failed to mark notification as read:', err);
        }
    };

    const handleNotificationClick = async (item: NotificationItem) => {
        await handleMarkSingleRead(item);

        if (item.link) {
            if (item.link.startsWith('http://') || item.link.startsWith('https://')) {
                Linking.openURL(item.link).catch(() => {});
                return;
            }
            // Route navigation based on entity or link
            if (item.relatedEntityType?.toLowerCase() === 'lead' && item.relatedEntityId) {
                router.push(`/admin/leads/${item.relatedEntityId}` as any);
                return;
            }
            if (item.link.includes('lead')) {
                router.push('/admin/leads' as any);
                return;
            }
            if (item.link.includes('quotation')) {
                router.push('/admin/salesunit/quotation' as any);
                return;
            }
            if (item.link.includes('invoice') || item.link.includes('payment')) {
                router.push('/admin/salesunit/payments' as any);
                return;
            }
        }
    };

    const getNotificationIcon = (type?: string, title: string = '', message: string = '') => {
        const combined = `${type || ''} ${title} ${message}`.toLowerCase();
        if (combined.includes('lead')) {
            return <User size={16} color="#3b82f6" />;
        }
        if (combined.includes('quotation')) {
            return <FileText size={16} color="#8b5cf6" />;
        }
        if (combined.includes('invoice') || combined.includes('payment') || combined.includes('booking')) {
            return <Receipt size={16} color="#10b981" />;
        }
        if (combined.includes('handover') || combined.includes('partner')) {
            return <Layers size={16} color="#f59e0b" />;
        }
        if (combined.includes('chat') || combined.includes('message')) {
            return <MessageSquare size={16} color="#0ea5e9" />;
        }
        if (combined.includes('system') || combined.includes('setting')) {
            return <Settings size={16} color="#64748b" />;
        }
        return <Bell size={16} color="#f59e0b" />;
    };

    const getPriorityBadge = (priority?: string) => {
        if (!priority) return null;
        const p = priority.toLowerCase();
        let bg = 'rgba(100, 116, 139, 0.15)';
        let color = '#64748b';

        if (p === 'high' || p === 'urgent') {
            bg = 'rgba(239, 68, 68, 0.15)';
            color = '#ef4444';
        } else if (p === 'normal' || p === 'medium') {
            bg = 'rgba(59, 130, 246, 0.15)';
            color = '#3b82f6';
        } else if (p === 'low') {
            bg = 'rgba(16, 185, 129, 0.15)';
            color = '#10b981';
        }

        return (
            <View style={{ backgroundColor: bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>{priority}</Text>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: adminTheme.primaryBg }}>
            {/* ── Inner Title Bar ── */}
            <View
                style={{
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <View>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: adminTheme.textPrimary }}>
                        Notification Center
                    </Text>
                    <Text style={{ fontSize: 11, color: adminTheme.textSecondary, marginTop: 1 }}>
                        {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''} • {taskCount} follow-up task{taskCount !== 1 ? 's' : ''}
                    </Text>
                </View>

                {unreadCount > 0 && (
                    <TouchableOpacity
                        onPress={handleMarkAllRead}
                        activeOpacity={0.7}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 16,
                        }}
                    >
                        <CheckCheck size={12} color={adminTheme.brand} />
                        <Text style={{ color: adminTheme.brand, fontSize: 11, fontWeight: '700' }}>
                            Mark All Read
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Tabs: Notifications vs Today's Follow-Up Tasks ── */}
            <View
                style={{
                    flexDirection: 'row',
                    marginHorizontal: 16,
                    marginVertical: 10,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderRadius: 10,
                    padding: 3,
                }}
            >
                <TouchableOpacity
                    onPress={() => setActiveTab('notifications')}
                    style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                        backgroundColor: activeTab === 'notifications' ? adminTheme.cardBg : 'transparent',
                        shadowColor: activeTab === 'notifications' ? '#000' : 'transparent',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: activeTab === 'notifications' ? 2 : 0,
                    }}
                >
                    <Bell size={13} color={activeTab === 'notifications' ? adminTheme.brand : adminTheme.textSecondary} />
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: activeTab === 'notifications' ? '700' : '500',
                            color: activeTab === 'notifications' ? adminTheme.textPrimary : adminTheme.textSecondary,
                        }}
                    >
                        Alerts
                    </Text>
                    {unreadCount > 0 && (
                        <View style={{ backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('tasks')}
                    style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                        backgroundColor: activeTab === 'tasks' ? adminTheme.cardBg : 'transparent',
                        shadowColor: activeTab === 'tasks' ? '#000' : 'transparent',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: activeTab === 'tasks' ? 2 : 0,
                    }}
                >
                    <Calendar size={13} color={activeTab === 'tasks' ? adminTheme.brand : adminTheme.textSecondary} />
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: activeTab === 'tasks' ? '700' : '500',
                            color: activeTab === 'tasks' ? adminTheme.textPrimary : adminTheme.textSecondary,
                        }}
                    >
                        Today's Tasks
                    </Text>
                    {taskCount > 0 && (
                        <View style={{ backgroundColor: adminTheme.brand, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{taskCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* ── Main List Container ── */}
            {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={adminTheme.brand} />
                    <Text style={{ marginTop: 12, color: adminTheme.textSecondary, fontSize: 12 }}>
                        Loading feed...
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
            ) : activeTab === 'notifications' ? (
                /* ── NOTIFICATIONS TAB ── */
                notifications.length === 0 ? (
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
                            You do not have any new or archived notifications.
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
                                const isUnread = item.isRead === false;
                                return (
                                    <TouchableOpacity
                                        key={item.id || item.notificationId || index}
                                        onPress={() => handleNotificationClick(item)}
                                        activeOpacity={0.7}
                                        style={[
                                            styles.notificationRow,
                                            {
                                                borderColor: adminTheme.border,
                                                backgroundColor: isUnread
                                                    ? (isDark ? 'rgba(16, 185, 129, 0.06)' : '#f0fdf4')
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
                                            {getNotificationIcon(item.type, item.title, item.message)}
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: '700',
                                                        color: adminTheme.textPrimary,
                                                        flex: 1,
                                                    }}
                                                >
                                                    {item.title}
                                                </Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    {getPriorityBadge(item.priority)}
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
                                                                NEW
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    color: adminTheme.textSecondary,
                                                    lineHeight: 17,
                                                    marginVertical: 4,
                                                }}
                                            >
                                                {item.message}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    <Clock size={10} color={adminTheme.textMuted} />
                                                    <Text style={{ fontSize: 10, color: adminTheme.textMuted }}>
                                                        {item.createdOnFormatted || (item.createdOn ? new Date(item.createdOn).toLocaleString() : '')}
                                                    </Text>
                                                </View>
                                                {item.link && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                                        <Text style={{ fontSize: 10, color: adminTheme.brand, fontWeight: '600' }}>View Details</Text>
                                                        <ChevronRight size={10} color={adminTheme.brand} />
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                )
            ) : (
                /* ── TODAY'S TASKS TAB ── */
                tasks.length === 0 ? (
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
                            <Calendar size={28} color={adminTheme.textSecondary} />
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: adminTheme.textPrimary }}>
                            No follow-ups scheduled for today
                        </Text>
                        <Text style={{ fontSize: 12, color: adminTheme.textSecondary, textAlign: 'center', marginTop: 4 }}>
                            All scheduled lead follow-up tasks for today are completed.
                        </Text>
                    </ScrollView>
                ) : (
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
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
                        {tasks.map((task, idx) => (
                            <View
                                key={task.followUpId || idx}
                                style={{
                                    backgroundColor: adminTheme.cardBg,
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 12,
                                    borderWidth: 1,
                                    borderColor: adminTheme.border,
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <User size={16} color={adminTheme.brand} />
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: adminTheme.textPrimary }}>
                                                {task.name}
                                            </Text>
                                            {task.stage && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                    <Tag size={10} color={adminTheme.textSecondary} />
                                                    <Text style={{ fontSize: 11, color: adminTheme.textSecondary, fontWeight: '600' }}>
                                                        {task.stage}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {task.followUpTime && (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                                borderRadius: 6,
                                            }}
                                        >
                                            <Clock size={11} color="#f59e0b" />
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#f59e0b' }}>
                                                {task.followUpTime}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Action bar */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        gap: 8,
                                        marginTop: 14,
                                        paddingTop: 12,
                                        borderTopWidth: 1,
                                        borderTopColor: adminTheme.border,
                                    }}
                                >
                                    {task.contact && (
                                        <TouchableOpacity
                                            onPress={() => Linking.openURL(`tel:${task.contact}`).catch(() => {})}
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                                paddingVertical: 8,
                                                borderRadius: 8,
                                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                                            }}
                                        >
                                            <Phone size={13} color="#3b82f6" />
                                            <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '700' }}>
                                                Call
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        onPress={() => {
                                            if (task.leadId || task.encodedId) {
                                                router.push(`/admin/leads/${task.encodedId || task.leadId}` as any);
                                            } else {
                                                router.push('/admin/leads' as any);
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                            paddingVertical: 8,
                                            borderRadius: 8,
                                            backgroundColor: adminTheme.brand,
                                        }}
                                    >
                                        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                                            Open Lead
                                        </Text>
                                        <ChevronRight size={13} color="#ffffff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )
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
