import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../superadmin/components/Header';
import BottomNav from '../../superadmin/components/BottomNav';
import { useTheme } from '../../contexts/ThemeContext';

interface Transaction {
  id: string;
  tenantName: string;
  invoiceRef: string;
  planName: string;
  amount: string;
  date: string;
  status: 'success' | 'pending' | 'failed';
  method: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', tenantName: 'Greenwood High School', invoiceRef: 'INV-2026-008', planName: 'Enterprise', amount: '$499.00', date: 'Jul 18, 2026 10:24 AM', status: 'success', method: 'Stripe' },
  { id: '2', tenantName: 'Oakridge International Academy', invoiceRef: 'INV-2026-007', planName: 'Premium', amount: '$199.00', date: 'Jul 16, 2026 04:12 PM', status: 'success', method: 'Razorpay' },
  { id: '3', tenantName: 'Pinecrest Montessori School', invoiceRef: 'INV-2026-006', planName: 'Basic', amount: '$49.00', date: 'Jul 12, 2026 09:30 AM', status: 'success', method: 'Stripe' },
  { id: '4', tenantName: 'Silver Valley Day School', invoiceRef: 'INV-2026-005', planName: 'Enterprise', amount: '$499.00', date: 'Jul 08, 2026 11:45 AM', status: 'pending', method: 'Stripe' },
  { id: '5', tenantName: 'Bright Beginnings Pre-School', invoiceRef: 'INV-2026-004', planName: 'Premium', amount: '$199.00', date: 'Jul 04, 2026 02:15 PM', status: 'failed', method: 'Razorpay' },
  { id: '6', tenantName: 'Legacy Preparatory Academy', invoiceRef: 'INV-2026-003', planName: 'Premium', amount: '$199.00', date: 'Jun 28, 2026 08:00 AM', status: 'success', method: 'Stripe' },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  // Theme colors
  const bgColor = isDark ? '#0f172a' : '#f3f4f6';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#e2e8f0';

  const filteredTransactions = MOCK_TRANSACTIONS.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const getStatusStyle = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return {
          bg: isDark ? '#064e3b40' : '#f0fdf4',
          border: isDark ? '#064e3b' : '#bbf7d0',
          text: '#16a34a',
          label: 'Success',
        };
      case 'pending':
        return {
          bg: isDark ? '#7c2d1240' : '#fff7ed',
          border: isDark ? '#7c2d12' : '#fed7aa',
          text: '#ea580c',
          label: 'Pending',
        };
      case 'failed':
        return {
          bg: isDark ? '#7f1d1d40' : '#fef2f2',
          border: isDark ? '#7f1d1d' : '#fca5a5',
          text: '#ef4444',
          label: 'Failed',
        };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Header section */}
        <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: cardBg, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: borderCol }}>
            <Ionicons name="arrow-back" size={20} color={textColor} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: textColor }}>Transactions History</Text>
            <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>Monitor and verify all system billing transactions.</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {(['all', 'success', 'pending', 'failed'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: filter === f ? '#2563eb' : cardBg,
                borderWidth: 1,
                borderColor: filter === f ? '#2563eb' : borderCol,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                textTransform: 'capitalize',
                color: filter === f ? '#ffffff' : textColor,
              }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions List */}
        <View style={{ gap: 12 }}>
          {filteredTransactions.length === 0 ? (
            <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: borderCol, borderRadius: 16, padding: 32, alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={40} color={subTextColor} />
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginTop: 12 }}>No transactions found</Text>
              <Text style={{ color: subTextColor, fontSize: 12, marginTop: 4 }}>No records match the selected filter.</Text>
            </View>
          ) : (
            filteredTransactions.map((item) => {
              const statusStyle = getStatusStyle(item.status);
              return (
                <View
                  key={item.id}
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }} numberOfLines={1}>
                        {item.tenantName}
                      </Text>
                      <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                        {item.invoiceRef} • {item.method}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: statusStyle.bg,
                      borderWidth: 1,
                      borderColor: statusStyle.border,
                      borderRadius: 20,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}>
                      <Text style={{ color: statusStyle.text, fontSize: 10, fontWeight: '700' }}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  <View style={{ height: 1, backgroundColor: borderCol, marginBottom: 12 }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563eb' }}>{item.planName}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: subTextColor }}>Plan</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                      {item.amount}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 10, color: subTextColor, marginTop: 8, textAlign: 'right' }}>
                    {item.date}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
