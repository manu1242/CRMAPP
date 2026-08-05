import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { ChatbotConversation } from '../../../../admin/services/ChatbotDashboardService';
import { MessageCircle, UserPlus, Info } from 'lucide-react-native';

interface ActiveConversationsProps {
  conversations: ChatbotConversation[];
  onViewChat: (conversationId: string) => void;
  onAssignChat: (conversationId: string) => void;
}

export default function ActiveConversations({
  conversations,
  onViewChat,
  onAssignChat,
}: ActiveConversationsProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandColor = adminTheme.brand || '#3b82f6';

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return subTextColor;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return brandColor;
      case 'unassigned':
        return '#f59e0b';
      case 'closed':
        return '#71717a';
      default:
        return textColor;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: borderCol }]}>
      <Text style={[styles.headerTitle, { color: brandColor }]}>All Active Conversations</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={[styles.tableHeader, { borderBottomColor: borderCol, backgroundColor: isDark ? '#18181b' : '#f8fafc' }]}>
            <Text style={[styles.headerCell, { width: 120, color: textColor }]}>Conversation ID</Text>
            <Text style={[styles.headerCell, { width: 120, color: textColor }]}>Assigned Agent</Text>
            <Text style={[styles.headerCell, { width: 100, color: textColor }]}>Status</Text>
            <Text style={[styles.headerCell, { width: 80, color: textColor }]}>Priority</Text>
            <Text style={[styles.headerCell, { width: 120, color: textColor }]}>Last Activity</Text>
            <Text style={[styles.headerCell, { width: 100, color: textColor, textAlign: 'center' }]}>Action</Text>
          </View>

          {/* Table Body */}
          {conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: subTextColor }]}>
                No active conversations in the system
              </Text>
            </View>
          ) : (
            conversations.map((item) => (
              <View key={item.conversationId} style={[styles.tableRow, { borderBottomColor: borderCol }]}>
                {/* Conversation ID */}
                <Text style={[styles.cell, { width: 120, color: textColor }]} numberOfLines={1}>
                  {item.conversationId.substring(0, 8)}...
                </Text>

                {/* Assigned Agent */}
                <Text style={[styles.cell, { width: 120, color: textColor }]} numberOfLines={1}>
                  {item.assignedAgentName || 'Unassigned'}
                </Text>

                {/* Status */}
                <View style={{ width: 100, justifyContent: 'center' }}>
                  <Text style={[styles.badgeText, { color: getStatusColor(item.status), fontWeight: '700' }]}>
                    {item.status}
                  </Text>
                </View>

                {/* Priority */}
                <View style={{ width: 80, justifyContent: 'center' }}>
                  <Text style={[styles.badgeText, { color: getPriorityColor(item.priority), fontWeight: '700' }]}>
                    {item.priority}
                  </Text>
                </View>

                {/* Last Activity */}
                <Text style={[styles.cell, { width: 120, color: subTextColor }]}>
                  {item.lastActivity ? new Date(item.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </Text>

                {/* Actions */}
                <View style={[styles.actionCell, { width: 100 }]}>
                  <TouchableOpacity
                    onPress={() => onViewChat(item.conversationId)}
                    style={[styles.actionBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                    activeOpacity={0.7}
                  >
                    <MessageCircle size={14} color={brandColor} />
                  </TouchableOpacity>

                  {item.status.toLowerCase() === 'unassigned' && (
                    <TouchableOpacity
                      onPress={() => onAssignChat(item.conversationId)}
                      style={[styles.actionBtn, { backgroundColor: isDark ? '#311242' : '#f3e8ff' }]}
                      activeOpacity={0.7}
                    >
                      <UserPlus size={14} color="#8b5cf6" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  tableScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tableContainer: {
    minWidth: 640,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  cell: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 11,
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 6,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
