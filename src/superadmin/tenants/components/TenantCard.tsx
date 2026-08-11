import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Tenant } from '../models/Tenant';

interface TenantCardProps {
  tenant: Tenant;
}

export const TenantCard = React.memo(({ tenant }: TenantCardProps) => {
  const router = useRouter();

  const statusTheme = useMemo(() => {
    if (tenant.isSuspended) {
      return {
        bg: 'bg-red-50 border-red-200/50',
        text: 'text-red-600',
        label: 'Suspended',
        avatarBg: 'bg-red-50',
        avatarText: 'text-red-600',
      };
    }
    if (!tenant.isActive) {
      return {
        bg: 'bg-amber-50 border-amber-200/50',
        text: 'text-amber-600',
        label: 'Locked',
        avatarBg: 'bg-amber-50',
        avatarText: 'text-amber-600',
      };
    }
    return {
      bg: 'bg-emerald-50 border-emerald-200/50',
      text: 'text-emerald-600',
      label: 'Active',
      avatarBg: 'bg-emerald-50',
      avatarText: 'text-emerald-600',
    };
  }, [tenant.isSuspended, tenant.isActive]);

  const initials = useMemo(() => {
    return tenant.companyName
      ? tenant.companyName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : 'T';
  }, [tenant.companyName]);

  const formattedDate = useMemo(() => {
    return new Date(tenant.createdOn).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [tenant.createdOn]);

  const handlePress = useCallback(() => {
    router.push(`/superadmin/tenants/${tenant.tenantId}` as any);
  }, [router, tenant.tenantId]);

  const handleOpenLink = useCallback((e: any) => {
    e.stopPropagation(); // Prevent navigation to tenant details screen
    const url = `https://${tenant.subdomain}.uproptech.com`;
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open URL:", err);
    });
  }, [tenant.subdomain]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-white rounded-[16px] border border-slate-100 shadow-sm p-4 mb-3 flex-row items-center"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.015,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {/* Left Avatar Badge */}
      <View className={`w-12 h-12 rounded-full ${statusTheme.avatarBg} items-center justify-center mr-4 shrink-0`}>
        <Text className={`text-base font-bold ${statusTheme.avatarText}`}>
          {initials}
        </Text>
      </View>

      {/* Middle side: Main details */}
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center flex-wrap mb-1 gap-2">
          <Text className="font-bold text-slate-800 text-[15px] leading-tight truncate max-w-[70%]" numberOfLines={1}>
            {tenant.companyName}
          </Text>
          <View className={`px-2 py-0.5 rounded-full border ${statusTheme.bg}`}>
            <Text className={`text-[8px] font-bold uppercase tracking-wider ${statusTheme.text}`}>
              {statusTheme.label}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleOpenLink}
          activeOpacity={0.6}
          className="flex-row items-center mb-2"
        >
          <Text className="text-sky-600 text-[11px] font-medium tracking-wide mr-1">
            {tenant.subdomain}.uproptech.com
          </Text>
          <Ionicons name="open-outline" size={10} color="#0284c7" />
        </TouchableOpacity>

        {/* Metadata info */}
        <View className="flex-row items-center gap-3 flex-wrap">
          <View className="flex-row items-center gap-1">
            <Ionicons name="person-outline" size={11} color="#94a3b8" />
            <Text className="text-slate-500 text-[10px] font-medium">
              {tenant.contactPerson}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Ionicons name="people-outline" size={11} color="#94a3b8" />
            <Text className="text-slate-500 text-[10px] font-medium">
              {tenant.maxUsers} Users
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Ionicons name="pricetag-outline" size={11} color="#94a3b8" />
            <Text className="text-slate-500 text-[10px] font-medium capitalize">
              {tenant.plan || 'Basic'}
            </Text>
          </View>
        </View>

        {/* Muted footer info */}
        <View className="flex-row items-center gap-2 mt-2 pt-2 border-t border-slate-50">
          <View className="flex-row items-center gap-1 flex-1 mr-2">
            <Ionicons name="mail-outline" size={10} color="#94a3b8" />
            <Text className="text-slate-400 text-[9px] truncate" numberOfLines={1}>
              {tenant.email}
            </Text>
          </View>
          
          <View className="flex-row items-center gap-1">
            <Ionicons name="calendar-outline" size={10} color="#94a3b8" />
            <Text className="text-slate-400 text-[9px]">
              {formattedDate}
            </Text>
          </View>
        </View>
      </View>

      {/* Right side: Chevron arrow */}
      <Ionicons name="chevron-forward-outline" size={16} color="#cbd5e1" style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
});

TenantCard.displayName = 'TenantCard';
