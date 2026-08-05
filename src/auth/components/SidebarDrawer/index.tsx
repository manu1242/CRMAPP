import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoute: string;
}

export default function SidebarDrawer({ isOpen, onClose, activeRoute }: SidebarDrawerProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const HeaderHieght = 62;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  const handleNavigation = (route: string) => {
    onClose();
    const liveRoutes = [
      '/superadmin/dashboard',
      '/superadmin/tenants',
      '/superadmin/create-tenant',
      '/superadmin/plans',
      '/superadmin/create-plan',
      '/superadmin/subscriptions',
      '/superadmin/subscriptions-hub',
      '/superadmin/inquiries',
      '/superadmin/payment-config',
      '/superadmin/settings',
      '/profile',
    ];
    if (liveRoutes.includes(route)) {
      router.replace(route as any);
    } else {
      Toast.show({
        type: 'info',
        text1: 'Feature Coming Soon',
        text2: 'This page is currently being developed.',
      });
    }
  };

  const handleLogoutClick = async () => {
    onClose();
    await logout();
    router.replace('/login');
  };

  if (!isOpen) return null;

  return (
    <View style={{ position: 'absolute', top: HeaderHieght, left: 0, right: 0, bottom: 0 }} className="z-50">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View 
          style={{ opacity: opacityAnim }} 
          className="absolute inset-0 bg-black/50" 
        />
      </TouchableWithoutFeedback>

      {/* Drawer Content */}
      <Animated.View
        style={{
          transform: [{ translateX: slideAnim }],
          width: DRAWER_WIDTH,
        }}
        className="absolute top-0 bottom-0 left-0 bg-[#0f172a] shadow-2xl flex-col"
      >
        {/* Drawer Header */}
        <View className="px-5 pt-4 pb-4 border-b border-slate-800 flex-col">
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="business" size={24} color="#0284c7" />
            <Text className="text-lg font-bold text-white tracking-wide font-display">RealEstate CRM</Text>
          </View>
          
          {/* Super Admin Badge Profile Container */}
          <View className="bg-amber-500/10 border border-yellow-500/20 rounded-xl p-3 flex-row items-center gap-3">
            <View className="bg-yellow-500/20 w-8 h-8 rounded-full items-center justify-center">
              <Text style={{ fontSize: 16 }}>👑</Text>
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 text-xxs font-semibold uppercase tracking-wider" style={{ fontSize: 9 }}>Logged in as</Text>
              <Text className="text-white text-sm font-bold mt-0.5">{user?.username || 'Super Admin'}</Text>
            </View>
          </View>
        </View>

        {/* Drawer Scroll Container */}
        <ScrollView className="flex-1 px-3 py-4" contentContainerStyle={{ paddingBottom: 30 }}>
          {/* Main Section */}
          <Text className="text-slate-500 text-xxs font-bold uppercase tracking-wider px-3 mb-2" style={{ fontSize: 9.5 }}>Main</Text>
          
          {/* Dashboard */}
          <TouchableOpacity 
            onPress={() => handleNavigation('/superadmin/dashboard')}
            className={`flex-row items-center gap-3 px-3 py-3 rounded-lg mb-2 ${
              activeRoute === 'dashboard' ? 'bg-sky-500/10 border border-sky-500/20' : ''
            }`}
          >
            <FontAwesome name="dashboard" size={18} color={activeRoute === 'dashboard' ? '#38bdf8' : '#64748b'} />
            <Text className={`font-semibold text-sm ${activeRoute === 'dashboard' ? 'text-white' : 'text-slate-300'}`}>Dashboard</Text>
          </TouchableOpacity>

          {/* Tenants */}
          <TouchableOpacity 
            onPress={() => handleNavigation('/superadmin/tenants')}
            className={`flex-row items-center gap-3 px-3 py-3 rounded-lg mb-2 ${
              activeRoute === 'tenants' ? 'bg-sky-500/10 border border-sky-500/20' : ''
            }`}
          >
            <FontAwesome name="database" size={18} color={activeRoute === 'tenants' ? '#38bdf8' : '#64748b'} />
            <Text className={`flex-1 font-semibold text-sm ${activeRoute === 'tenants' ? 'text-white' : 'text-slate-300'}`}>Tenants List</Text>
          </TouchableOpacity>

          {/* Create Tenant */}
          <TouchableOpacity 
            onPress={() => handleNavigation('/superadmin/create-tenant')}
            className={`flex-row items-center gap-3 px-3 py-3 rounded-lg mb-2 ${
              activeRoute === 'create-tenant' ? 'bg-sky-500/10 border border-sky-500/20' : ''
            }`}
          >
            <FontAwesome name="plus-circle" size={18} color={activeRoute === 'create-tenant' ? '#38bdf8' : '#64748b'} />
            <Text className={`font-semibold text-sm ${activeRoute === 'create-tenant' ? 'text-white' : 'text-slate-300'}`}>Create Tenant</Text>
          </TouchableOpacity>

          {/* Inquiries */}
          <TouchableOpacity 
            onPress={() => handleNavigation('/superadmin/inquiries')}
            className={`flex-row items-center gap-3 px-3 py-3 rounded-lg mb-4 ${
              activeRoute === 'inquiries' ? 'bg-sky-500/10 border border-sky-500/20' : ''
            }`}
          >
            <FontAwesome name="envelope" size={18} color={activeRoute === 'inquiries' ? '#38bdf8' : '#64748b'} />
            <Text className={`flex-1 font-semibold text-sm ${activeRoute === 'inquiries' ? 'text-white' : 'text-slate-300'}`}>Inquiries</Text>
          </TouchableOpacity>

          {/* Subscriptions Hub */}
          <Text className="text-slate-500 text-xxs font-bold uppercase tracking-wider px-3 mb-2" style={{ fontSize: 9.5 }}>Billing & Plans</Text>
          <TouchableOpacity 
            onPress={() => handleNavigation('/superadmin/subscriptions-hub')}
            className={`flex-row items-center gap-3 px-3 py-3 rounded-lg mb-2 ${
              activeRoute === 'subscriptions' ? 'bg-sky-500/10 border border-sky-500/20' : ''
            }`}
          >
            <FontAwesome name="credit-card" size={18} color={activeRoute === 'subscriptions' ? '#38bdf8' : '#64748b'} />
            <Text className={`font-semibold text-sm ${activeRoute === 'subscriptions' ? 'text-white' : 'text-slate-300'}`}>Subscriptions Hub</Text>
          </TouchableOpacity>

          {/* Account Profile */}
          <Text className="text-slate-500 text-xxs font-bold uppercase tracking-wider px-3 mb-2" style={{ fontSize: 9.5 }}>Account</Text>
          <TouchableOpacity 
            onPress={() => handleNavigation('/profile')}
            className={`flex-row items-center gap-3 px-3 py-3 rounded-lg mb-8 ${
              activeRoute === 'profile' ? 'bg-sky-500/10 border border-sky-500/20' : ''
            }`}
          >
            <FontAwesome name="user" size={18} color={activeRoute === 'profile' ? '#38bdf8' : '#64748b'} />
            <Text className={`font-semibold text-sm ${activeRoute === 'profile' ? 'text-white' : 'text-slate-300'}`}>My Profile</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Drawer Footer / Logout */}
        <View className="px-2 py-3 border-t border-slate-800 bg-[#0b0f19] mb-2">
          <TouchableOpacity 
            onPress={handleLogoutClick}
            className="flex-row items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 py-2.5 rounded-lg w-full"
          >
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text className="text-red-500 font-bold text-sm">Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
