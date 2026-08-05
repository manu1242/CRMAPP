import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Tenant } from '../models/Tenant';

interface TenantCardProps {
  tenant: Tenant;
}

export const TenantCard = React.memo(({ tenant }: TenantCardProps) => {
  const router = useRouter();

  const badge = useMemo(() => {
    if (tenant.isSuspended) {
      return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Suspended' };
    }
    if (!tenant.isActive) {
      return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Locked' };
    }
    return { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700', label: 'Active' };
  }, [tenant.isSuspended, tenant.isActive]);

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

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-3 flex-col"
    >
      {/* Top Row: Company & Badge */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1 mr-2">
          <Text className="font-bold text-slate-800 text-sm leading-tight">
            {tenant.companyName}
          </Text>
          <Text className="text-slate-400 text-[10px] mt-0.5 font-semibold uppercase tracking-wider">
            {tenant.subdomain}.uproptech.com
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className={`px-2 py-0.5 rounded border ${badge.bg}`}>
            <Text className={`text-[9px] font-bold uppercase ${badge.text}`}>
              {badge.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View className="border-t border-slate-50 my-2" />

      {/* Middle Row: Plan & Details */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="person-outline" size={12} color="#64748b" />
          <Text className="text-slate-650 text-xs font-medium">
            {tenant.contactPerson}
          </Text>
        </View>
        
        <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
          <Text className="text-amber-700 text-[9px] font-bold">
            {tenant.plan}
          </Text>
        </View>
      </View>

      {/* Bottom Row: Contact & Creation Date */}
      <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-50">
        <View className="flex-row items-center gap-1.5 flex-1 mr-2">
          <Ionicons name="mail-outline" size={12} color="#94a3b8" />
          <Text className="text-slate-400 text-xxs truncate" numberOfLines={1}>
            {tenant.email}
          </Text>
        </View>
        
        <View className="flex-row items-center gap-1">
          <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
          <Text className="text-slate-400 text-xxs">
            {formattedDate}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

TenantCard.displayName = 'TenantCard';
