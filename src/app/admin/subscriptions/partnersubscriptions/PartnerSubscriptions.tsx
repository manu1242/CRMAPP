import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '@/theme/adminTheme';
import {
  Users,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  X,
  CreditCard,
  Building,
  Calendar,
} from 'lucide-react-native';
import {
  subscriptionService,
  PartnerSubscriptionItem,
  PartnerSubStats,
  AssignSubscriptionPayload,
} from '../../../../admin/services/subscriptionService';

export default function PartnerSubscriptionsScreen() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [subscriptions, setSubscriptions] = useState<PartnerSubscriptionItem[]>([]);
  const [stats, setStats] = useState<PartnerSubStats>({
    totalSubscriptions: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
  });

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignForm, setAssignForm] = useState<AssignSubscriptionPayload>({
    channelPartnerId: 1,
    planId: 1,
    billingCycle: 'Monthly',
    amount: 1999,
    autoRenew: true,
    paymentMethod: 'Razorpay',
  });

  const fetchPartnerSubscriptions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await subscriptionService.getPartnerSubscriptions({
        search,
        status: statusFilter,
      });
      if (res && res.success && res.data) {
        setSubscriptions(res.data.subscriptions || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err: any) {
      console.warn('Error fetching partner subscriptions:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchPartnerSubscriptions();
  }, [fetchPartnerSubscriptions]);

  const handleAssignSubscription = async () => {
    setAssignLoading(true);
    try {
      const res = await subscriptionService.assignPartnerSubscription(assignForm);
      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Subscription Assigned',
          text2: res.message || 'Plan assigned successfully to partner!',
        });
        setIsAssignModalOpen(false);
        fetchPartnerSubscriptions();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Assign Failed',
          text2: res?.message || 'Failed to assign plan',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err?.message || 'Error assigning subscription',
      });
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Header Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: '#a855f720',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Building size={20} color="#a855f7" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Partner Subscriptions</Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsAssignModalOpen(true)}
          style={{
            backgroundColor: '#a855f7',
            paddingHorizontal: 14,
            height: 38,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>Assign Plan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchPartnerSubscriptions(true)} />
        }
      >
        {/* KPI Stats Cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 10 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Total</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, marginTop: 2 }}>
              {stats.totalSubscriptions}
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 10 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Active</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#10b981', marginTop: 2 }}>
              {stats.active}
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 10 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Expiring</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#f59e0b', marginTop: 2 }}>
              {stats.expiringSoon}
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, padding: 10 }}>
            <Text style={{ fontSize: 11, color: subTextColor }}>Expired</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#ef4444', marginTop: 2 }}>
              {stats.expired}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={{
            height: 42,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: borderCol,
            backgroundColor: cardBg,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Search size={16} color={subTextColor} />
          <TextInput
            style={{ flex: 1, color: textColor, fontSize: 13 }}
            placeholder="Search partner or plan..."
            placeholderTextColor={subTextColor}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Partner Subscriptions List */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#a855f7" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading partner subscriptions...</Text>
          </View>
        ) : subscriptions.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Building size={36} color={subTextColor} />
            <Text style={{ marginTop: 10, color: subTextColor, fontSize: 14 }}>No partner subscriptions found</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {subscriptions.map((sub) => (
              <View
                key={sub.subscriptionId}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: borderCol,
                  padding: 16,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                      {sub.partnerName}
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                      {sub.email} • {sub.contactPerson || 'N/A'}
                    </Text>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: sub.status === 'Active' ? '#10b98115' : '#ef444415',
                      borderWidth: 1,
                      borderColor: sub.status === 'Active' ? '#10b98140' : '#ef444440',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: sub.status === 'Active' ? '#10b981' : '#ef4444',
                      }}
                    >
                      {sub.status}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    backgroundColor: bgColor,
                    borderRadius: 10,
                    padding: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{sub.planName}</Text>
                    <Text style={{ fontSize: 11, color: subTextColor }}>{sub.billingCycle} Plan</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#a855f7' }}>
                    ₹{sub.amount}
                  </Text>
                </View>

                {/* Usage metrics */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    Agents: <Text style={{ fontWeight: '700', color: textColor }}>{sub.currentAgentCount}</Text>
                  </Text>

                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    Leads: <Text style={{ fontWeight: '700', color: textColor }}>{sub.currentMonthLeads}</Text>
                  </Text>

                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    Storage: <Text style={{ fontWeight: '700', color: textColor }}>{sub.currentStorageUsedGB} GB</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ASSIGN PLAN MODAL */}
      <Modal visible={isAssignModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Assign Subscription Plan</Text>
              <TouchableOpacity onPress={() => setIsAssignModalOpen(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Partner ID *
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    color: textColor,
                    backgroundColor: bgColor,
                    fontSize: 13,
                  }}
                  keyboardType="number-pad"
                  value={String(assignForm.channelPartnerId)}
                  onChangeText={(val) => setAssignForm({ ...assignForm, channelPartnerId: parseInt(val) || 1 })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Plan ID *
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    color: textColor,
                    backgroundColor: bgColor,
                    fontSize: 13,
                  }}
                  keyboardType="number-pad"
                  value={String(assignForm.planId)}
                  onChangeText={(val) => setAssignForm({ ...assignForm, planId: parseInt(val) || 1 })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Amount (₹)
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    color: textColor,
                    backgroundColor: bgColor,
                    fontSize: 13,
                  }}
                  keyboardType="number-pad"
                  value={String(assignForm.amount)}
                  onChangeText={(val) => setAssignForm({ ...assignForm, amount: parseFloat(val) || 0 })}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setIsAssignModalOpen(false)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: borderCol,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: subTextColor, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAssignSubscription}
                disabled={assignLoading}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  backgroundColor: '#a855f7',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {assignLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
