import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Sparkles,
  Users,
  MapPin,
  CheckCircle2,
  FileSpreadsheet,
  Send,
  Scale,
  Award,
  Flame,
  ThermometerSun,
  Snowflake,
  Clock,
  XCircle,
  HelpCircle,
} from 'lucide-react-native';

interface LeadStatusBadgeProps {
  value?: string | null;
  type?: 'status' | 'stage';
  size?: 'sm' | 'md';
}

const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  New: { label: 'New', bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)', icon: Sparkles },
  'Office Meeting': { label: 'Office Meeting', bg: 'rgba(168, 85, 247, 0.12)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)', icon: Users },
  'Site Visit Requested': { label: 'Visit Requested', bg: 'rgba(234, 179, 8, 0.12)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)', icon: Clock },
  'Site Visit Done': { label: 'Visit Done', bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)', icon: MapPin },
  Quotation: { label: 'Quotation', bg: 'rgba(14, 165, 233, 0.12)', text: '#0ea5e9', border: 'rgba(14, 165, 233, 0.3)', icon: FileSpreadsheet },
  'Quotation Sent': { label: 'Quotation Sent', bg: 'rgba(99, 102, 241, 0.12)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.3)', icon: Send },
  Negotiation: { label: 'Negotiation', bg: 'rgba(249, 115, 22, 0.12)', text: '#f97316', border: 'rgba(249, 115, 22, 0.3)', icon: Scale },
  Booked: { label: 'Booked', bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', border: '#10b981', icon: Award },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  Active: { label: 'Active', bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)', icon: CheckCircle2 },
  Hot: { label: 'Hot', bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)', icon: Flame },
  Warm: { label: 'Warm', bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)', icon: ThermometerSun },
  Cold: { label: 'Cold', bg: 'rgba(100, 116, 139, 0.12)', text: '#64748b', border: 'rgba(100, 116, 139, 0.3)', icon: Snowflake },
  'Follow Up': { label: 'Follow Up', bg: 'rgba(234, 179, 8, 0.12)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)', icon: Clock },
  Interested: { label: 'Interested', bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)', icon: CheckCircle2 },
  'Not Interested': { label: 'Not Interested', bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)', icon: XCircle },
  Converted: { label: 'Converted', bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)', icon: Award },
  Closed: { label: 'Closed', bg: 'rgba(100, 116, 139, 0.12)', text: '#64748b', border: 'rgba(100, 116, 139, 0.3)', icon: CheckCircle2 },
  Lost: { label: 'Lost', bg: 'rgba(220, 38, 38, 0.15)', text: '#dc2626', border: 'rgba(220, 38, 38, 0.3)', icon: XCircle },
};

export default function LeadStatusBadge({ value, type = 'status', size = 'sm' }: LeadStatusBadgeProps) {
  if (!value) return null;

  const configMap = type === 'stage' ? STAGE_CONFIG : STATUS_CONFIG;
  const match = configMap[value] || {
    label: value,
    bg: 'rgba(148, 163, 184, 0.12)',
    text: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.25)',
    icon: HelpCircle,
  };

  const IconComponent = match.icon;
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: match.bg,
          borderColor: match.border,
          paddingHorizontal: isSm ? 8 : 10,
          paddingVertical: isSm ? 3 : 5,
        },
      ]}
    >
      <IconComponent size={isSm ? 11 : 13} color={match.text} />
      <Text style={[styles.text, { color: match.text, fontSize: isSm ? 11 : 12 }]}>
        {match.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

