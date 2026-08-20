import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
  FileText,
  CheckCircle2,
  Download,
  X,
  CreditCard,
} from 'lucide-react-native';
import {
  subscriptionService,
  CrmTransactionItem,
  CrmTxStats,
} from '../../../../admin/services/subscriptionService';

export default function CrmTransactionsScreen() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<CrmTransactionItem[]>([]);
  const [stats, setStats] = useState<CrmTxStats>({
    totalTransactions: 0,
    totalPaidAmount: 0,
  });

  // Invoice Detail Modal
  const [selectedTx, setSelectedTx] = useState<CrmTransactionItem | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const fetchCrmTransactions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await subscriptionService.getCrmTransactions();
      if (res && res.success && res.data) {
        setTransactions(res.data.transactions || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err: any) {
      console.warn('Error fetching CRM transactions:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCrmTransactions();
  }, [fetchCrmTransactions]);

  const handleOpenInvoice = (tx: CrmTransactionItem) => {
    setSelectedTx(tx);
    setIsInvoiceModalOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Header */}
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
            backgroundColor: '#6366f120',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <FileText size={20} color="#6366f1" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Billing & Invoices</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchCrmTransactions(true)} />
        }
      >
        {/* KPI Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 12 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Total Invoices</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: textColor, marginTop: 4 }}>
              {stats.totalTransactions}
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 12 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Total Paid</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#10b981', marginTop: 4 }}>
              ₹{stats.totalPaidAmount}
            </Text>
          </View>
        </View>

        {/* Transactions List */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading invoices...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <FileText size={36} color={subTextColor} />
            <Text style={{ marginTop: 10, color: subTextColor, fontSize: 14 }}>No billing invoices found</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {transactions.map((tx) => (
              <TouchableOpacity
                key={tx.transactionId}
                onPress={() => handleOpenInvoice(tx)}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: borderCol,
                  padding: 14,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={18} color="#10b981" />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                      {tx.invoiceNumber}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981' }}>
                    ₹{tx.netAmount || tx.amount}
                  </Text>
                </View>

                <Text style={{ fontSize: 12, color: subTextColor }}>
                  {tx.planName} • {tx.billingCycle}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    Date: {tx.invoiceDate ? tx.invoiceDate.split('T')[0] : 'N/A'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#6366f1', fontWeight: '600' }}>
                    View Invoice
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* INVOICE DETAIL MODAL */}
      <Modal visible={isInvoiceModalOpen} animationType="slide" transparent>
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
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Invoice Details</Text>
              <TouchableOpacity onPress={() => setIsInvoiceModalOpen(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {selectedTx && (
              <View style={{ gap: 12 }}>
                <View style={{ backgroundColor: bgColor, borderRadius: 10, padding: 12 }}>
                  <Text style={{ fontSize: 12, color: subTextColor }}>Invoice Number</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, marginTop: 2 }}>
                    {selectedTx.invoiceNumber}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: subTextColor }}>Plan:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{selectedTx.planName}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: subTextColor }}>Base Amount:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>₹{selectedTx.amount}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: subTextColor }}>Tax (GST):</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>₹{selectedTx.taxAmount || 0}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: borderCol, paddingTop: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>Net Total:</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981' }}>₹{selectedTx.netAmount || selectedTx.amount}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setIsInvoiceModalOpen(false)}
              style={{
                marginTop: 20,
                height: 42,
                borderRadius: 8,
                backgroundColor: '#6366f1',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Close Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
