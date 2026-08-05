import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '@/theme/adminTheme';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
} from 'lucide-react-native';
import {
  subscriptionService,
  RazorpayTransactionItem,
  RazorpayStats,
} from '../../../../admin/services/subscriptionService';

export default function RazorpayTransactionsScreen() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [transactions, setTransactions] = useState<RazorpayTransactionItem[]>([]);
  const [stats, setStats] = useState<RazorpayStats>({
    totalTransactions: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0,
    totalSuccessfulAmount: 0,
  });

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await subscriptionService.getRazorpayTransactions({ search });
      if (res && res.success && res.data) {
        setTransactions(res.data.transactions || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err: any) {
      console.warn('Error fetching Razorpay transactions:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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
            backgroundColor: '#0284c720',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CreditCard size={20} color="#0284c7" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Razorpay Transactions</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchTransactions(true)} />
        }
      >
        {/* KPI Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 10 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Total Txns</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, marginTop: 2 }}>
              {stats.totalTransactions}
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 10 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Success</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#10b981', marginTop: 2 }}>
              {stats.successCount}
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 10 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Failed</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#ef4444', marginTop: 2 }}>
              {stats.failedCount}
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 10 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Revenue</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0284c7', marginTop: 2 }}>
              ₹{stats.totalSuccessfulAmount}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View
          style={{
            height: 42,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: borderCol,
            backgroundColor: cardBg,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Search size={16} color={subTextColor} />
          <TextInput
            style={{ flex: 1, color: textColor, fontSize: 13 }}
            placeholder="Search payment ID or reference..."
            placeholderTextColor={subTextColor}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Transactions List */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading transactions...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <CreditCard size={36} color={subTextColor} />
            <Text style={{ marginTop: 10, color: subTextColor, fontSize: 14 }}>No transactions found</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {transactions.map((tx) => (
              <View
                key={tx.transactionId}
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
                    {tx.status === 'Success' ? (
                      <CheckCircle2 size={18} color="#10b981" />
                    ) : tx.status === 'Failed' ? (
                      <XCircle size={18} color="#ef4444" />
                    ) : (
                      <Clock size={18} color="#f59e0b" />
                    )}
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                      {tx.transactionReference}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 16, fontWeight: '800', color: tx.status === 'Success' ? '#10b981' : textColor }}>
                    ₹{tx.amount}
                  </Text>
                </View>

                <Text style={{ fontSize: 12, color: subTextColor }}>
                  {tx.partnerName || 'Partner'} • {tx.planName || 'Plan'}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    PayID: {tx.razorpayPaymentId || 'N/A'}
                  </Text>
                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    Method: {tx.paymentMethod || 'Razorpay'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
