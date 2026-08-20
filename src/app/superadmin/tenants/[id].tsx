import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  BackHandler
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useTenantDetailQuery,
  useDeleteTenantMutation,
  useActivateTenantMutation,
  useSuspendTenantMutation,
  useLockTenantMutation,
  useUnlockTenantMutation
} from '../../../superadmin/tenants/hooks/useTenants';
import { useTheme } from '../../../contexts/ThemeContext';
import BottomNav from '../../../superadmin/components/BottomNav';

export default function TenantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const parsedId = typeof id === 'string' ? id : '';
  const { isDark } = useTheme();

  // Handle Android physical back button override
  useEffect(() => {
    const backAction = () => {
      router.replace('/superadmin/tenants-hub');
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
  const labelColor = isDark ? '#cbd5e1' : '#475569';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#f1f5f9';
  const inputBg = isDark ? '#0f172a' : '#ffffff';
  const modalBg = isDark ? '#1e293b' : '#ffffff';

  // Get tenant details query
  const { data, isLoading, error, refetch } = useTenantDetailQuery(parsedId);
  const tenant = data?.data;

  // Mutations
  const deleteMutation = useDeleteTenantMutation();
  const activateMutation = useActivateTenantMutation();
  const suspendMutation = useSuspendTenantMutation();
  const lockMutation = useLockTenantMutation();
  const unlockMutation = useUnlockTenantMutation();

  // Suspend Dialog State
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendReasonError, setSuspendReasonError] = useState('');

  // Delete Action Confirmation
  const handleDeleteConfirm = () => {
    Alert.alert(
      'Delete Tenant',
      `Are you sure you want to delete ${tenant?.companyName}? This action will permanently remove all isolated tenant databases, subscriptions, and payment records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(parsedId, {
              onSuccess: () => router.replace('/superadmin/tenants')
            });
          }
        }
      ]
    );
  };

  // Suspend Action
  const handleSuspendSubmit = () => {
    if (!suspendReason.trim()) {
      setSuspendReasonError('Please provide a reason for suspension');
      return;
    }
    setSuspendReasonError('');
    suspendMutation.mutate({
      id: parsedId,
      reason: suspendReason
    }, {
      onSuccess: () => {
        setSuspendModalVisible(false);
        setSuspendReason('');
      }
    });
  };

  // Lock Action
  const handleLockToggle = () => {
    if (tenant?.isActive) {
      lockMutation.mutate(parsedId);
    } else {
      unlockMutation.mutate(parsedId);
    }
  };

  // Suspend/Activate Action
  const handleSuspendToggle = () => {
    if (tenant?.isSuspended) {
      activateMutation.mutate(parsedId);
    } else {
      setSuspendModalVisible(true);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={['bottom', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={{ color: subTextColor, fontSize: 12, fontWeight: '600', marginTop: 8 }}>Loading tenant details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !tenant) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={['bottom', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginTop: 16 }}>Error Loading Tenant</Text>
          <Text style={{ color: subTextColor, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            {(error as any)?.message || 'Tenant workspace not found or has been deleted.'}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/superadmin/tenants-hub')} style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 10 }}>
            <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Set status labels
  const getStatusString = () => {
    if (tenant.isSuspended) return 'Suspended';
    if (!tenant.isActive) return 'Locked';
    return 'Active';
  };

  const getStatusColor = () => {
    if (tenant.isSuspended) {
      return {
        text: '#dc2626',
        bg: isDark ? '#7f1d1d40' : '#fef2f2',
        border: isDark ? '#7f1d1d' : '#fca5a5',
      };
    }
    if (!tenant.isActive) {
      return {
        text: '#d97706',
        bg: isDark ? '#78350f40' : '#fffbeb',
        border: isDark ? '#78350f' : '#fef3c7',
      };
    }
    return {
      text: '#0284c7',
      bg: isDark ? '#1e3a8a30' : '#e0f2fe',
      border: isDark ? '#1d4ed850' : '#bae6fd',
    };
  };

  const isMutationPending =
    activateMutation.isPending ||
    suspendMutation.isPending ||
    lockMutation.isPending ||
    unlockMutation.isPending ||
    deleteMutation.isPending;

  const statusColors = getStatusColor();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: insets.top }} edges={['bottom', 'left', 'right']}>
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        {/* Title Block */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>Workspace Details</Text>
            {tenant && (
              <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
                Manage workspace for {tenant.companyName}
              </Text>
            )}
          </View>
          {tenant && (
            <TouchableOpacity
              onPress={() => router.push(`/superadmin/edit-tenant/${parsedId}` as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#1e73be',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
              }}
            >
              <Ionicons name="create-outline" size={14} color="#fff" />
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Main Card with status */}
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>{tenant.companyName}</Text>
                <Text style={{ color: subTextColor, fontSize: 12, marginTop: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {tenant.subdomain}.uproptech.com
                </Text>
              </View>
              <View style={{
                backgroundColor: statusColors.bg,
                borderColor: statusColors.border,
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}>
                <Text style={{ color: statusColors.text, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{getStatusString()}</Text>
              </View>
            </View>

            {tenant.isSuspended && tenant.suspendedReason && (
              <View style={{ backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2', borderWidth: 1, borderColor: isDark ? '#7f1d1d50' : '#fecaca', borderRadius: 12, padding: 14, marginTop: 16 }}>
                <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 12 }}>Suspension Reason:</Text>
                <Text style={{ color: isDark ? '#fca5a5' : '#b91c1c', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>"{tenant.suspendedReason}"</Text>
              </View>
            )}
          </View>

          {/* Configuration Card */}
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: '#1e73be', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              Technical Details
            </Text>

            {/* Connection String */}
            {/* <View style={{ marginBottom: 16 }}>
              <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Isolated Database URL</Text>
              <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderWidth: 1, borderColor: borderCol, borderRadius: 12, padding: 12, marginTop: 6 }}>
                <Text style={{ color: textColor, fontSize: 12, fontFamily: 'monospace' }} numberOfLines={3}>
                  {tenant.connectionString || 'Generates automatically on trial provisioning'}
                </Text>
              </View>
            </View> */}

            {/* General Grid details */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: borderCol, paddingTop: 12 }}>
              <View style={{ width: '50%', marginBottom: 12 }}>
                <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Plan Tier</Text>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '600', marginTop: 4 }}>{tenant.plan}</Text>
              </View>
              <View style={{ width: '50%', marginBottom: 12 }}>
                <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Max Users Limit</Text>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '600', marginTop: 4 }}>{tenant.maxUsers} Users</Text>
              </View>
              <View style={{ width: '50%' }}>
                <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Referral Code</Text>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '600', marginTop: 4 }}>{tenant.referral || 'Direct Registration'}</Text>
              </View>
              <View style={{ width: '50%' }}>
                <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Registration Date</Text>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '600', marginTop: 4 }}>
                  {new Date(tenant.createdOn).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Details Card */}
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: '#1e73be', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              Contact Information
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 8, borderRadius: 20 }}>
                <Ionicons name="person" size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
              </View>
              <View>
                <Text style={{ color: subTextColor, fontSize: 10, textTransform: 'uppercase' }}>Contact Person</Text>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{tenant.contactPerson}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 8, borderRadius: 20 }}>
                <Ionicons name="mail" size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
              </View>
              <View>
                <Text style={{ color: subTextColor, fontSize: 10, textTransform: 'uppercase' }}>Email Address</Text>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{tenant.email}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 8, borderRadius: 20 }}>
                <Ionicons name="phone-portrait" size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
              </View>
              <View>
                <Text style={{ color: subTextColor, fontSize: 10, textTransform: 'uppercase' }}>Phone Number</Text>
                <Text style={{ color: textColor, fontSize: 14, fontWeight: '600' }}>{tenant.phone || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Action Operations Card */}
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 20, gap: 12 }}>
            <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Danger Zone Operations
            </Text>

            {/* Lock/Unlock Button */}
            <TouchableOpacity
              onPress={handleLockToggle}
              disabled={isMutationPending}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tenant.isActive ? (isDark ? '#78350f' : '#fef3c7') : (isDark ? '#064e3b' : '#bbf7d0'),
                backgroundColor: tenant.isActive ? (isDark ? '#78350f40' : '#fffbeb') : (isDark ? '#064e3b40' : '#f0fdf4'),
              }}
            >
              <Ionicons
                name={tenant.isActive ? 'lock-closed-outline' : 'lock-open-outline'}
                size={16}
                color={tenant.isActive ? '#d97706' : '#16a34a'}
              />
              <Text style={{ fontWeight: '700', fontSize: 12, color: tenant.isActive ? '#d97706' : '#16a34a' }}>
                {tenant.isActive ? 'Lock Workspace' : 'Unlock Workspace'}
              </Text>
            </TouchableOpacity>

            {/* Suspend/Activate Button */}
            <TouchableOpacity
              onPress={handleSuspendToggle}
              disabled={isMutationPending}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tenant.isSuspended ? (isDark ? '#064e3b' : '#bbf7d0') : (isDark ? '#7f1d1d' : '#fca5a5'),
                backgroundColor: tenant.isSuspended ? (isDark ? '#064e3b40' : '#f0fdf4') : (isDark ? '#7f1d1d40' : '#fef2f2'),
              }}
            >
              <Ionicons
                name={tenant.isSuspended ? 'checkmark-circle-outline' : 'ban-outline'}
                size={16}
                color={tenant.isSuspended ? '#16a34a' : '#dc2626'}
              />
              <Text style={{ fontWeight: '700', fontSize: 12, color: tenant.isSuspended ? '#16a34a' : '#dc2626' }}>
                {tenant.isSuspended ? 'Activate Workspace' : 'Suspend Workspace'}
              </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={handleDeleteConfirm}
              disabled={isMutationPending}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#dc2626',
                backgroundColor: '#dc2626',
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>Delete Organization</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Custom Suspend dialog Modal (Fully compatible with Android and iOS) */}
        <Modal
          visible={suspendModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSuspendModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
            <View style={{ backgroundColor: modalBg, borderRadius: 24, width: '100%', padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10, borderWidth: 1, borderColor: borderCol, flexDirection: 'column' }}>
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Suspend {tenant.companyName}</Text>
              <Text style={{ color: subTextColor, fontSize: 12, marginBottom: 16 }}>
                Please provide the reason for suspending this workspace. The reason will be visible to their administrators.
              </Text>

              <TextInput
                multiline
                numberOfLines={3}
                style={{
                  textAlignVertical: 'top',
                  borderWidth: 1,
                  borderColor: suspendReasonError ? '#dc2626' : borderCol,
                  backgroundColor: suspendReasonError ? (isDark ? '#7f1d1d20' : '#fef2f2') : inputBg,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  minHeight: 80,
                  marginBottom: 16,
                  color: textColor,
                }}
                placeholder="e.g. Non-payment of subscription dues"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={suspendReason}
                onChangeText={(v) => {
                  setSuspendReason(v);
                  if (v.trim()) setSuspendReasonError('');
                }}
              />
              {suspendReasonError && (
                <Text style={{ color: '#dc2626', fontSize: 10, marginBottom: 12, fontWeight: '600' }}>{suspendReasonError}</Text>
              )}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSuspendModalVisible(false);
                    setSuspendReason('');
                    setSuspendReasonError('');
                  }}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  }}
                >
                  <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontWeight: '700', fontSize: 12 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSuspendSubmit}
                  style={{
                    flex: 1,
                    backgroundColor: '#dc2626',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>Suspend</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* <BottomNav active="tenants" /> */}
      </View>
    </SafeAreaView>
  );
}
