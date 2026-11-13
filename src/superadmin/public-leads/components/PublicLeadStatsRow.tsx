import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Layers, Mail, PhoneCall, Calendar, LifeBuoy } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import { PublicLeadStats } from '../models/publicLead';

interface PublicLeadStatsRowProps {
  stats?: PublicLeadStats;
  totalFallback?: number;
  selectedType: string;
  onSelectType: (type: string) => void;
}

export const PublicLeadStatsRow: React.FC<PublicLeadStatsRowProps> = ({
  stats,
  totalFallback = 0,
  selectedType,
  onSelectType,
}) => {
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);

  const kpis = [
    {
      key: 'All',
      label: 'TOTAL LEADS',
      count: stats?.totalLeads ?? totalFallback,
      color: '#835CEE',
      bgColor: isDark ? 'rgba(131, 92, 238, 0.15)' : 'rgba(131, 92, 238, 0.1)',
      icon: Layers,
    },
    {
      key: 'Enquiry',
      label: 'ENQUIRIES',
      count: stats?.totalEnquiries ?? 0,
      color: '#06b6d4',
      bgColor: isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.1)',
      icon: Mail,
    },
    {
      key: 'Callback',
      label: 'CALLBACKS',
      count: stats?.totalCallbacks ?? 0,
      color: '#f59e0b',
      bgColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
      icon: PhoneCall,
    },
    {
      key: 'SiteVisit',
      label: 'SITE VISITS',
      count: stats?.totalSiteVisits ?? 0,
      color: '#8b5cf6',
      bgColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
      icon: Calendar,
    },
    {
      key: 'Support',
      label: 'SUPPORT',
      count: stats?.totalSupport ?? 0,
      color: '#10b981',
      bgColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      icon: LifeBuoy,
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {kpis.map((item) => {
        const isSelected = selectedType === item.key;
        const IconComponent = item.icon;

        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.8}
            onPress={() => onSelectType(item.key)}
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBg,
                borderColor: isSelected ? item.color : theme.border,
                borderWidth: isSelected ? 1.5 : 1,
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.25 : 0.04,
              },
            ]}
          >
            {/* Left Accent Color Bar */}
            <View style={[styles.colorBar, { backgroundColor: item.color }]} />

            {/* Info Column */}
            <View style={styles.infoCol}>
              <Text
                style={[
                  styles.label,
                  { color: isSelected ? item.color : theme.textSecondary },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              <Text style={[styles.val, { color: theme.textPrimary }]}>
                {item.count}
              </Text>
            </View>

            {/* Icon Bubble */}
            <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
              <IconComponent size={16} color={item.color} />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 10,
  },
  card: {
    minWidth: 145,
    height: 64,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  colorBar: {
    width: 4,
    height: '100%',
  },
  infoCol: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  label: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  val: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});

