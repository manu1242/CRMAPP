import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import SidebarDrawer from '../../auth/components/SidebarDrawer';
import AppFooter from '../../auth/components/AppFooter';
import Header from '../../superadmin/components/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { useBottomNavSpacing } from '../../hooks/useBottomNavSpacing';

import { useTenantsQuery } from '../../superadmin/tenants/hooks/useTenants';
import { useTenantFilterStore } from '../../superadmin/tenants/store/tenantStore';
import { TenantFilterBar } from '../../superadmin/tenants/components/TenantFilterBar';
import { TenantCard } from '../../superadmin/tenants/components/TenantCard';

export default function SuperAdminTenantsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isDark } = useTheme();
  const { bottomSpacing } = useBottomNavSpacing();

  // Theme colors
  const bgColor = isDark ? '#161616' : '#FFFFFF';
  const cardBg = isDark ? '#242424' : '#ffffff';
  const textColor = isDark ? '#FFFFFF' : '#0a0a0a';
  const subTextColor = isDark ? '#a1a1aa' : '#52525b';
  const borderCol = isDark ? '#2e2e2e' : '#e4e4e7';
  const paginationBg = isDark ? '#242424' : '#ffffff';
  const paginationBorder = isDark ? '#2e2e2e' : '#e4e4e7';

  // Get filter settings from Zustand store
  const filters = useTenantFilterStore();

  // Query tenants from TanStack Query
  const { data, isLoading, error, refetch, isRefetching } = useTenantsQuery({
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search,
    status: filters.status,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const responseData = data?.data;
  const items = responseData?.items || [];
  const totalRecords = responseData?.totalRecords || 0;
  const totalPages = Math.ceil(totalRecords / filters.pageSize) || 1;

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>

      {/* Dashboard Title & Create Button */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>Tenant Management</Text>
          <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
            Create, view, and manage tenant organizations
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/superadmin/create-tenant')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e73be', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
        >
          <Ionicons name="add-circle" size={16} color="#fff" />
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>New Tenant</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <TenantFilterBar />
      </View>

      {/* Scroll Content */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: bottomSpacing, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={['#835CEE']}
          />
        }
      >
        {(isLoading && !data) ? (
          <ActivityIndicator style={{ marginTop: 64 }} size="large" color="#835CEE" />
        ) : error ? (
          <View style={{ padding: 16, backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2', borderWidth: 1, borderColor: isDark ? '#7f1d1d' : '#fecaca', borderRadius: 12, alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#dc2626', fontWeight: '600', marginBottom: 8 }}>Error loading tenants</Text>
            <Text style={{ color: subTextColor, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>{(error as any).message || 'Server connection failed'}</Text>
            <TouchableOpacity
              style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#dc2626', borderRadius: 12 }}
              onPress={() => refetch()}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 32, alignItems: 'center', marginTop: 16 }}>
            <Ionicons name="business-outline" size={48} color={isDark ? '#71717a' : '#a1a1aa'} />
            <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginTop: 16 }}>No Tenants Found</Text>
            <Text style={{ color: subTextColor, fontSize: 12, textAlign: 'center', marginTop: 8, paddingHorizontal: 24 }}>
              Try modifying your search query or filters. If this is a new setup, create your first tenant.
            </Text>
          </View>
        ) : (
          <View>
            {items.map((item) => (
              <TenantCard key={item.tenantId} tenant={item} />
            ))}

            {/* Pagination controls */}
            <View style={{ backgroundColor: paginationBg, borderRadius: 12, borderWidth: 1, borderColor: paginationBorder, padding: 12, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity
                disabled={filters.page <= 1}
                onPress={() => filters.setPage(filters.page - 1)}
                style={{ padding: 8, borderRadius: 8, borderWidth: 1, borderColor: filters.page <= 1 ? (isDark ? '#2e2e2e' : '#f4f4f5') : (isDark ? '#2e2e2e' : '#e4e4e7'), backgroundColor: filters.page <= 1 ? (isDark ? '#161616' : '#f4f4f5') : (isDark ? '#242424' : '#ffffff') }}
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={filters.page <= 1 ? (isDark ? '#52525b' : '#a1a1aa') : (isDark ? '#a1a1aa' : '#52525b')}
                />
              </TouchableOpacity>

              <Text style={{ color: subTextColor, fontSize: 12, fontWeight: '600' }}>
                Page {filters.page} of {totalPages} ({totalRecords} total)
              </Text>

              <TouchableOpacity
                disabled={filters.page >= totalPages}
                onPress={() => filters.setPage(filters.page + 1)}
                style={{ padding: 8, borderRadius: 8, borderWidth: 1, borderColor: filters.page >= totalPages ? (isDark ? '#2e2e2e' : '#f4f4f5') : (isDark ? '#2e2e2e' : '#e4e4e7'), backgroundColor: filters.page >= totalPages ? (isDark ? '#161616' : '#f4f4f5') : (isDark ? '#242424' : '#ffffff') }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={filters.page >= totalPages ? (isDark ? '#52525b' : '#a1a1aa') : (isDark ? '#a1a1aa' : '#52525b')}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer */}
        <AppFooter />
      </ScrollView>
    </View>
  );
}
