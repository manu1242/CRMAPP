import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Tenant } from '../models/Tenant';

interface TenantCardProps {
  tenant: Tenant;
}

import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';

export const TenantCard = React.memo(({ tenant }: TenantCardProps) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const superTheme = getSuperAdminTheme(isDark);

  const statusTheme = useMemo(() => {
    if (tenant.isSuspended) {
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
        border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
        text: isDark ? '#f87171' : '#dc2626',
        label: 'Suspended',
        avatarBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
        avatarText: isDark ? '#f87171' : '#dc2626',
      };
    }
    if (!tenant.isActive) {
      return {
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
        border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a',
        text: isDark ? '#fbbf24' : '#d97706',
        label: 'Locked',
        avatarBg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
        avatarText: isDark ? '#fbbf24' : '#d97706',
      };
    }
    return {
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
      border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
      text: isDark ? '#34d399' : '#059669',
      label: 'Active',
      avatarBg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
      avatarText: isDark ? '#34d399' : '#059669',
    };
  }, [tenant.isSuspended, tenant.isActive, isDark]);

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
      style={{
        backgroundColor: superTheme.cardBg,
        borderColor: superTheme.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.02,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {/* Left Avatar Badge */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: statusTheme.avatarBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: statusTheme.avatarText }}>
          {initials}
        </Text>
      </View>

      {/* Middle side: Main details */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4, gap: 8 }}>
          <Text
            style={{
              fontWeight: '700',
              color: superTheme.textPrimary,
              fontSize: 15,
              maxWidth: '70%',
            }}
            numberOfLines={1}
          >
            {tenant.companyName}
          </Text>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 9999,
              backgroundColor: statusTheme.bg,
              borderColor: statusTheme.border,
              borderWidth: 1,
            }}
          >
            <Text
              style={{
                fontSize: 8,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: statusTheme.text,
              }}
            >
              {statusTheme.label}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleOpenLink}
          activeOpacity={0.6}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
        >
          <Text style={{ color: superTheme.brand, fontSize: 11, fontWeight: '500', marginRight: 4 }}>
            {tenant.subdomain}.uproptech.com
          </Text>
          <Ionicons name="open-outline" size={10} color={superTheme.brand} />
        </TouchableOpacity>

        {/* Metadata info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="person-outline" size={11} color={superTheme.textMuted} />
            <Text style={{ color: superTheme.textSecondary, fontSize: 10, fontWeight: '500' }}>
              {tenant.contactPerson}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="people-outline" size={11} color={superTheme.textMuted} />
            <Text style={{ color: superTheme.textSecondary, fontSize: 10, fontWeight: '500' }}>
              {tenant.maxUsers} Users
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="pricetag-outline" size={11} color={superTheme.textMuted} />
            <Text style={{ color: superTheme.textSecondary, fontSize: 10, fontWeight: '500', textTransform: 'capitalize' }}>
              {tenant.plan || 'Basic'}
            </Text>
          </View>
        </View>

        {/* Muted footer info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: superTheme.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, marginRight: 8 }}>
            <Ionicons name="mail-outline" size={10} color={superTheme.textMuted} />
            <Text style={{ color: superTheme.textMuted, fontSize: 9 }} numberOfLines={1}>
              {tenant.email}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="calendar-outline" size={10} color={superTheme.textMuted} />
            <Text style={{ color: superTheme.textMuted, fontSize: 9 }}>
              {formattedDate}
            </Text>
          </View>
        </View>
      </View>

      {/* Right side: Chevron arrow */}
      <Ionicons name="chevron-forward-outline" size={16} color={superTheme.textMuted} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
});

TenantCard.displayName = 'TenantCard';
