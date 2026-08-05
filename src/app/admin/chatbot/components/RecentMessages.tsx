import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { ChatbotMessage } from '../../../../admin/services/ChatbotDashboardService';
import { MessageSquare, Bot, User, UserCog } from 'lucide-react-native';

interface RecentMessagesProps {
  messages: ChatbotMessage[];
}

export default function RecentMessages({ messages }: RecentMessagesProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandColor = adminTheme.brand || '#3b82f6';
  const inputBg = adminTheme.inputBg || (isDark ? '#1e293b' : '#f8fafc');

  const getSenderIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'bot':
        return <Bot size={16} color="#10b981" />;
      case 'agent':
        return <UserCog size={16} color={brandColor} />;
      default:
        return <User size={16} color="#6366f1" />;
    }
  };

  const getSenderBg = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'bot':
        return isDark ? '#10b98115' : '#10b9810d';
      case 'agent':
        return isDark ? '#3b82f615' : '#3b82f60d';
      default:
        return isDark ? '#6366f115' : '#6366f10d';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: borderCol }]}>
      <Text style={[styles.headerTitle, { color: brandColor }]}>Recent Messages</Text>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: subTextColor }]}>
            No recent messages
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {messages.slice(0, 5).map((msg, index) => (
            <View
              key={msg.id || index}
              style={[
                styles.listItem,
                {
                  borderBottomColor: index === messages.length - 1 ? 'transparent' : borderCol,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: getSenderBg(msg.messageType),
                  },
                ]}
              >
                {getSenderIcon(msg.messageType)}
              </View>

              <View style={styles.contentWrapper}>
                <View style={styles.row}>
                  <Text style={[styles.senderName, { color: textColor }]}>
                    {msg.senderName}
                  </Text>
                  <Text style={[styles.time, { color: subTextColor }]}>
                    {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </Text>
                </View>
                <Text style={[styles.messageText, { color: subTextColor }]} numberOfLines={1}>
                  {msg.messageText}
                </Text>
              </View>
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
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
  },
  time: {
    fontSize: 10,
  },
  messageText: {
    fontSize: 12,
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
