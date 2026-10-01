import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  usePublicLeadDetailQuery,
  useDeletePublicLeadMutation,
} from '../hooks/usePublicLeads';
import { getTypeColor } from './PublicLeadCard';

interface PublicLeadDetailContentProps {
  id: string | number;
}

export const PublicLeadDetailContent: React.FC<PublicLeadDetailContentProps> = ({ id }) => {
  const router = useRouter();
  const { isDark } = useTheme();

  const { data, isLoading, isError, refetch } = usePublicLeadDetailQuery(id);
  const deleteMutation = useDeletePublicLeadMutation();

  const lead = data?.data;

  // Colors
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#e2e8f0';

  const typeConfig = getTypeColor(lead?.type || 'Enquiry', isDark);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not Specified';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleCall = () => {
    if (lead?.phone) {
      Linking.openURL(`tel:${lead.phone}`).catch(() => {});
    }
  };

  const handleSms = () => {
    if (lead?.phone) {
      Linking.openURL(`sms:${lead.phone}`).catch(() => {});
    }
  };

  const handleWhatsApp = () => {
    if (lead?.phone) {
      const cleanPhone = lead.phone.replace(/\D/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      Linking.openURL(`https://wa.me/${fullPhone}`).catch(() => {});
    }
  };

  const handleDelete = () => {
    if (!lead) return;
    Alert.alert(
      'Delete Public Lead',
      `Are you sure you want to permanently delete lead #${lead.leadId} for "${lead.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync(lead.leadId);
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Loading lead details...</Text>
      </View>
    );
  }

  if (isError || !lead) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: bgColor }]}>
        <Ionicons name="alert-circle-outline" size={44} color="#ef4444" />
        <Text style={styles.errorTitle}>Lead Not Found</Text>
        <Text style={[styles.errorDesc, { color: subTextColor }]}>
          Unable to fetch details for lead ID #{id}.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top App Bar */}
      <View style={[styles.appBar, { borderBottomColor: borderCol }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.appBarTitle, { color: textColor }]}>Lead #{lead.leadId}</Text>
          <Text style={[styles.appBarSubtitle, { color: subTextColor }]}>Public Lead & Inquiry</Text>
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
          style={styles.deleteHeaderBtn}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Customer Header Hero Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.heroRow}>
            <View style={[styles.avatarBox, { backgroundColor: typeConfig.bg }]}>
              <Ionicons name={typeConfig.icon} size={24} color={typeConfig.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroName, { color: textColor }]}>{lead.name}</Text>
              <Text style={[styles.heroPhone, { color: subTextColor }]}>{lead.phone}</Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: typeConfig.bg, borderColor: typeConfig.border },
                  ]}
                >
                  <Text style={[styles.typeBadgeText, { color: typeConfig.text }]}>
                    {lead.type || 'Enquiry'}
                  </Text>
                </View>
                {lead.status ? (
                  <View style={[styles.statusBadge, { borderColor: borderCol }]}>
                    <Text style={[styles.statusBadgeText, { color: textColor }]}>{lead.status}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Direct Action Buttons */}
          <View style={[styles.actionsRow, { borderTopColor: borderCol }]}>
            <TouchableOpacity onPress={handleCall} style={[styles.actionBtn, styles.callBtn]}>
              <Ionicons name="call" size={15} color="#ffffff" />
              <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleWhatsApp} style={[styles.actionBtn, styles.waBtn]}>
              <FontAwesome5 name="whatsapp" size={15} color="#ffffff" />
              <Text style={styles.actionBtnText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSms} style={[styles.actionBtn, styles.smsBtn]}>
              <Ionicons name="chatbubble-ellipses" size={15} color="#ffffff" />
              <Text style={styles.actionBtnText}>SMS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color="#2563eb" />
            <Text style={[styles.cardTitle, { color: textColor }]}>Inquiry Message</Text>
          </View>
          <View
            style={[
              styles.messageContainer,
              { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: borderCol },
            ]}
          >
            <Text style={[styles.messageText, { color: textColor }]}>
              {lead.message || 'No message provided with this lead.'}
            </Text>
          </View>
        </View>

        {/* Attribution & Entity Details Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="business-outline" size={18} color="#8b5cf6" />
            <Text style={[styles.cardTitle, { color: textColor }]}>Attribution & Property</Text>
          </View>

          <View style={styles.infoGrid}>
            {/* Tenant / Company */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: subTextColor }]}>Tenant / Company</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {lead.tenantName || 'N/A'} {lead.tenantId ? `(ID: ${lead.tenantId})` : ''}
              </Text>
            </View>

            {/* Property */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: subTextColor }]}>Property</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {lead.propertyName || 'N/A'} {lead.propertyId ? `(ID: ${lead.propertyId})` : ''}
              </Text>
            </View>

            {/* Assigned Agent */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: subTextColor }]}>Assigned Agent</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {lead.agentName || 'Central Team'} {lead.agentId ? `(ID: ${lead.agentId})` : ''}
              </Text>
            </View>

            {/* Support */}
            {lead.support ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: subTextColor }]}>Support</Text>
                <Text style={[styles.infoValue, { color: textColor }]}>{lead.support}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Action & Schedule Details Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={18} color="#f59e0b" />
            <Text style={[styles.cardTitle, { color: textColor }]}>Schedule & Actions</Text>
          </View>

          <View style={styles.infoGrid}>
            {/* Callback Requested */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: subTextColor }]}>Callback Requested</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons
                  name={lead.callbackRequested ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={lead.callbackRequested ? '#10b981' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: lead.callbackRequested ? '#10b981' : subTextColor,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {lead.callbackRequested ? 'Yes, Callback Requested' : 'No'}
                </Text>
              </View>
            </View>

            {/* Scheduled Site Visit Date */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: subTextColor }]}>Site Visit Date</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: lead.siteVisitDate ? '#8b5cf6' : textColor,
                    fontWeight: lead.siteVisitDate ? '700' : '400',
                  },
                ]}
              >
                {formatDate(lead.siteVisitDate)}
              </Text>
            </View>

            {/* Latest Action */}
            {lead.latestAction ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: subTextColor }]}>Latest Action</Text>
                <Text style={[styles.infoValue, { color: textColor }]}>{lead.latestAction}</Text>
              </View>
            ) : null}

            {/* Created On */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: subTextColor }]}>Created On</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {formatDate(lead.createdOn)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ef4444',
  },
  errorDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: 6,
  },
  appBarTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  appBarSubtitle: {
    fontSize: 11,
  },
  deleteHeaderBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  callBtn: {
    backgroundColor: '#2563eb',
  },
  waBtn: {
    backgroundColor: '#10b981',
  },
  smsBtn: {
    backgroundColor: '#8b5cf6',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  messageContainer: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    gap: 3,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
