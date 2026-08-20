import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Header from '../../superadmin/components/Header';
import SidebarDrawer from '../../auth/components/SidebarDrawer';
import { apiClient } from '../../api/apiClient';
import { useTheme } from '../../contexts/ThemeContext';
import { API_ENDPOINTS } from '../../api/endpoints';

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

function getStatusColor(status: string | null, isDark: boolean) {
  const normalized = status ?? 'New';
  if (isDark) {
    switch (normalized) {
      case 'New':
        return { bg: 'rgba(99, 102, 241, 0.12)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.25)', dot: '#818cf8', avatarBg: 'rgba(99, 102, 241, 0.15)' };
      case 'Contacted':
        return { bg: 'rgba(245, 158, 11, 0.12)', text: '#fde047', border: 'rgba(245, 158, 11, 0.25)', dot: '#f59e0b', avatarBg: 'rgba(245, 158, 11, 0.15)' };
      case 'Converted':
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#6ee7b7', border: 'rgba(16, 185, 129, 0.25)', dot: '#10b981', avatarBg: 'rgba(16, 185, 129, 0.15)' };
      case 'Closed':
        return { bg: 'rgba(148, 163, 184, 0.12)', text: '#cbd5e1', border: 'rgba(148, 163, 184, 0.25)', dot: '#94a3b8', avatarBg: 'rgba(148, 163, 184, 0.15)' };
      case 'Rejected':
        return { bg: 'rgba(239, 68, 68, 0.12)', text: '#fca5a5', border: 'rgba(239, 68, 68, 0.25)', dot: '#ef4444', avatarBg: 'rgba(239, 68, 68, 0.15)' };
      default:
        return { bg: 'rgba(99, 102, 241, 0.12)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.25)', dot: '#818cf8', avatarBg: 'rgba(99, 102, 241, 0.15)' };
    }
  } else {
    switch (normalized) {
      case 'New':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', dot: '#2563eb', avatarBg: '#eff6ff' };
      case 'Contacted':
        return { bg: '#fff7ed', text: '#d97706', border: '#fed7aa', dot: '#d97706', avatarBg: '#fff7ed' };
      case 'Converted':
        return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', dot: '#16a34a', avatarBg: '#f0fdf4' };
      case 'Closed':
        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#64748b', avatarBg: '#f8fafc' };
      case 'Rejected':
        return { bg: '#fcebeb', text: '#ef4444', border: '#fca5a5', dot: '#ef4444', avatarBg: '#fcebeb' };
      default:
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', dot: '#2563eb', avatarBg: '#eff6ff' };
    }
  }
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
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Handle Android physical back button override to go to dashboard
  useEffect(() => {
    const backAction = () => {
      router.replace('/superadmin/dashboard');
      return true; // prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [router]);

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
      apiClient.get<{ success: boolean; data: Inquiry[] }>(API_ENDPOINTS.SUPER_ADMIN.GET_INQUIRIES),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes: string }) =>
      apiClient.put(API_ENDPOINTS.SUPER_ADMIN.UPDATE_INQUIRY_STATUS(id), { status, notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inquiries'] }),
  });

  const inquiries: Inquiry[] = data?.data ?? [];

  // Status change handled by premium bottom actions sheet modal

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: insets.top }} edges={['bottom', 'left', 'right']}>
      <View style={{ flex: 1, backgroundColor: bgColor }}>

        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>Inquiries</Text>
            <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
              Track and update prospective tenant sign-ups
            </Text>
          </View>
          <View style={{
            backgroundColor: isDark ? 'rgba(30,58,138,0.3)' : '#eff6ff',
            borderColor: isDark ? 'rgba(29,78,216,0.3)' : '#bfdbfe',
            borderWidth: 1,
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}>
            <Text style={{ color: isDark ? '#60a5fa' : '#2563eb', fontSize: 10, fontWeight: '700' }}>
              {inquiries.length} Inquiries
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 160, gap: 10 }}
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
          ) : inquiries.map((inq) => {
            const sc = getStatusColor(inq.status, isDark);
            const initials = inq.companyName
              ? inq.companyName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : 'I';

            return (
              <View
                key={inq.inquiryId}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: borderCol,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}
              >
                {/* Left: Avatar Initials */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: sc.avatarBg,
                    borderColor: sc.border,
                    borderWidth: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: sc.text }}>
                    {initials}
                  </Text>
                </View>

                {/* Right: Main Content Area */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  {/* Header Row: Company Name & Status/Menu */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8, flexWrap: 'wrap' }}>
                      <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
                        {inq.companyName}
                      </Text>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: sc.bg,
                        borderColor: sc.border,
                        borderWidth: 0.5,
                        borderRadius: 20,
                        paddingHorizontal: 8,
                        paddingVertical: 2
                      }}>
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: sc.dot }} />
                        <Text style={{ color: sc.text, fontSize: 9, fontWeight: '700' }}>
                          {inq.status ?? 'New'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedInquiry(inq);
                        setIsActionModalOpen(true);
                      }}
                      style={{
                        width: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="ellipsis-vertical" size={16} color={textColor} />
                    </TouchableOpacity>
                  </View>

                  {/* Contact details */}
                  <View style={{ gap: 2, marginBottom: 8 }}>
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: '500', marginBottom: 2 }}>
                      {inq.contactPerson}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="mail-outline" size={12} color={subTextColor} />
                      <Text style={{ color: subTextColor, fontSize: 12 }} numberOfLines={1}>
                        {inq.email}
                      </Text>
                    </View>
                    {inq.phone && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="call-outline" size={12} color={subTextColor} />
                        <Text style={{ color: subTextColor, fontSize: 12 }}>
                          {inq.phone}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Inquiry Message bubble container */}
                  {inq.message ? (
                    <View style={{
                      backgroundColor: msgBg,
                      borderRadius: 8,
                      borderWidth: 0.5,
                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      padding: 12,
                      marginTop: 4
                    }}>
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12, lineHeight: 18 }}>
                        {inq.message}
                      </Text>
                    </View>
                  ) : null}

                  {/* Meta badges (Referral & Converted) */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    {inq.referralCode ? (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                        borderWidth: 0.5,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        borderRadius: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}>
                        <Ionicons name="gift-outline" size={12} color={subTextColor} />
                        <Text style={{ color: subTextColor, fontSize: 11, fontWeight: '500' }}>Referral</Text>
                      </View>
                    ) : null}

                    {inq.convertedToTenantId ? (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4',
                        borderWidth: 0.5,
                        borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#bbf7d0',
                        borderRadius: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}>
                        <Ionicons name="checkmark-circle-outline" size={12} color="#10b981" />
                        <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '500' }}>Converted</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <Modal
          visible={isActionModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsActionModalOpen(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Pressable
              style={{ ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              onPress={() => setIsActionModalOpen(false)}
            />

            <View style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 16,
              paddingBottom: 40,
              paddingTop: 16,
              borderWidth: 1,
              borderColor: borderCol,
            }}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? '#475569' : '#cbd5e1' }} />
              </View>

              {selectedInquiry && (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginBottom: 4 }}>
                    {selectedInquiry.companyName}
                  </Text>
                  <Text style={{ fontSize: 12, color: subTextColor, marginBottom: 20 }}>
                    Manage status and workspace provision
                  </Text>

                  <View style={{ gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setIsActionModalOpen(false);
                        statusMutation.mutate({
                          id: selectedInquiry.inquiryId,
                          status: 'Contacted',
                          notes: selectedInquiry.notes ?? 'Contacted via mobile app',
                        });
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: borderCol,
                      }}
                    >
                      <Ionicons name="call" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
                      <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>Contacted</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setIsActionModalOpen(false);
                        statusMutation.mutate({
                          id: selectedInquiry.inquiryId,
                          status: 'Converted',
                          notes: selectedInquiry.notes ?? 'Converted via mobile app',
                        });
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: borderCol,
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
                      <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>Converted</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setIsActionModalOpen(false);
                        statusMutation.mutate({
                          id: selectedInquiry.inquiryId,
                          status: 'Rejected',
                          notes: selectedInquiry.notes ?? 'Rejected via mobile app',
                        });
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: borderCol,
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#ef4444' }}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setIsActionModalOpen(false);
                        router.push({
                          pathname: '/superadmin/create-tenant',
                          params: {
                            companyName: selectedInquiry.companyName,
                            subdomain: selectedInquiry.companyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15),
                            contactPerson: selectedInquiry.contactPerson,
                            email: selectedInquiry.email,
                            phone: selectedInquiry.phone || '',
                            referralCode: selectedInquiry.referralCode || '',
                          }
                        });
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 12,
                        paddingTop: 8,
                      }}
                    >
                      <Ionicons name="add" size={24} color="#16a34a" style={{ marginLeft: -2 }} />
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#16a34a' }}>Create Tenant</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>


      </View>
    </SafeAreaView>
  );
}
