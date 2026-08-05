import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { ChatbotNotification } from '../../../../admin/services/ChatbotDashboardService';
import { Bell, Info } from 'lucide-react-native';

interface NotificationsListProps {
  notifications: ChatbotNotification[];
}

export default function NotificationsList({ notifications }: NotificationsListProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandColor = adminTheme.brand || '#3b82f6';

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: borderCol }]}>
      <Text style={[styles.headerTitle, { color: brandColor }]}>Notifications</Text>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: subTextColor }]}>
            No unread notifications
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {notifications.slice(0, 5).map((noti, index) => (
            <View
              key={noti.notificationId || index}
              style={[
                styles.listItem,
                {
                  borderBottomColor: index === notifications.length - 1 ? 'transparent' : borderCol,
                },
              ]}
            >
              <View style={styles.bellIcon}>
                <Bell size={14} color="#ef4444" />
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.titleText, { color: textColor }]}>
                  {noti.title}
                </Text>
                <Text style={[styles.descText, { color: subTextColor }]}>
                  {noti.message}
                </Text>
              </View>

              <Text style={[styles.timeText, { color: subTextColor }]}>
                {noti.sentAt ? new Date(noti.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  list: {
    gap: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  bellIcon: {
    marginTop: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef444415',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  descText: {
    fontSize: 11,
  },
  timeText: {
    fontSize: 10,
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
