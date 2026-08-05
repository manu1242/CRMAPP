import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { useAuthStore } from '../../auth/store/authStore';
import AppFooter from '../../auth/components/AppFooter';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import {
  MailCheck,
  Settings,
  User,
  Plus,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Building2,
  CheckCircle2,
  Ban,
  MessageSquare,
  Mail,
  MoreVertical,
  Activity,
} from 'lucide-react-native';

interface DashboardData {
  metrics: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    newInquiries: number;
    registeredEmails: number;
  };
  recentTenants: Array<{
    tenantId: number;
    companyName: string;
    subdomain: string;
    plan: string;
    isActive: boolean;
    isSuspended: boolean;
    createdOn: string;
  }>;
  recentInquiries: Array<{
    inquiryId: number;
    companyName: string;
    contactPerson: string;
    status: string;
    createdOn: string;
  }>;
}

const SkeletonLoader = () => {
  const { isDark } = useTheme();
  const shimmerBg = isDark ? '#1e293b' : '#f1f5f9';
  const borderCol = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 16, flex: 1 }}>
      <View style={{ height: 120, backgroundColor: shimmerBg, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: borderCol }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, minWidth: '45%', height: 110, backgroundColor: shimmerBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol }} />
        <View style={{ flex: 1, minWidth: '45%', height: 110, backgroundColor: shimmerBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol }} />
        <View style={{ flex: 1, minWidth: '45%', height: 110, backgroundColor: shimmerBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol }} />
        <View style={{ flex: 1, minWidth: '45%', height: 110, backgroundColor: shimmerBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol }} />
      </View>
      <View style={{ height: 20, width: 120, backgroundColor: shimmerBg, borderRadius: 4, marginBottom: 12 }} />
      <View style={{ height: 180, backgroundColor: shimmerBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol }} />
    </View>
  );
};

