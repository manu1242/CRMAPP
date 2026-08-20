import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
  RotateCcw,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react-native';
import {
  subscriptionService,
  PendingRefundItem,
  RefundStats,
  ProcessRefundPayload,
} from '../../../../admin/services/subscriptionService';

export default function PendingRefundsScreen() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refunds, setRefunds] = useState<PendingRefundItem[]>([]);
  const [stats, setStats] = useState<RefundStats>({
    totalRefundRequests: 0,
    pendingCount: 0,
    processedCount: 0,
    totalRefundedAmount: 0,
  });

  // Process Refund Modal
  const [selectedRefund, setSelectedRefund] = useState<PendingRefundItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  const fetchRefunds = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await subscriptionService.getPendingRefunds();
      if (res && res.success && res.data) {
        setRefunds(res.data.refunds || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err: any) {
      console.warn('Error fetching pending refunds:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleOpenProcess = (item: PendingRefundItem) => {
    setSelectedRefund(item);
    setRefundReason(item.description || '');
    setIsModalOpen(true);
  };

  const handleProcessRefund = async () => {
    if (!selectedRefund) return;

    setProcessLoading(true);
    try {
      const res = await subscriptionService.processRefund({
        subscriptionId: selectedRefund.subscriptionId,
        amount: selectedRefund.amount,
        reason: refundReason,
      });

      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Refund Processed',
          text2: res.message || `Refund of ₹${selectedRefund.amount} processed!`,
        });
        setIsModalOpen(false);
        fetchRefunds();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Process Failed',
          text2: res?.message || 'Failed to process refund',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err?.message || 'Error processing refund',
      });
    } finally {
      setProcessLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: '#f59e0b20',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <RotateCcw size={20} color="#f59e0b" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Pending Refunds</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchRefunds(true)} />
        }
      >
        {/* KPI Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 10 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Total Requests</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, marginTop: 2 }}>
              {stats.totalRefundRequests}
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 10 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Pending</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#f59e0b', marginTop: 2 }}>
              {stats.pendingCount}
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 10 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Processed</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#10b981', marginTop: 2 }}>
              {stats.processedCount}
            </Text>
          </View>
        </View>

        {/* Refund Requests List */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading refund requests...</Text>
          </View>
        ) : refunds.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <RotateCcw size={36} color={subTextColor} />
            <Text style={{ marginTop: 10, color: subTextColor, fontSize: 14 }}>No pending refunds found</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {refunds.map((rf) => (
              <View
                key={rf.transactionId}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: borderCol,
                  padding: 16,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                      {rf.partnerName || 'Channel Partner'}
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                      {rf.email} • {rf.planName || 'Plan'}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#f59e0b' }}>
                    ₹{rf.amount}
                  </Text>
                </View>

                <Text style={{ fontSize: 12, color: subTextColor }}>
                  Reason: {rf.description || 'Customer cancellation'}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: rf.status === 'Pending' ? '#f59e0b15' : '#10b98115',
                      borderWidth: 1,
                      borderColor: rf.status === 'Pending' ? '#f59e0b40' : '#10b98140',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: rf.status === 'Pending' ? '#f59e0b' : '#10b981',
                      }}
                    >
                      {rf.status}
                    </Text>
                  </View>

                  {rf.status === 'Pending' && (
                    <TouchableOpacity
                      onPress={() => handleOpenProcess(rf)}
                      style={{
                        backgroundColor: '#10b981',
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Process Refund</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* PROCESS REFUND MODAL */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Process Refund</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {selectedRefund && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, color: textColor, fontWeight: '600' }}>
                  Refund Amount: ₹{selectedRefund.amount}
                </Text>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Reason / Notes
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    placeholder="Enter refund processing notes"
                    placeholderTextColor={subTextColor}
                    value={refundReason}
                    onChangeText={setRefundReason}
                  />
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: borderCol,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: subTextColor, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleProcessRefund}
                disabled={processLoading}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  backgroundColor: '#10b981',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {processLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Confirm Refund</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
