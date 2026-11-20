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
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Trash2,
  Building2,
  Home,
  UserCheck,
  Calendar,
  PhoneCall,
  Clock,
  CheckCircle2,
  XCircle,
  LifeBuoy,
  AlertCircle,
  Mail,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import {
  usePublicLeadDetailQuery,
  useDeletePublicLeadMutation,
} from '../hooks/usePublicLeads';
import { getTypeBadgeConfig } from './PublicLeadCard';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';

interface PublicLeadDetailContentProps {
  id: string | number;
}

export const PublicLeadDetailContent: React.FC<PublicLeadDetailContentProps> = ({ id }) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  const { data, isLoading, isError } = usePublicLeadDetailQuery(id);
  const deleteMutation = useDeletePublicLeadMutation();

  const lead = data?.data;
  const typeConfig = getTypeBadgeConfig(lead?.type || 'Enquiry', isDark);
  const TypeIcon = typeConfig.icon;

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

  const getInitials = (name?: string) => {
    if (!name) return 'L';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleCall = () => {
    if (lead?.phone) {
      Linking.openURL(`tel:${lead.phone}`).catch(() => { });
    }
  };

  const handleSms = () => {
    if (lead?.phone) {
      Linking.openURL(`sms:${lead.phone}`).catch(() => { });
    }
  };

  const handleWhatsApp = () => {
    if (lead?.phone) {
      const cleanPhone = lead.phone.replace(/\D/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      Linking.openURL(`https://wa.me/${fullPhone}`).catch(() => { });
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
      <View style={[styles.centerContainer, { backgroundColor: theme.primaryBg }]}>
        <ActivityIndicator size="large" color={theme.brand} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading lead details...
        </Text>
      </View>
    );
  }

  if (isError || !lead) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.primaryBg }]}>
        <AlertCircle size={44} color="#ef4444" />
        <Text style={styles.errorTitle}>Lead Not Found</Text>
        <Text style={[styles.errorDesc, { color: theme.textSecondary }]}>
          Unable to fetch details for public lead ID #{id}.
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.brand }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>
      {/* Top App Bar */}
      <View style={[styles.appBar, { borderBottomColor: theme.border, backgroundColor: theme.cardBg }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerIconBtn, { backgroundColor: theme.primaryBg }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.appBarTitle, { color: theme.textPrimary }]}>
            Lead #{lead.leadId}
          </Text>
          <Text style={[styles.appBarSubtitle, { color: theme.textSecondary }]}>
            Public Lead & Inquiry Details
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
          style={[styles.deleteHeaderBtn, { backgroundColor: isDark ? '#7f1d1d25' : '#fef2f2' }]}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpacing + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Header Hero Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.heroRow}>
            {/* Avatar */}
            <View style={[styles.avatarBox, { backgroundColor: typeConfig.bg }]}>
              <Text style={[styles.avatarText, { color: typeConfig.text }]}>
                {getInitials(lead.name)}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.heroNameRow}>
                <Text style={[styles.heroName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {lead.name}
                </Text>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: typeConfig.bg, borderColor: typeConfig.border },
                  ]}
                >
                  <TypeIcon size={11} color={typeConfig.text} />
                  <Text style={[styles.typeBadgeText, { color: typeConfig.text }]}>
                    {typeConfig.label}
                  </Text>
                </View>
              </View>

              {lead.phone ? (
                <Text style={[styles.heroPhone, { color: theme.textSecondary }]}>
                  {lead.phone}
                </Text>
              ) : null}

              <View style={styles.heroMetaRow}>
                <Clock size={11} color={theme.textMuted} />
                <Text style={[styles.heroDate, { color: theme.textMuted }]}>
                  Received: {formatDate(lead.createdOn)}
                </Text>
              </View>
            </View>
          </View>

          {/* Direct Action Buttons */}
          <View style={[styles.actionsRow, { borderTopColor: theme.border }]}>
            <TouchableOpacity onPress={handleCall} style={[styles.actionBtn, styles.callBtn]}>
              <Phone size={14} color="#ffffff" />
              <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleWhatsApp} style={[styles.actionBtn, styles.waBtn]}>
              <MessageCircle size={14} color="#ffffff" />
              <Text style={styles.actionBtnText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSms} style={[styles.actionBtn, styles.smsBtn]}>
              <Mail size={14} color="#ffffff" />
              <Text style={styles.actionBtnText}>SMS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <MessageCircle size={16} color={theme.brand} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Inquiry Message</Text>
          </View>
          <View
            style={[
              styles.messageContainer,
              {
                backgroundColor: isDark ? 'rgba(22, 22, 22, 0.6)' : '#f4f4f5',
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.messageText, { color: theme.textPrimary }]}>
              {lead.message ? `"${lead.message.trim()}"` : 'No message was submitted with this inquiry.'}
            </Text>
          </View>
        </View>

        {/* Attribution & Entity Details Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Building2 size={16} color={theme.brand} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Workspace & Property
            </Text>
          </View>

          <View style={styles.infoGrid}>
            {/* Tenant / Company */}
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Tenant Workspace
              </Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {lead.tenantName || 'Direct / Central'} {lead.tenantId ? `(#${lead.tenantId})` : ''}
              </Text>
            </View>

            {/* Property */}
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Interested Property
              </Text>
              <Text style={[styles.infoValue, { color: theme.accent, fontWeight: '700' }]}>
                {lead.propertyName || 'Direct / General Inquiry'}
              </Text>
            </View>

            {/* Assigned Agent */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Assigned Agent
              </Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {lead.agentName || 'Central Team'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action & Schedule Details Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Calendar size={16} color="#f59e0b" />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Schedule & Specifics
            </Text>
          </View>

          <View style={styles.infoGrid}>
            {/* Callback Requested */}
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Callback Requested
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {lead.callbackRequested ? (
                  <CheckCircle2 size={16} color="#10b981" />
                ) : (
                  <XCircle size={16} color={theme.textMuted} />
                )}
                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: lead.callbackRequested ? '#10b981' : theme.textSecondary,
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
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Site Visit Date
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: lead.siteVisitDate ? '#8b5cf6' : theme.textPrimary,
                    fontWeight: lead.siteVisitDate ? '700' : '500',
                  },
                ]}
              >
                {formatDate(lead.siteVisitDate)}
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
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  appBarSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  deleteHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroPhone: {
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 3,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  heroDate: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  callBtn: {
    backgroundColor: '#835CEE',
  },
  waBtn: {
    backgroundColor: '#10b981',
  },
  smsBtn: {
    backgroundColor: '#6366f1',
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
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  infoGrid: {
    gap: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 13.5,
    marginTop: 12,
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ef4444',
    marginTop: 12,
  },
  errorDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