export default function SuperAdminDashboardContent() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await apiClient.get<{ success: boolean; data: DashboardData }>(
        API_ENDPOINTS.SUPER_ADMIN.GET_DASHBOARD
      );

      if (response && response.success) {
        setData(response.data);
      } else {
        setError('Failed to retrieve dashboard data from server');
      }
    } catch (err: any) {
      const is401 = err?.status === 401 || err?.response?.status === 401 || err?.message?.includes('401');
      const msg = is401
        ? 'Session expired (401). Please log in again.'
        : (err.response?.data?.message || err.message || 'An error occurred while fetching dashboard statistics');
      setError(msg);
      Toast.show({
        type: 'error',
        text1: is401 ? 'Session Expired' : 'Dashboard Error',
        text2: msg,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#e2e8f0';
  const iconColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {isLoading && !data ? (
        <SkeletonLoader />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 10 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchDashboardData(true)}
                colors={['#2563eb']}
              />
            }
          >
            {error ? (
              <View style={{ margin: 16, padding: 24, backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2', borderWidth: 1, borderColor: isDark ? '#7f1d1d' : '#fecaca', borderRadius: 16, alignItems: 'center', marginTop: 24 }}>
                <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 16, textAlign: 'center', marginBottom: 8 }}>
                  {error.includes('401') || error.toLowerCase().includes('session expired') ? 'Session Expired' : 'Failed to Load'}
                </Text>
                <Text style={{ color: subTextColor, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
                <TouchableOpacity
                  style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#2563eb', borderRadius: 10, alignSelf: 'center' }}
                  onPress={() => {
                    if (error.includes('401') || error.toLowerCase().includes('session expired')) {
                      useAuthStore.getState().logout();
                      router.replace('/main-login');
                    } else {
                      fetchDashboardData();
                    }
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>
                    {error.includes('401') || error.toLowerCase().includes('session expired') ? 'Go to Login' : 'Retry'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : data ? (
              <View style={{ gap: 24 }}>
                <View 
                  style={{
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: borderCol,
                    borderRadius: 12,
                    padding: 20,
                    marginHorizontal: 16,
                    marginTop: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 3,
                    elevation: 2,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <View style={{ backgroundColor: isDark ? '#1e3a8a40' : '#eff6ff', padding: 6, borderRadius: 8 }}>
                        <ShieldCheck size={18} color="#2563eb" />
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563eb', letterSpacing: 0.5 }}>
                        ENTERPRISE CONTROL
                      </Text>
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: textColor }}>
                      Super Admin Dashboard
                    </Text>
                    <Text style={{ fontSize: 13, color: subTextColor, marginTop: 6, lineHeight: 18 }}>
                      Monitor Tenants, subscriptions, users and platform health.
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => router.push('/superadmin/create-tenant')}
                    style={{
                      backgroundColor: '#2563eb',
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 8,
                      shadowColor: '#2563eb',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 3,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
                      + Create Tenant
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ gap: 12, paddingHorizontal: 16 }}>
                  <TouchableOpacity 
                    onPress={() => router.push('/superadmin/tenants')}
                    style={{ 
                      backgroundColor: cardBg, 
                      borderWidth: 1, 
                      borderColor: borderCol, 
                      borderRadius: 16, 
                      padding: 18, 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      shadowColor: '#000', 
                      shadowOffset: { width: 0, height: 2 }, 
                      shadowOpacity: 0.02, 
                      shadowRadius: 3, 
                      elevation: 2 
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={{ backgroundColor: isDark ? '#1e3a8a40' : '#eff6ff', padding: 12, borderRadius: 12 }}>
                        <Building2 size={24} color="#2563eb" />
                      </View>
                      <View>
                        <Text style={{ fontSize: 13, color: subTextColor, fontWeight: '600' }}>Total Tenants</Text>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: textColor, marginTop: 2 }}>{data.metrics.totalTenants}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: isDark ? '#16a34a20' : '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={12} color="#16a34a" />
                      <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '700' }}>+12%</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                      onPress={() => router.push('/superadmin/tenants')}
                      style={{ flex: 1, backgroundColor: cardBg, borderWidth: 1, borderColor: borderCol, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ backgroundColor: isDark ? '#064e3b40' : '#f0fdf4', padding: 8, borderRadius: 8 }}>
                          <CheckCircle2 size={18} color="#16a34a" />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <TrendingUp size={10} color="#16a34a" />
                          <Text style={{ fontSize: 10, color: '#16a34a', fontWeight: '700' }}>+8%</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: textColor }}>{data.metrics.activeTenants}</Text>
                      <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4, fontWeight: '600' }}>Active Tenants</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => router.push('/superadmin/inquiries')}
                      style={{ flex: 1, backgroundColor: cardBg, borderWidth: 1, borderColor: borderCol, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ backgroundColor: isDark ? '#7c2d1240' : '#fff7ed', padding: 8, borderRadius: 8 }}>
                          <MessageSquare size={18} color="#ea580c" />
                        </View>
                        <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ fontSize: 8, color: '#ffffff', fontWeight: '800' }}>NEW</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: textColor }}>{data.metrics.newInquiries}</Text>
                      <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4, fontWeight: '600' }}>New Inquiries</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                      onPress={() => router.push('/superadmin/tenants')}
                      style={{ flex: 1, backgroundColor: cardBg, borderWidth: 1, borderColor: borderCol, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ backgroundColor: isDark ? '#581c8740' : '#faf5ff', padding: 8, borderRadius: 8 }}>
                          <Mail size={18} color="#a855f7" />
                        </View>
                        <Activity size={14} color={subTextColor} />
                      </View>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: textColor }}>{data.metrics.registeredEmails ?? 0}</Text>
                      <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4, fontWeight: '600' }}>Registered Emails</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => router.push('/superadmin/tenants')}
                      style={{ flex: 1, backgroundColor: cardBg, borderWidth: 1, borderColor: borderCol, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ backgroundColor: isDark ? '#7f1d1d40' : '#fef2f2', padding: 8, borderRadius: 8 }}>
                          <Ban size={18} color="#dc2626" />
                        </View>
                        <Text style={{ fontSize: 10, color: '#dc2626', fontWeight: '600' }}>Alert</Text>
                      </View>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: textColor }}>{data.metrics.suspendedTenants}</Text>
                      <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4, fontWeight: '600' }}>Suspended</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
                      Quick Actions
                    </Text>
                  </View>

                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  >
                    <TouchableOpacity 
                      onPress={() => router.push('/superadmin/create-tenant')}
                      style={{
                        width: 120,
                        backgroundColor: cardBg,
                        borderWidth: 1,
                        borderColor: borderCol,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ backgroundColor: isDark ? '#1e3a8a40' : '#eff6ff', padding: 10, borderRadius: 20, marginBottom: 10 }}>
                        <Plus size={16} color="#2563eb" />
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>Add Tenant</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => router.push('/superadmin/inquiries')}
                      style={{
                        width: 120,
                        backgroundColor: cardBg,
                        borderWidth: 1,
                        borderColor: borderCol,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ backgroundColor: isDark ? '#7c2d1240' : '#fff7ed', padding: 10, borderRadius: 20, marginBottom: 10 }}>
                        <MailCheck size={16} color="#ea580c" />
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>Inquiries</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => router.push('/superadmin/plans')}
                      style={{
                        width: 120,
                        backgroundColor: cardBg,
                        borderWidth: 1,
                        borderColor: borderCol,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ backgroundColor: isDark ? '#064e3b40' : '#f0fdf4', padding: 10, borderRadius: 20, marginBottom: 10 }}>
                        <Settings size={16} color="#16a34a" />
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>Plans</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => {
                        Toast.show({
                          type: 'info',
                          text1: 'Reports',
                          text2: 'Reports feature is coming soon!',
                        });
                      }}
                      style={{
                        width: 120,
                        backgroundColor: cardBg,
                        borderWidth: 1,
                        borderColor: borderCol,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ backgroundColor: isDark ? '#3b076440' : '#faf5ff', padding: 10, borderRadius: 20, marginBottom: 10 }}>
                        <Activity size={16} color="#a855f7" />
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>Reports</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                <View style={{ paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Recent Tenants</Text>
                    <TouchableOpacity onPress={() => router.push('/superadmin/tenants')}>
                      <Text style={{ fontSize: 13, color: '#2563eb', fontWeight: '700' }}>View All</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: borderCol, borderRadius: 12, overflow: 'hidden' }}>
                    {data.recentTenants.length === 0 ? (
                      <View style={{ padding: 24, alignItems: 'center' }}>
                        <Building2 size={24} color={iconColor} />
                        <Text style={{ color: subTextColor, fontSize: 13, marginTop: 8 }}>No Tenants found</Text>
                      </View>
                    ) : (
                      data.recentTenants.map((item, index) => {
                        const initials = item.companyName.substring(0, 2).toUpperCase();
                        return (
                          <View 
                            key={item.tenantId} 
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: 16,
                              borderBottomWidth: index === data.recentTenants.length - 1 ? 0 : 1,
                              borderBottomColor: borderCol,
                            }}
                          >
                            <View 
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                                borderWidth: 1,
                                borderColor: borderCol,
                              }}
                            >
                              <Text style={{ fontSize: 14, fontWeight: '700', color: '#2563eb' }}>{initials}</Text>
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                                {item.companyName}
                              </Text>
                              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                                {item.subdomain}.ultrakey.com
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View 
                                style={{
                                  backgroundColor: isDark ? '#1e3a8a40' : '#eff6ff',
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                  borderRadius: 6,
                                }}
                              >
                                <Text style={{ fontSize: 10, color: '#2563eb', fontWeight: '700', textTransform: 'capitalize' }}>
                                  {item.plan || 'basic'}
                                </Text>
                              </View>

                              <View 
                                style={{
                                  backgroundColor: item.isSuspended 
                                    ? (isDark ? '#7f1d1d40' : '#fef2f2') 
                                    : item.isActive 
                                      ? (isDark ? '#064e3b40' : '#f0fdf4') 
                                      : (isDark ? '#33415540' : '#f8fafc'),
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                  borderRadius: 6,
                                }}
                              >
                                <Text 
                                  style={{ 
                                    fontSize: 10, 
                                    fontWeight: '700', 
                                    color: item.isSuspended 
                                      ? '#dc2626' 
                                      : item.isActive 
                                        ? '#16a34a' 
                                        : '#64748b' 
                                  }}
                                >
                                  {item.isSuspended ? 'Suspended' : item.isActive ? 'Active' : 'Inactive'}
                                </Text>
                              </View>

                              <TouchableOpacity style={{ padding: 4 }}>
                                <MoreVertical size={16} color={iconColor} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                </View>

                <View style={{ paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Recent Inquiries</Text>
                    <TouchableOpacity onPress={() => router.push('/superadmin/inquiries')}>
                      <Text style={{ fontSize: 13, color: '#2563eb', fontWeight: '700' }}>View All</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: 12 }}>
                    {data.recentInquiries.length === 0 ? (
                      <View style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: borderCol, borderRadius: 12, padding: 24, alignItems: 'center' }}>
                        <Mail size={24} color={iconColor} />
                        <Text style={{ color: subTextColor, fontSize: 13, marginTop: 8 }}>No inquiries found</Text>
                      </View>
                    ) : (
                      data.recentInquiries.map((item) => (
                        <TouchableOpacity 
                          key={item.inquiryId} 
                          onPress={() => router.push('/superadmin/inquiries')}
                          style={{
                            backgroundColor: cardBg,
                            borderWidth: 1,
                            borderColor: borderCol,
                            borderRadius: 12,
                            padding: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.02,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                        >
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                                {item.companyName}
                              </Text>
                              {item.status === 'New' && (
                                <View style={{ backgroundColor: isDark ? '#1e3a8a40' : '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                  <Text style={{ fontSize: 8, color: '#2563eb', fontWeight: '700', textTransform: 'uppercase' }}>New</Text>
                                </View>
                              )}
                            </View>
                            
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                              <User size={12} color={iconColor} />
                              <Text style={{ fontSize: 12, color: subTextColor }}>{item.contactPerson}</Text>
                            </View>

                            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                              {new Date(item.createdOn).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View 
                              style={{
                                backgroundColor: item.status === 'New' 
                                  ? (isDark ? '#1e3a8a40' : '#eff6ff') 
                                  : item.status === 'Contacted' 
                                    ? (isDark ? '#7c2d1240' : '#fff7ed') 
                                    : (isDark ? '#064e3b40' : '#f0fdf4'),
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                              }}
                            >
                              <Text 
                                style={{ 
                                  fontSize: 10, 
                                  fontWeight: '700', 
                                  color: item.status === 'New' 
                                    ? '#2563eb' 
                                    : item.status === 'Contacted' 
                                      ? '#ea580c' 
                                      : '#16a34a' 
                                }}
                              >
                                {item.status || 'New'}
                              </Text>
                            </View>
                            <ChevronRight size={16} color={iconColor} />
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </View>

                <AppFooter />
              </View>
            ) : null}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
