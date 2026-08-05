import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/superadmin/components/Header';
import SidebarDrawer from '../../auth/components/SidebarDrawer';
import { apiClient } from '../../api/apiClient';
import { useTheme } from '../../contexts/ThemeContext';
import BottomNav from '@/superadmin/components/BottomNav';

interface Inquiry {
  inquiryId: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string | null;
  notes: string | null;
  convertedToTenantId: number | null;
  createdOn: string | null;
  updatedOn: string | null;
  referralCode: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  New:       { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  Contacted: { bg: '#fef9c3', text: '#a16207', border: '#fef08a' },
  Converted: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  Closed:    { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
};
function getStatusColor(status: string | null) {
  return STATUS_COLORS[status ?? 'New'] ?? STATUS_COLORS['New'];
}
function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_OPTIONS = ['New', 'Contacted', 'Converted', 'Closed'];

export default function InquiriesScreen() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { isDark } = useTheme();

  // Theme colors
  const bgColor = isDark ? '#0f172a' : '#f3f4f6';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#f1f5f9';
  const msgBg = isDark ? '#0f172a' : '#f8fafc';

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['inquiries'],
    queryFn: () =>
      apiClient.get<{ success: boolean; data: Inquiry[] }>('/api/v1/superadmin/inquiries'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes: string }) =>
      apiClient.put(`/api/v1/superadmin/inquiries/${id}/status`, { status, notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inquiries'] }),
  });

  const inquiries: Inquiry[] = data?.data ?? [];

  const handleStatusChange = (inq: Inquiry) => {
    Alert.alert(
      `Update Status: ${inq.companyName}`,
      'Choose a new status:',
      STATUS_OPTIONS.map((s) => ({
        text: s,
        onPress: () => statusMutation.mutate({ id: inq.inquiryId, status: s, notes: inq.notes ?? '' }),
      }))
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>

        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>Inquiries</Text>
            <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
              {inquiries.length} total inquiries
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 80, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#1e73be']} />
          }
        >
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 64 }} size="large" color="#1e73be" />
          ) : isError ? (
            <View style={{ padding: 16, backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2', borderWidth: 1, borderColor: isDark ? '#7f1d1d' : '#fecaca', borderRadius: 12, alignItems: 'center', marginTop: 24 }}>
              <Text style={{ color: '#dc2626', fontWeight: '600', marginBottom: 8 }}>Failed to load inquiries</Text>
              <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#dc2626', borderRadius: 12 }} onPress={() => refetch()}>
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : inquiries.length === 0 ? (
            <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 32, alignItems: 'center', marginTop: 16 }}>
              <Ionicons name="mail-outline" size={48} color="#94a3b8" />
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginTop: 16 }}>No Inquiries Yet</Text>
            </View>
          ) : (
            inquiries.map((inq) => {
              const sc = getStatusColor(inq.status);
              return (
                <View key={inq.inquiryId} style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>{inq.companyName}</Text>
                      <Text style={{ color: subTextColor, fontSize: 12 }}>{inq.contactPerson} · {inq.email}</Text>
                      {inq.phone && <Text style={{ color: subTextColor, fontSize: 10, marginTop: 2 }}>{inq.phone}</Text>}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleStatusChange(inq)}
                      style={{ backgroundColor: sc.bg, borderColor: sc.border, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}
                    >
                      <Text style={{ color: sc.text, fontSize: 10, fontWeight: '700' }}>{inq.status ?? 'New'}</Text>
                    </TouchableOpacity>
                  </View>

                  {inq.message ? (
                    <View style={{ backgroundColor: msgBg, borderRadius: 12, padding: 12, marginTop: 8 }}>
                      <Text style={{ color: subTextColor, fontSize: 12, lineHeight: 18 }} numberOfLines={3}>
                        {inq.message}
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
                    <Text style={{ color: subTextColor, fontSize: 10 }}>
                      <FontAwesome name="calendar" size={10} color="#94a3b8" /> {formatDate(inq.createdOn)}
                    </Text>
                    {inq.referralCode ? (
                      <View style={{ backgroundColor: isDark ? '#2e1065' : '#f5f3ff', borderWidth: 1, borderColor: isDark ? '#4c1d95' : '#ede9fe', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: '#7c3aed', fontSize: 10, fontWeight: '600' }}>Ref: {inq.referralCode}</Text>
                      </View>
                    ) : null}
                    {inq.convertedToTenantId ? (
                      <View style={{ backgroundColor: isDark ? '#064e3b40' : '#f0fdf4', borderWidth: 1, borderColor: isDark ? '#064e3b' : '#bbf7d0', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: '#16a34a', fontSize: 10, fontWeight: '600' }}>✓ Converted</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
  );
}
