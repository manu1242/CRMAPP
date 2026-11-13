import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Phone, MapPin, ChevronRight, MessageSquare, ArrowRightLeft } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { LeadItem } from '../models/LeadTypes';
import LeadStatusBadge from './LeadStatusBadge';

interface PipelineStageCardProps {
  lead: LeadItem;
  onMoveStage?: (lead: LeadItem) => void;
}

export default function PipelineStageCard({ lead, onMoveStage }: PipelineStageCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

  const cleanPhone = (lead.phone || '').replace(/[^0-9+]/g, '');

  const handleCall = (e: any) => {
    e?.stopPropagation();
    if (cleanPhone) Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleWhatsApp = (e: any) => {
    e?.stopPropagation();
    if (cleanPhone) {
      const num = cleanPhone.startsWith('+') ? cleanPhone.replace('+', '') : `91${cleanPhone}`;
      Linking.openURL(`whatsapp://send?phone=${num}&text=Hello%20${encodeURIComponent(lead.fullName || lead.name || 'there')}`);
    }
  };

  const requirementText = [lead.type, lead.bhk, lead.propertyType].filter(Boolean).join(' · ') || lead.requirement;
  const agentName = lead.assignedToAgentName || (lead.assignedToAgentId ? `Agent #${lead.assignedToAgentId}` : 'Unassigned');

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/admin/leads/${lead.leadId}`)}
      style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
            {lead.fullName || lead.name || 'Unnamed Lead'}
          </Text>
          <Text style={[styles.leadMeta, { color: subTextColor }]}>
            #{lead.leadId} · {lead.source || 'Direct'}
          </Text>
        </View>
        <LeadStatusBadge value={lead.status || 'Active'} type="status" size="sm" />
      </View>

      {/* Requirement / Location */}
      {requirementText || lead.preferredLocation ? (
        <View style={styles.requirementBox}>
          {requirementText ? (
            <Text style={[styles.requirementText, { color: textColor }]} numberOfLines={1}>
              {requirementText}
            </Text>
          ) : null}
          {lead.preferredLocation ? (
            <View style={styles.detailRow}>
              <MapPin size={11} color={subTextColor} />
              <Text style={[styles.detailText, { color: subTextColor }]} numberOfLines={1}>
                {lead.preferredLocation}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Agent & Actions Footer */}
      <View style={[styles.footer, { borderTopColor: borderCol }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
          <User size={12} color={brandCol} />
          <Text style={[styles.agentText, { color: subTextColor }]} numberOfLines={1}>
            {agentName}
          </Text>
        </View>

        <View style={styles.actionGroup}>
          {cleanPhone ? (
            <>
              <TouchableOpacity
                onPress={handleCall}
                style={[styles.iconBtn, { backgroundColor: inputBg, borderColor: borderCol }]}
              >
                <Phone size={12} color={brandCol} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleWhatsApp}
                style={[styles.iconBtn, { backgroundColor: '#10b98115', borderColor: '#10b98140' }]}
              >
                <MessageSquare size={12} color="#10b981" />
              </TouchableOpacity>
            </>
          ) : null}

          {onMoveStage ? (
            <TouchableOpacity
              style={[styles.moveBtn, { backgroundColor: inputBg, borderColor: borderCol }]}
              onPress={(e) => {
                e.stopPropagation();
                onMoveStage(lead);
              }}
            >
              <ArrowRightLeft size={11} color={brandCol} />
              <Text style={[styles.moveBtnText, { color: brandCol }]}>Move</Text>
            </TouchableOpacity>
          ) : null}

          <ChevronRight size={14} color={subTextColor} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  leadMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  requirementBox: {
    marginVertical: 8,
    gap: 4,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
  },
  agentText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  moveBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
