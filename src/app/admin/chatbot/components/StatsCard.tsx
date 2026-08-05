import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<any>;
  color: string; // The primary color of the text/badge
  isDarkTheme?: boolean;
}

export default function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const borderCol = adminTheme.border;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: borderCol,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={[styles.title, { color }]}>{title.toUpperCase()}</Text>
          <Text style={[styles.value, { color: textColor }]}>{value}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Icon size={24} color={isDark ? '#e4e4e7' : '#18181b'} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
  iconContainer: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
