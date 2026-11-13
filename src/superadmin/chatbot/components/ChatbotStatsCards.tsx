import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MessageSquare, Zap, UserCheck, CalendarCheck } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import { ChatbotStats } from '../models/chatbot';

interface ChatbotStatsCardsProps {
  stats?: ChatbotStats;
}

export const ChatbotStatsCards: React.FC<ChatbotStatsCardsProps> = ({ stats }) => {
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);

  const totalCount = stats?.totalCount ?? 0;
  const totalActive = stats?.totalActive ?? 0;
  const activePercent = stats?.activePercent ?? 0;
  const totalLeads = stats?.totalLeads ?? 0;
  const leadsPercent = stats?.leadsPercent ?? 0;
  const todayChats = stats?.todayChats ?? 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* 1. Total Chats */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isDark ? 'rgba(131, 92, 238, 0.15)' : 'rgba(131, 92, 238, 0.1)' },
          ]}
        >
          <MessageSquare size={17} color={isDark ? '#835CEE' : '#835CEE'} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.label, { color: theme.textMuted }]}>TOTAL CHATS</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{totalCount}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>All sessions</Text>
        </View>
      </View>

      {/* 2. Active Sessions */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' },
          ]}
        >
          <Zap size={17} color="#10b981" />
        </View>
        <View style={styles.info}>
          <Text style={[styles.label, { color: theme.textMuted }]}>ACTIVE CHATS</Text>
          <Text style={[styles.value, { color: '#10b981' }]}>{totalActive}</Text>
          <Text style={[styles.sub, { color: '#10b981' }]}>{activePercent}% active</Text>
        </View>
      </View>

      {/* 3. Leads Generated */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)' },
          ]}
        >
          <UserCheck size={17} color="#f59e0b" />
        </View>
        <View style={styles.info}>
          <Text style={[styles.label, { color: theme.textMuted }]}>LEADS CAPTURED</Text>
          <Text style={[styles.value, { color: '#f59e0b' }]}>{totalLeads}</Text>
          <Text style={[styles.sub, { color: '#f59e0b' }]}>{leadsPercent}% converted</Text>
        </View>
      </View>

      {/* 4. Today's Chats */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)' },
          ]}
        >
          <CalendarCheck size={17} color="#8b5cf6" />
        </View>
        <View style={styles.info}>
          <Text style={[styles.label, { color: theme.textMuted }]}>TODAY'S CHATS</Text>
          <Text style={[styles.value, { color: theme.textPrimary }]}>{todayChats}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>Since midnight</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 10,
    marginBottom: 12,
  },
  card: {
    minWidth: 154,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 1,
  },
  sub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
});
