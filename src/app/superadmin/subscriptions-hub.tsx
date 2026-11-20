import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../superadmin/components/Header';
import SidebarDrawer from '../../auth/components/SidebarDrawer';
import { useTheme } from '../../contexts/ThemeContext';
import { useBottomNavSpacing } from '../../hooks/useBottomNavSpacing';

export default function SubscriptionsHubScreen() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isDark } = useTheme();
  const { bottomSpacing } = useBottomNavSpacing();

  // Theme colors
  const bgColor = isDark ? '#161616' : '#FFFFFF';
  const cardBg = isDark ? '#242424' : '#ffffff';
  const textColor = isDark ? '#FFFFFF' : '#0a0a0a';
  const subTextColor = isDark ? '#a1a1aa' : '#52525b';
  const borderCol = isDark ? '#2e2e2e' : '#e4e4e7';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }} contentContainerStyle={{ paddingBottom: bottomSpacing + 20, flexGrow: 1 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: textColor }}>Subscriptions Management</Text>
          <Text style={{ fontSize: 13, color: subTextColor, marginTop: 4 }}>Configure subscription models and view tenant payment details.</Text>
        </View>

        {/* Cards container */}
        <View style={{ gap: 16 }}>
          {/* Primary Quick Access: My CRM Plan & CRM Transactions */}
          <TouchableOpacity
            onPress={() => router.push('/admin/subscriptions/crmplans')}
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#3b82f6',
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <View style={{ backgroundColor: isDark ? '#1e3a8a40' : '#dbeafe', padding: 12, borderRadius: 12, marginRight: 16 }}>
              <Ionicons name="ribbon-outline" size={24} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>My CRM Plan</Text>
                <View style={{ backgroundColor: '#3b82f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#ffffff' }}>CURRENT</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>Company plan status, usage quotas, active limits, and immediate upgrades.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/admin/subscriptions/crmtransactions')}
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#6366f1',
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#6366f1',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <View style={{ backgroundColor: isDark ? '#312e8140' : '#e0e7ff', padding: 12, borderRadius: 12, marginRight: 16 }}>
              <Ionicons name="receipt-outline" size={24} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>CRM Transactions</Text>
                <View style={{ backgroundColor: '#6366f1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#ffffff' }}>HISTORY</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>Monitor all CRM subscription payments, order IDs, retry payments and receipts.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6366f1" />
          </TouchableOpacity>

          {/* 1. Subscription Plans */}
          <TouchableOpacity
            onPress={() => router.push('/superadmin/plans')}
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <View style={{ backgroundColor: isDark ? '#065f4630' : '#dcfce7', padding: 12, borderRadius: 12, marginRight: 16 }}>
              <Ionicons name="list-circle-outline" size={24} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Subscription Plans</Text>
              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>Create, edit, and deactivate SaaS plans, pricing, limits, and support levels.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={subTextColor} />
          </TouchableOpacity>

          {/* 2. Tenant Subscriptions */}
          <TouchableOpacity
            onPress={() => router.push('/superadmin/subscriptions')}
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <View style={{ backgroundColor: isDark ? '#835CEE25' : '#835CEE15', padding: 12, borderRadius: 12, marginRight: 16 }}>
              <Ionicons name="people-outline" size={24} color="#835CEE" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Tenant Subscriptions</Text>
              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>View active cycles, assign plans to schools, manage trial periods and track revenue.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={subTextColor} />
          </TouchableOpacity>

          {/* 3. Owner Packages */}
          <TouchableOpacity
            onPress={() => router.push('/superadmin/owner-plans')}
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <View style={{ backgroundColor: isDark ? '#581c8730' : '#f5f3ff', padding: 12, borderRadius: 12, marginRight: 16 }}>
              <FontAwesome5 name="crown" size={20} color="#8b5cf6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Owner Packages</Text>
              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>Manage pricing, validity & lead unlock packages for property owners.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={subTextColor} />
          </TouchableOpacity>

          {/* 4. Owner Subscriptions */}
          <TouchableOpacity
            onPress={() => router.push('/superadmin/owner-subscriptions')}
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <View style={{ backgroundColor: isDark ? '#835CEE25' : '#835CEE15', padding: 12, borderRadius: 12, marginRight: 16 }}>
              <Ionicons name="id-card-outline" size={24} color="#835CEE" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Owner Subscriptions</Text>
              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>Track active owner subscriptions, search by mobile, toggle status, and assign access.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={subTextColor} />
          </TouchableOpacity>

          {/* 5. Payment Gateways Configuration */}
          <TouchableOpacity
            onPress={() => router.push('/superadmin/payment-config')}
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <View style={{ backgroundColor: isDark ? '#ec489925' : '#fce7f3', padding: 12, borderRadius: 12, marginRight: 16 }}>
              <Ionicons name="card-outline" size={24} color="#ec4899" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Payment Gateways</Text>
              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>Configure Razorpay & Cashfree platform credentials, keys and webhooks.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={subTextColor} />
          </TouchableOpacity>

          {/* 6. Payment Transactions */}
          <TouchableOpacity
            onPress={() => router.push('/admin/subscriptions/crmtransactions')}
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <View style={{ backgroundColor: isDark ? '#0284c725' : '#e0f2fe', padding: 12, borderRadius: 12, marginRight: 16 }}>
              <Ionicons name="receipt-outline" size={24} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Transactions & Invoices</Text>
              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>Monitor SaaS tenant transactions, gateway order IDs, and payment statuses.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={subTextColor} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
