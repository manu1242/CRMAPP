import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../superadmin/components/Header';
import SidebarDrawer from '../../auth/components/SidebarDrawer';
import { useTheme } from '../../contexts/ThemeContext';

export default function TenantsHubScreen() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isDark } = useTheme();

  // Theme colors
  const bgColor = isDark ? '#161616' : '#FFFFFF';
  const cardBg = isDark ? '#242424' : '#ffffff';
  const textColor = isDark ? '#FFFFFF' : '#0a0a0a';
  const subTextColor = isDark ? '#a1a1aa' : '#52525b';
  const borderCol = isDark ? '#2e2e2e' : '#e4e4e7';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }} contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: textColor }}>Tenants Workspaces</Text>
          <Text style={{ fontSize: 13, color: subTextColor, marginTop: 4 }}>Manage active tenant organizations and provision new workspaces.</Text>
        </View>

        {/* Cards container */}
        <View style={{ gap: 16 }}>
          {/* 1. Tenants List */}
          <TouchableOpacity
            onPress={() => router.push('/superadmin/tenants')}
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
              <Ionicons name="business-outline" size={24} color="#835CEE" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Tenants List</Text>
              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>View all registered workspaces, modify metadata, active states, and database URLs.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={subTextColor} />
          </TouchableOpacity>

          {/* 2. Create Tenant */}
          <TouchableOpacity
            onPress={() => router.push('/superadmin/create-tenant')}
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
              <Ionicons name="add-circle-outline" size={24} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Create Tenant Workspace</Text>
              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>Provision a new tenant database instance, assign subscription plan, and configure contact details.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={subTextColor} />
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  );
}
