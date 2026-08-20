import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { ChevronRight, Users, Shield } from 'lucide-react-native';
import { getAdminTheme } from '../../theme/adminTheme';
// import AppFooter from '../../auth/components/AppFooter';

export default function AdminUsers() {
  const { isDark } = useTheme();
  const router = useRouter();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const menuSections = [
    {
      title: 'User Management & Roles',
      items: [
        { title: 'Manage Users', icon: Users, desc: 'Add users, edit roles, and delete accounts', route: '/admin/usemanagement/ManageUsers', color: '#14b8a6' },
        { title: 'Roles Management', icon: Shield, desc: 'Create, modify, and assign user permissions', route: '/admin/usemanagement/RolesManagement', color: '#ef4444' },
      ],
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bgColor }} contentContainerStyle={{ padding: 16, paddingBottom: 70, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      {menuSections.map((sec, idx) => (
        <View key={idx} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
            {sec.title}
          </Text>
          <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: borderCol, overflow: 'hidden' }}>
            {sec.items.map((item, itemIdx) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={itemIdx}
                  onPress={() => router.push(item.route as any)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderBottomWidth: itemIdx === sec.items.length - 1 ? 0 : 1,
                    borderColor: borderCol,
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    backgroundColor: isDark ? `${item.color}15` : `${item.color}08`,
                    padding: 8,
                    borderRadius: 8,
                    marginRight: 16
                  }}>
                    <Icon size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{item.title}</Text>
                    <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>{item.desc}</Text>
                  </View>
                  <ChevronRight size={16} color={subTextColor} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
      {/* Footer */}
      {/* <AppFooter /> */}
    </ScrollView>
  );
}
