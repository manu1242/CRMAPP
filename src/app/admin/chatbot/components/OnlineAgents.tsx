import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { ChatbotAgent } from '../../../../admin/services/ChatbotDashboardService';

interface OnlineAgentsProps {
  agents: ChatbotAgent[];
}

export default function OnlineAgents({ agents }: OnlineAgentsProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandColor = adminTheme.brand || '#3b82f6';

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return '#10b981';
      case 'busy':
        return '#ef4444';
      default:
        return subTextColor;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: borderCol }]}>
      <Text style={[styles.headerTitle, { color: brandColor }]}>Online Agents</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={[styles.tableHeader, { borderBottomColor: borderCol, backgroundColor: isDark ? '#18181b' : '#f8fafc' }]}>
            <Text style={[styles.headerCell, { width: 140, color: textColor }]}>Agent Name</Text>
            <Text style={[styles.headerCell, { width: 100, color: textColor }]}>Status</Text>
            <Text style={[styles.headerCell, { width: 100, color: textColor, textAlign: 'center' }]}>Current Chats</Text>
            <Text style={[styles.headerCell, { width: 100, color: textColor, textAlign: 'center' }]}>Max Chats</Text>
            <Text style={[styles.headerCell, { width: 120, color: textColor, textAlign: 'right' }]}>Avg Response Time</Text>
          </View>

          {/* Table Body */}
          {agents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: subTextColor }]}>
                No agents online
              </Text>
            </View>
          ) : (
            agents.map((agent, index) => (
              <View key={agent.agentId || index} style={[styles.tableRow, { borderBottomColor: borderCol }]}>
                {/* Agent Name */}
                <Text style={[styles.cell, { width: 140, color: textColor, fontWeight: '600' }]} numberOfLines={1}>
                  {agent.agentName}
                </Text>

                {/* Status */}
                <View style={{ width: 100, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getStatusColor(agent.status) }} />
                  <Text style={[styles.cell, { color: textColor }]}>
                    {agent.status}
                  </Text>
                </View>

                {/* Current Chats */}
                <Text style={[styles.cell, { width: 100, color: textColor, textAlign: 'center' }]}>
                  {agent.currentChats}
                </Text>

                {/* Max Chats */}
                <Text style={[styles.cell, { width: 100, color: textColor, textAlign: 'center' }]}>
                  {agent.maxChats}
                </Text>

                {/* Avg Response Time */}
                <Text style={[styles.cell, { width: 120, color: textColor, textAlign: 'right' }]}>
                  {agent.avgResponseTime ? `${agent.avgResponseTime}s` : 'N/A'}
                </Text>
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
    minWidth: 560,
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
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
