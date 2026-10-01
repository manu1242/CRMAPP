import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import {
  subscriptionService,
  RazorpayTransactionItem,
  RazorpayStats,
} from '../../admin/services/subscriptionService';

export default function TransactionsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  // Theme colors
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#e2e8f0';
  const inputBg = isDark ? '#0f172a' : '#ffffff';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [transactions, setTransactions] = useState<RazorpayTransactionItem[]>([]);
  const [stats, setStats] = useState<RazorpayStats>({
    totalTransactions: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0,
    totalSuccessfulAmount: 0,
  });

  // Modal State
  const [selectedTx, setSelectedTx] = useState<RazorpayTransactionItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await subscriptionService.getRazorpayTransactions({
        search: search.trim() || undefined,
        pageSize: 50,
      });

      if (res && res.success && res.data) {
        setTransactions(res.data.transactions || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      console.warn('Error fetching transactions:', err?.message);
      setError(err?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Client-side filter for status
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filter === 'all') return true;
      const statusLower = (t.status || '').toLowerCase();
      if (filter === 'success') return statusLower === 'success' || statusLower === 'completed' || statusLower === 'paid';
      if (filter === 'pending') return statusLower === 'pending' || statusLower === 'processing' || statusLower === 'created';
      if (filter === 'failed') return statusLower === 'failed' || statusLower === 'cancelled' || statusLower === 'error';
      return true;
    });
  }, [transactions, filter]);

  const getStatusStyle = (statusStr?: string) => {
    const s = (statusStr || '').toLowerCase();
    if (s === 'success' || s === 'completed' || s === 'paid') {
      return {
        bg: isDark ? '#064e3b40' : '#f0fdf4',
        border: isDark ? '#064e3b' : '#bbf7d0',
        text: '#16a34a',
        label: 'Success',
      };
    }
    if (s === 'pending' || s === 'processing' || s === 'created') {
      return {
        bg: isDark ? '#7c2d1240' : '#fff7ed',
        border: isDark ? '#7c2d12' : '#fed7aa',
        text: '#ea580c',
        label: 'Pending',
      };
    }
    return {
      bg: isDark ? '#7f1d1d40' : '#fef2f2',
      border: isDark ? '#7f1d1d' : '#fca5a5',
      text: '#ef4444',
      label: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Failed',
    };
  };

  const formatCurrency = (val?: number) => {
    const amount = val ?? 0;
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor, marginBottom: 60 }}>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTransactions(true)}
            colors={['#2563eb']}
          />
        }
      >
        {/* Header section */}
        <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: cardBg,
              padding: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: borderCol,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={textColor} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: textColor }}>
              Transactions History
            </Text>
            <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
              Real-time platform billing and revenue transactions.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => fetchTransactions(true)}
            style={{
              backgroundColor: cardBg,
              padding: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: borderCol,
            }}
          >
            <Ionicons name="reload" size={18} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* KPI Stats Cards */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 10,
            }}
          >
            <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '600', textTransform: 'uppercase' }}>
              Total Txns
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: textColor, marginTop: 2 }}>
              {stats.totalTransactions}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 10,
            }}
          >
            <Text style={{ fontSize: 10, color: '#10b981', fontWeight: '600', textTransform: 'uppercase' }}>
              Success
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981', marginTop: 2 }}>
              {stats.successCount}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 10,
            }}
          >
            <Text style={{ fontSize: 10, color: '#ef4444', fontWeight: '600', textTransform: 'uppercase' }}>
              Failed
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#ef4444', marginTop: 2 }}>
              {stats.failedCount}
            </Text>
          </View>

          <View
            style={{
              flex: 1.2,
              backgroundColor: cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 10,
            }}
          >
            <Text style={{ fontSize: 10, color: '#2563eb', fontWeight: '600', textTransform: 'uppercase' }}>
              Revenue
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#2563eb', marginTop: 2 }} numberOfLines={1}>
              {formatCurrency(stats.totalSuccessfulAmount)}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={{
            height: 42,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: borderCol,
            backgroundColor: inputBg,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
          }}
        >
          <Ionicons name="search-outline" size={18} color={subTextColor} />
          <TextInput
            style={{ flex: 1, color: textColor, fontSize: 13 }}
            placeholder="Search tenant, reference or payment ID..."
            placeholderTextColor={subTextColor}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => fetchTransactions()}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={subTextColor} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {(['all', 'success', 'pending', 'failed'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: filter === f ? '#2563eb' : cardBg,
                borderWidth: 1,
                borderColor: filter === f ? '#2563eb' : borderCol,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  textTransform: 'capitalize',
                  color: filter === f ? '#ffffff' : textColor,
                }}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions List */}
        {loading ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13, fontWeight: '600' }}>
              Loading transactions...
            </Text>
          </View>
        ) : error ? (
          <View
            style={{
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor: borderCol,
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
            }}
          >
            <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
            <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginTop: 12 }}>
              Failed to load transactions
            </Text>
            <Text style={{ color: subTextColor, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => fetchTransactions()}
              style={{
                marginTop: 16,
                backgroundColor: '#2563eb',
                paddingHorizontal: 18,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View
            style={{
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor: borderCol,
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
            }}
          >
            <Ionicons name="receipt-outline" size={40} color={subTextColor} />
            <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginTop: 12 }}>
              No transactions found
            </Text>
            <Text style={{ color: subTextColor, fontSize: 12, marginTop: 4 }}>
              No records match your search or selected filter.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredTransactions.map((item) => {
              const statusStyle = getStatusStyle(item.status);
              return (
                <TouchableOpacity
                  key={item.transactionId}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedTx(item);
                    setIsDetailModalOpen(true);
                  }}
                  style={{
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: borderCol,
                    borderRadius: 16,
                    padding: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.02,
                    shadowRadius: 3,
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text
                        style={{ fontSize: 15, fontWeight: '700', color: textColor }}
                        numberOfLines={1}
                      >
                        {item.partnerName || item.description || 'Tenant Workspace'}
                      </Text>
                      <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                        {item.transactionReference || item.razorpayPaymentId || `TXN-#${item.transactionId}`} •{' '}
                        {item.paymentMethod || 'Razorpay'}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: statusStyle.bg,
                        borderWidth: 1,
                        borderColor: statusStyle.border,
                        borderRadius: 20,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ color: statusStyle.text, fontSize: 10, fontWeight: '700' }}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  <View style={{ height: 1, backgroundColor: borderCol, marginBottom: 12 }} />

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={{
                          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563eb' }}>
                          {item.planName || item.transactionType || 'Subscription'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: subTextColor }}>Plan</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: '#2563eb', fontWeight: '600' }}>
                      Tap for details
                    </Text>
                    <Text style={{ fontSize: 10, color: subTextColor }}>
                      {formatDate(item.transactionDate || item.completedDate)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* TRANSACTION DETAILS MODAL */}
      <Modal
        visible={isDetailModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsDetailModalOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 20,
          }}
          onPress={() => setIsDetailModalOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>
                Transaction Details
              </Text>
              <TouchableOpacity onPress={() => setIsDetailModalOpen(false)}>
                <Ionicons name="close" size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {selectedTx && (
              <View style={{ gap: 12 }}>
                <View style={{ backgroundColor: bgColor, borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 11, color: subTextColor, textTransform: 'uppercase', fontWeight: '600' }}>
                    Reference Number
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: textColor, marginTop: 2 }}>
                    {selectedTx.transactionReference || `TXN-#${selectedTx.transactionId}`}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: subTextColor }}>Tenant / Partner:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
                    {selectedTx.partnerName || 'Tenant'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: subTextColor }}>Plan:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
                    {selectedTx.planName || selectedTx.transactionType || 'Subscription'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: subTextColor }}>Payment Method:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                    {selectedTx.paymentMethod || 'Razorpay'}
                  </Text>
                </View>

                {selectedTx.razorpayPaymentId && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: subTextColor }}>Razorpay ID:</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                      {selectedTx.razorpayPaymentId}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: subTextColor }}>Date & Time:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                    {formatDate(selectedTx.transactionDate || selectedTx.completedDate)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderTopWidth: 1,
                    borderTopColor: borderCol,
                    paddingTop: 10,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                    Total Amount:
                  </Text>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#10b981' }}>
                    {formatCurrency(selectedTx.amount)}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setIsDetailModalOpen(false)}
              style={{
                marginTop: 20,
                height: 42,
                borderRadius: 10,
                backgroundColor: '#2563eb',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
