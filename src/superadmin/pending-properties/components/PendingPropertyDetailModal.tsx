import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  X,
  Building2,
  User,
  Phone,
  MessageCircle,
  MapPin,
  Check,
  Clock,
  Sparkles,
  AlertCircle,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import { PendingPropertyItem } from '../models/pendingProperty';
import { useModeratePropertyMutation } from '../hooks/usePendingProperties';

interface PendingPropertyDetailModalProps {
  property: PendingPropertyItem | null;
  visible: boolean;
  onClose: () => void;
}

export const PendingPropertyDetailModal: React.FC<PendingPropertyDetailModalProps> = ({
  property,
  visible,
  onClose,
}) => {
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);
  const insets = useSafeAreaInsets();

  const [rejectReason, setRejectReason] = useState('');
  const [isRejectInputVisible, setIsRejectInputVisible] = useState(false);

  const moderateMutation = useModeratePropertyMutation();

  if (!property || !visible) return null;

  const isPending = property.propertyStatus === 'PENDING_APPROVAL';
  const isActive = property.propertyStatus === 'ACTIVE';
  const isRejected = property.propertyStatus === 'REJECTED';

  const formatPrice = (val?: number) => {
    if (!val && val !== 0) return '₹ --';
    try {
      return `₹${Number(val).toLocaleString('en-IN')}`;
    } catch {
      return `₹${val}`;
    }
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Property',
      `Are you sure you want to approve "${property.propertyName}"? It will become live on the public portal.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Approve',
          style: 'default',
          onPress: async () => {
            try {
              await moderateMutation.mutateAsync({
                id: property.propertyId,
                status: 'ACTIVE',
              });
              Alert.alert('Approved!', 'Property has been approved successfully.');
              onClose();
            } catch {
              Alert.alert('Error', 'Failed to approve property.');
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    try {
      await moderateMutation.mutateAsync({
        id: property.propertyId,
        status: 'REJECTED',
        rejectReason: rejectReason.trim() || undefined,
      });
      setIsRejectInputVisible(false);
      setRejectReason('');
      Alert.alert('Rejected', 'Property submission has been rejected.');
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to reject property.');
    }
  };

  const handleCall = () => {
    if (property.owner?.phone) {
      Linking.openURL(`tel:${property.owner.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (property.owner?.phone) {
      const clean = property.owner.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`whatsapp://send?phone=${clean}`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.cardBg,
              borderBottomColor: theme.border,
              paddingTop: Platform.OS === 'android' ? Math.max(16, insets.top) : 12,
            },
          ]}
        >
          <View style={styles.headerTitleWrap}>
            <Text
              numberOfLines={1}
              style={[styles.headerTitle, { color: theme.textPrimary }]}
            >
              {property.propertyName}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Property #{property.propertyId} · {property.listingCategory}
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(30, insets.bottom + 80) },
          ]}
        >
          {/* Status Alert Banner */}
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: isPending
                  ? isDark
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(245, 158, 11, 0.1)'
                  : isActive
                  ? isDark
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(16, 185, 129, 0.1)'
                  : isDark
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(239, 68, 68, 0.1)',
                borderColor: isPending ? '#f59e0b' : isActive ? '#10b981' : '#ef4444',
              },
            ]}
          >
            {isPending ? (
              <Clock size={16} color="#f59e0b" />
            ) : isActive ? (
              <Check size={16} color="#10b981" />
            ) : (
              <AlertCircle size={16} color="#ef4444" />
            )}
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.statusBannerTitle,
                  {
                    color: isPending ? '#f59e0b' : isActive ? '#10b981' : '#ef4444',
                  },
                ]}
              >
                {isPending
                  ? 'Pending SuperAdmin Moderation'
                  : isActive
                  ? 'Approved & Live on Portal'
                  : 'Listing Rejected'}
              </Text>
              {isRejected && Boolean(property.rejectReason) && (
                <Text style={styles.statusBannerDesc}>
                  Reason: {property.rejectReason}
                </Text>
              )}
            </View>
          </View>

          {/* Pricing & Key Highlights Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <View style={styles.priceRow}>
              <View>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                  LISTING PRICE
                </Text>
                <Text style={styles.priceValue}>{formatPrice(property.price)}</Text>
              </View>

              <View style={styles.pillsRow}>
                <View
                  style={[
                    styles.specPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(131, 92, 238, 0.15)'
                        : 'rgba(131, 92, 238, 0.1)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.specPillText,
                      { color: isDark ? '#a78bfa' : '#835CEE' },
                    ]}
                  >
                    {property.listingCategory}
                  </Text>
                </View>
                <View
                  style={[
                    styles.specPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                >
                  <Text style={[styles.specPillText, { color: theme.textSecondary }]}>
                    {property.propertyType}
                  </Text>
                </View>
              </View>
            </View>

            {/* Facts Grid */}
            <View style={[styles.factsContainer, { borderTopColor: theme.border }]}>
              <View style={styles.factCell}>
                <Text style={[styles.factCellLabel, { color: theme.textMuted }]}>BHK</Text>
                <Text style={[styles.factCellValue, { color: theme.textPrimary }]}>
                  {property.bhk || 'N/A'}
                </Text>
              </View>

              <View style={styles.factCell}>
                <Text style={[styles.factCellLabel, { color: theme.textMuted }]}>
                  CARPET AREA
                </Text>
                <Text style={[styles.factCellValue, { color: theme.textPrimary }]}>
                  {property.areaSqft ? `${property.areaSqft} Sq.Ft` : 'N/A'}
                </Text>
              </View>

              <View style={styles.factCell}>
                <Text style={[styles.factCellLabel, { color: theme.textMuted }]}>CITY</Text>
                <Text style={[styles.factCellValue, { color: theme.textPrimary }]}>
                  {property.city || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Location Address */}
            <View style={[styles.locationRow, { borderTopColor: theme.border }]}>
              <MapPin size={15} color={theme.textMuted} />
              <Text style={[styles.locationText, { color: theme.textPrimary }]}>
                {property.location}, {property.city}
              </Text>
            </View>
          </View>

          {/* Description Card */}
          {Boolean(property.description) && (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                Property Description
              </Text>
              <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
                {property.description}
              </Text>
            </View>
          )}

          {/* Owner Identity & Contacts Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Owner Information
            </Text>

            <View style={styles.ownerProfileRow}>
              <View
                style={[
                  styles.ownerAvatar,
                  {
                    backgroundColor: isDark ? '#835CEE25' : '#835CEE15',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ownerAvatarText,
                    { color: isDark ? '#a78bfa' : '#835CEE' },
                  ]}
                >
                  {(property.owner?.fullName || 'PO').substring(0, 2).toUpperCase()}
                </Text>
              </View>

              <View style={styles.ownerProfileInfo}>
                <Text style={[styles.ownerFullName, { color: theme.textPrimary }]}>
                  {property.owner?.fullName || 'Property Owner'}
                </Text>
                <Text style={[styles.ownerPhoneText, { color: theme.textSecondary }]}>
                  {property.owner?.phone || 'No phone provided'}
                </Text>
              </View>
            </View>

            {/* Call and WhatsApp Buttons */}
            {Boolean(property.owner?.phone) && (
              <View style={styles.contactActionsRow}>
                <TouchableOpacity
                  onPress={handleCall}
                  style={[styles.contactBtn, { backgroundColor: '#10b981' }]}
                >
                  <Phone size={14} color="#ffffff" />
                  <Text style={styles.contactBtnText}>Call Owner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleWhatsApp}
                  style={[styles.contactBtn, { backgroundColor: '#25D366' }]}
                >
                  <MessageCircle size={14} color="#ffffff" />
                  <Text style={styles.contactBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Rejection Form Input (if open) */}
          {isRejectInputVisible && (
            <View
              style={[
                styles.rejectFormCard,
                { backgroundColor: theme.cardBg, borderColor: '#ef4444' },
              ]}
            >
              <Text style={styles.rejectFormTitle}>Reason for Rejection</Text>
              <TextInput
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Enter feedback or reason for the owner..."
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.rejectInput,
                  {
                    backgroundColor: theme.primaryBg,
                    color: theme.textPrimary,
                    borderColor: theme.border,
                  },
                ]}
                multiline
                numberOfLines={3}
              />
              <View style={styles.rejectFormActions}>
                <TouchableOpacity
                  onPress={() => setIsRejectInputVisible(false)}
                  style={[
                    styles.cancelRejectBtn,
                    { borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.cancelRejectText, { color: theme.textPrimary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={moderateMutation.isPending}
                  onPress={handleReject}
                  style={styles.confirmRejectBtn}
                >
                  {moderateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.confirmRejectText}>Confirm Reject</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Moderation Floating Bar for Pending Properties */}
        {isPending && !isRejectInputVisible && (
          <View
            style={[
              styles.floatingBottomBar,
              {
                backgroundColor: theme.cardBg,
                borderTopColor: theme.border,
                paddingBottom: Math.max(14, insets.bottom),
              },
            ]}
          >
            <TouchableOpacity
              disabled={moderateMutation.isPending}
              onPress={handleApprove}
              style={[styles.bottomActionBtn, styles.bottomApproveBtn]}
            >
              {moderateMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.bottomApproveText}>Approve Property</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={moderateMutation.isPending}
              onPress={() => setIsRejectInputVisible(true)}
              style={[styles.bottomActionBtn, styles.bottomRejectBtn]}
            >
              <X size={16} color="#ef4444" />
              <Text style={styles.bottomRejectText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBannerDesc: {
    fontSize: 11.5,
    color: '#ef4444',
    marginTop: 2,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  specPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  specPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  factsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  factCell: {
    flex: 1,
  },
  factCellLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  factCellValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  ownerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ownerProfileInfo: {
    flex: 1,
  },
  ownerFullName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  ownerPhoneText: {
    fontSize: 11.5,
    marginTop: 2,
  },
  contactActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  rejectFormCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  rejectFormTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
  rejectInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 12.5,
    textAlignVertical: 'top',
    minHeight: 65,
  },
  rejectFormActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelRejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelRejectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confirmRejectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
  confirmRejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  floatingBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  bottomActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  bottomApproveBtn: {
    backgroundColor: '#10b981',
    flex: 1.6,
  },
  bottomApproveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  bottomRejectBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
    flex: 1,
  },
  bottomRejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
});

