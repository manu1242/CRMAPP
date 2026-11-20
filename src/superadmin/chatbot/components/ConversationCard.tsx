import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle, Sparkles, ChevronRight, Clock, Phone, Mail } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import { ChatSessionItem } from '../models/chatbot';

interface ConversationCardProps {
  item: ChatSessionItem;
  onPress: (item: ChatSessionItem) => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({ item, onPress }) => {
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);

  const displayName = item.userName?.trim()
    ? item.userName
    : `Visitor #${item.sessionGuid ? item.sessionGuid.substring(0, 8) : item.sessionId}`;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'V';

  const isActive = item.status === 'Active';

  // Format date
  const formatTime = (isoString?: string) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(item)}
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: isActive
                ? isDark
                  ? 'rgba(131, 92, 238, 0.2)'
                  : 'rgba(131, 92, 238, 0.1)'
                : isDark
                  ? '#242424'
                  : '#f4f4f5',
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: isActive ? (isDark ? '#835CEE' : '#835CEE') : theme.textMuted },
            ]}
          >
            {initials}
          </Text>
        </View>

        {/* Name and Contact */}
        <View style={styles.nameBlock}>
          <View style={styles.titleRow}>
            <Text
              numberOfLines={1}
              style={[styles.nameText, { color: theme.textPrimary }]}
            >
              {displayName}
            </Text>
            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isActive
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(16, 185, 129, 0.12)'
                    : isDark
                      ? 'rgba(148, 163, 184, 0.2)'
                      : 'rgba(148, 163, 184, 0.12)',
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? '#10b981' : theme.textMuted },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isActive ? '#10b981' : theme.textMuted },
                ]}
              >
                {isActive ? 'Active' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Subtitle / Phone / Email */}
          <View style={styles.contactRow}>
            {item.userPhone ? (
              <View style={styles.contactItem}>
                <Phone size={11} color={theme.textMuted} />
                <Text numberOfLines={1} style={[styles.contactText, { color: theme.textSecondary }]}>
                  {item.userPhone}
                </Text>
              </View>
            ) : item.userEmail ? (
              <View style={styles.contactItem}>
                <Mail size={11} color={theme.textMuted} />
                <Text numberOfLines={1} style={[styles.contactText, { color: theme.textSecondary }]}>
                  {item.userEmail}
                </Text>
              </View>
            ) : (
              <Text style={[styles.contactText, { color: theme.textMuted }]}>
                Website Guest
              </Text>
            )}
          </View>
        </View>

        <ChevronRight size={18} color={theme.textMuted} />
      </View>

      {/* Footer row: Badges, Intent, Time, and Message Count */}
      <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
        <View style={styles.badgeGroup}>
          {item.isLeadGenerated && (
            <View
              style={[
                styles.leadBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.18)'
                    : 'rgba(245, 158, 11, 0.12)',
                  borderColor: isDark ? '#b45309' : '#f59e0b',
                },
              ]}
            >
              <Sparkles size={10} color="#f59e0b" />
              <Text style={styles.leadBadgeText}>Lead Captured</Text>
            </View>
          )}

          {item.lastIntent ? (
            <View
              style={[
                styles.intentBadge,
                {
                  backgroundColor: isDark ? 'rgba(131, 92, 238, 0.12)' : 'rgba(131, 92, 238, 0.08)',
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.intentText, { color: isDark ? '#a78bfa' : '#835CEE' }]}
              >
                {item.lastIntent}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metaGroup}>
          <View style={styles.metaItem}>
            <MessageCircle size={11} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {item.messageCount}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={11} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {formatTime(item.startedAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 11.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  leadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  leadBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#f59e0b',
  },
  intentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 120,
  },
  intentText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
});

