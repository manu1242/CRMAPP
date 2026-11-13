import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { SalesPipelineStageGroup } from '../models/SalesPipelineTypes';

interface PipelineOverviewProps {
  stages: SalesPipelineStageGroup[];
  selectedStage: string | null;
  onSelectStage: (stage: string | null) => void;
  totalLeads?: number;
}

export default function PipelineOverview({
  stages,
  selectedStage,
  onSelectStage,
  totalLeads = 0,
}: PipelineOverviewProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandCol = adminTheme.brand;

  const total = totalLeads || stages.reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* All Stages Pill */}
        <TouchableOpacity
          style={[
            styles.pill,
            { backgroundColor: cardBg, borderColor: selectedStage === null ? brandCol : borderCol },
            selectedStage === null && { backgroundColor: `${brandCol}15` },
          ]}
          onPress={() => onSelectStage(null)}
        >
          <Text style={[styles.stageLabel, { color: selectedStage === null ? brandCol : textColor }]}>
            All Deals
          </Text>
          <View style={[styles.countBadge, { backgroundColor: selectedStage === null ? brandCol : borderCol }]}>
            <Text style={[styles.countText, { color: selectedStage === null ? '#fff' : subTextColor }]}>
              {total}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Individual Stage Pills */}
        {stages.map((st) => {
          const isSelected = selectedStage === st.stage;
          return (
            <TouchableOpacity
              key={st.stage}
              style={[
                styles.pill,
                { backgroundColor: cardBg, borderColor: isSelected ? brandCol : borderCol },
                isSelected && { backgroundColor: `${brandCol}15` },
              ]}
              onPress={() => onSelectStage(isSelected ? null : st.stage)}
            >
              <Text
                style={[
                  styles.stageLabel,
                  { color: isSelected ? brandCol : textColor, fontWeight: isSelected ? '700' : '500' },
                ]}
              >
                {st.stage}
              </Text>
              <View style={[styles.countBadge, { backgroundColor: isSelected ? brandCol : borderCol }]}>
                <Text style={[styles.countText, { color: isSelected ? '#fff' : subTextColor }]}>
                  {st.count || 0}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  stageLabel: {
    fontSize: 12,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

