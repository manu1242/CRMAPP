import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  FileText,
  Send,
  History,
  Edit,
  Trash2,
  X,
  Mail,
} from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
  useQuotationDetail,
  useUpdateQuotationStatus,
  useDeleteQuotation,
  useQuotationVersions,
  useSendQuotationApproval,
} from '../../../../admin/hooks/useQuotations';
import { useQueryClient } from '@tanstack/react-query';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return 'N/A';
  }
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0.00';
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export default function QuotationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const quotationId = id ? parseInt(Array.isArray(id) ? id[0] : id, 10) : 0;

  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);
  const queryClient = useQueryClient();

  const { data: detailResponse, isLoading } = useQuotationDetail(quotationId);
  const quotation = detailResponse?.data;

  const { data: versionsResponse, isLoading: isVersionsLoading } = useQuotationVersions(quotationId);
  const versions = versionsResponse?.data ?? [];

  const updateStatusMutation = useUpdateQuotationStatus();
  const deleteQuotationMutation = useDeleteQuotation();
  const sendApprovalMutation = useSendQuotationApproval();

  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalEmail, setApprovalEmail] = useState('');
  const [approvalValidity, setApprovalValidity] = useState('7');
  const [approvalResult, setApprovalResult] = useState<{ clientPortalUrl: string; token: string } | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return { bg: isDark ? '#064e3b' : '#d1fae5', text: isDark ? '#34d399' : '#059669' };
      case 'Rejected': return { bg: isDark ? '#7f1d1d' : '#fee2e2', text: isDark ? '#f87171' : '#dc2626' };
      case 'Sent': return { bg: isDark ? '#1e3a8a' : '#dbeafe', text: isDark ? '#60a5fa' : '#2563eb' };
      case 'Expired': return { bg: isDark ? '#3f3f46' : '#f4f4f5', text: isDark ? '#a1a1aa' : '#71717a' };
      default: return { bg: isDark ? '#27272a' : '#f3f4f6', text: isDark ? '#d4d4d8' : '#4b5563' };
    }
  };

  const handleUpdateStatus = (newStatus: string) => {
    updateStatusMutation.mutate(
      { id: quotationId, status: newStatus },
      {
        onSuccess: () => {
          Alert.alert('Success', `Status updated to '${newStatus}'.`);
          queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] });
          queryClient.invalidateQueries({ queryKey: ['quotations'] });
        },
        onError: (err: any) => {
          Alert.alert('Error', err.message || 'Failed to update status.');
        },
      }
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this quotation? This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteQuotationMutation.mutate(quotationId, {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['quotations'] });
                router.back();
              },
              onError: (err: any) => {
                Alert.alert('Delete Failed', err.response?.data?.message || err.message || 'Could not delete.');
              },
            });
          },
        },
      ]
    );
  };

  const handleSendApproval = () => {
    if (!quotationId || !approvalEmail) {
      Alert.alert('Validation Error', 'Please enter a valid client email.');
      return;
    }
    sendApprovalMutation.mutate(
      { id: quotationId, clientEmail: approvalEmail, validityDays: parseInt(approvalValidity) || 7 },
      {
        onSuccess: (res) => {
          setApprovalResult({ clientPortalUrl: res.data.clientPortalUrl, token: res.data.token });
          queryClient.invalidateQueries({ queryKey: ['quotations'] });
        },
        onError: (err: any) => {
          Alert.alert('Send Failed', err.response?.data?.message || err.message || 'Failed to send approval.');
        },
      }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primaryBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.inputBg }]}>
          <ChevronLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {isLoading ? 'Loading...' : quotation?.quotationNumber || 'Quotation Detail'}
          </Text>
        </View>
        {quotation?.status ? (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quotation.status).bg }]}>
            <Text style={[styles.statusText, { color: getStatusColor(quotation.status).text }]}>
              {quotation.status}
            </Text>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.brand} />
          <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading quotation...</Text>
        </View>
      ) : quotation ? (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Client & Property Info */}
          <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>CLIENT & PROPERTY</Text>
            <InfoRow label="Lead" value={quotation.leadName} theme={theme} />
            <InfoRow label="Property" value={quotation.propertyName} theme={theme} />
            <InfoRow
              label="Flat / Unit"
              value={`${quotation.flatNumber || 'N/A'} (Floor ${quotation.floorId || 'N/A'})`}
              theme={theme}
            />
            <InfoRow label="Quotation Date" value={formatDate(quotation.quotationDate)} theme={theme} />
            <InfoRow label="Valid Until" value={formatDate(quotation.validUntil)} theme={theme} />
          </View>

          {/* Items Table */}
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Quotation Items</Text>
          {quotation.items && quotation.items.length > 0 ? (
            <View style={[styles.table, { borderColor: theme.border }]}>
              <View style={[styles.tableHeader, { backgroundColor: theme.inputBg, borderBottomColor: theme.border }]}>
                <Text style={[styles.th, { flex: 2, color: theme.textSecondary }]}>Description</Text>
                <Text style={[styles.th, { flex: 1, color: theme.textSecondary, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.th, { flex: 1.5, color: theme.textSecondary, textAlign: 'right' }]}>Total</Text>
              </View>
              {quotation.items.map((item, idx) => (
                <View key={item.itemId || idx} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                  <View style={{ flex: 2 }}>
                    <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '500' }}>{item.description}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11 }}>{item.itemType}</Text>
                  </View>
                  <Text style={{ flex: 1, color: theme.textPrimary, fontSize: 13, textAlign: 'center' }}>{item.quantity}</Text>
                  <Text style={{ flex: 1.5, color: theme.textPrimary, fontSize: 13, fontWeight: '500', textAlign: 'right' }}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: theme.textSecondary, fontStyle: 'italic', marginBottom: 16 }}>No items attached.</Text>
          )}

          {/* Pricing Summary */}
          <View style={[styles.pricingCard, { borderColor: theme.border }]}>
            <SummaryRow label="Subtotal" value={formatCurrency(quotation.basePrice)} theme={theme} />
            <SummaryRow label="Discount" value={`-${formatCurrency(quotation.discountAmount)}`} valueColor="#dc2626" theme={theme} />
            <SummaryRow label="GST Tax (5%)" value={formatCurrency(quotation.taxAmount)} theme={theme} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SummaryRow label="Grand Total" value={formatCurrency(quotation.grandTotal)} labelBold valueColor={theme.brand} theme={theme} />
          </View>

          {/* Notes */}
          {quotation.notes ? (
            <>
              <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Notes & Terms</Text>
              <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{quotation.notes}</Text>
              </View>
            </>
          ) : null}

          {/* Status Update */}
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Update Status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {['Draft', 'Sent', 'Accepted', 'Rejected'].map((st) => (
              <TouchableOpacity
                key={st}
                disabled={quotation.status === st}
                onPress={() => handleUpdateStatus(st)}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor: quotation.status === st ? theme.border : theme.secondaryBg,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={{ color: quotation.status === st ? theme.textMuted : theme.textPrimary, fontSize: 12, fontWeight: '600' }}>
                  Set {st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => {
                setApprovalResult(null);
                setApprovalEmail('');
                setApprovalValidity('7');
                setApprovalModalOpen(true);
              }}
              style={[styles.actionBtn, { backgroundColor: theme.brand }]}
            >
              <Send size={15} color="#ffffff" />
              <Text style={styles.actionBtnText}>Send Approval</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setHistoryModalOpen(true)}
              style={[styles.actionBtn, { backgroundColor: theme.secondaryBg, borderWidth: 1, borderColor: theme.border }]}
            >
              <History size={15} color={theme.textPrimary} />
              <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: '/admin/SalesUnit/quotation/CreateQuotation', params: { editId: String(quotationId) } })}
              style={[styles.actionBtn, { backgroundColor: theme.secondaryBg, borderWidth: 1, borderColor: theme.border }]}
            >
              <Edit size={15} color={theme.textPrimary} />
              <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}
            >
              <Trash2 size={15} color="#dc2626" />
              <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <FileText size={40} color={theme.textMuted} />
          <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Quotation not found.</Text>
        </View>
      )}

      {/* VERSION HISTORY MODAL */}
      <Modal visible={isHistoryModalOpen} transparent animationType="slide" onRequestClose={() => setHistoryModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Version History</Text>
              <TouchableOpacity onPress={() => setHistoryModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {isVersionsLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.brand} />
              </View>
            ) : versions.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={{ gap: 14 }}>
                  {versions.map((v) => (
                    <View key={v.versionId} style={[styles.versionCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 14 }}>Version {v.versionNumber}</Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11 }}>{formatDate(v.createdOn)}</Text>
                      </View>
                      <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600', marginTop: 6 }}>
                        Total: {formatCurrency(v.totalAmount)}
                      </Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                        <Text style={{ fontWeight: '600' }}>Change Reason: </Text>
                        {v.changeReason || 'No details provided.'}
                      </Text>
                      {v.itemsJson ? (
                        <View style={{ marginTop: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 2 }}>
                            Items Snapshot:
                          </Text>
                          {(() => {
                            try {
                              const parsed = JSON.parse(v.itemsJson);
                              return parsed.map((item: any, idx: number) => (
                                <Text key={idx} style={{ fontSize: 11, color: theme.textMuted }}>
                                  · {item.ItemType || item.itemType}: {item.Description || item.description} ({formatCurrency(item.Total || item.total)})
                                </Text>
                              ));
                            } catch {
                              return <Text style={{ fontSize: 11, color: theme.textMuted }}>Could not parse items.</Text>;
                            }
                          })()}
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary }}>No versions found.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* SEND APPROVAL MODAL */}
      <Modal visible={isApprovalModalOpen} transparent animationType="fade" onRequestClose={() => setApprovalModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.approvalModal, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Send Approval Request</Text>
              <TouchableOpacity onPress={() => setApprovalModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <View>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Client Email</Text>
                <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    placeholder="client@example.com"
                    keyboardType="email-address"
                    placeholderTextColor={theme.textMuted}
                    value={approvalEmail}
                    onChangeText={setApprovalEmail}
                  />
                  <Mail size={16} color={theme.textSecondary} />
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Link Validity (Days)</Text>
                <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    placeholder="7"
                    keyboardType="numeric"
                    placeholderTextColor={theme.textMuted}
                    value={approvalValidity}
                    onChangeText={setApprovalValidity}
                  />
                </View>
              </View>

              {sendApprovalMutation.isPending ? (
                <ActivityIndicator size="small" color={theme.brand} />
              ) : (
                <TouchableOpacity onPress={handleSendApproval} style={[styles.submitBtn, { backgroundColor: theme.brand }]}>
                  <Text style={{ color: '#ffffff', fontWeight: '700' }}>Generate & Send</Text>
                </TouchableOpacity>
              )}

              {approvalResult ? (
                <View style={[styles.versionCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 13 }}>Request generated successfully!</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 6 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Token: </Text>{approvalResult.token}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Portal URL: </Text>{approvalResult.clientPortalUrl}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
        <Text style={{ fontWeight: '600', color: theme.textPrimary }}>{label}: </Text>
        {value}
      </Text>
    </View>
  );
}

function SummaryRow({ label, value, labelBold, valueColor, theme }: {
  label: string; value: string; labelBold?: boolean; valueColor?: string; theme: any;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}>
      <Text style={{ color: theme.textSecondary, fontWeight: labelBold ? '700' : '400', fontSize: labelBold ? 15 : 14 }}>
        {label}
      </Text>
      <Text style={{ color: valueColor ?? theme.textPrimary, fontWeight: labelBold ? '700' : '500', fontSize: labelBold ? 16 : 14 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  sectionHeading: { fontSize: 14, fontWeight: '700', marginTop: 4, marginBottom: 10 },
  table: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  tableHeader: { flexDirection: 'row', padding: 10, borderBottomWidth: 1 },
  th: { fontSize: 11, fontWeight: '600' },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, alignItems: 'center' },
  pricingCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16, gap: 4 },
  divider: { height: 1, marginVertical: 8 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, gap: 6,
    flex: 1, minWidth: 110,
  },
  actionBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  modalContent: {
    width: '100%', maxHeight: '88%', borderRadius: 20, borderWidth: 1, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  approvalModal: {
    width: '90%', maxWidth: 400, borderRadius: 20, borderWidth: 1, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  versionCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', height: 48,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 14 },
  submitBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
});
