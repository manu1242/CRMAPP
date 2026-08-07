import React, { useEffect, useRef } from 'react';
import { initRemoteConfig } from '../api/remoteConfig';
import { DarkTheme, DefaultTheme, ThemeProvider as ExpoThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { Stack, useRouter, useSegments } from 'expo-router';
import Toast from 'react-native-toast-message';
import { setupInterceptors } from '../api/interceptors';
import { useAuthStore } from '../auth/store/authStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { NetworkProvider, useNetwork } from '../contexts/NetworkContext';
import * as Updates from 'expo-updates';
import { WifiOff, X, Sparkles } from 'lucide-react-native';
import '../styles/globals.css';
import { wrapObserveRoot } from '../api/observe';

// Initialize Axios interceptors
setupInterceptors();

import { QueryPersister } from '../api/queryPersister';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes stale time
      gcTime: 24 * 60 * 60 * 1000, // 24 hours cache retention
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Do not retry 4xx errors (unauthorized, forbidden, not found)
        const status = error?.response?.status || error?.status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // exponential backoff
    },
  },
});

// Configure TanStack onlineManager with NetInfo listener for network state changes
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Restore persisted cache on app start
QueryPersister.restoreCache(queryClient);

// Subscribe to cache changes to persist data
queryClient.getQueryCache().subscribe(() => {
  QueryPersister.saveCache(queryClient);
});

// Auth-aware navigation guard component
function AuthGuardLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const isImpersonating = useAuthStore((state) => state.isImpersonating);

  // ── Impersonation-stop guard ──────────────────────────────────────────────
  // When impersonation ends, the auth state briefly has role='partner' + isImpersonating=false
  // while still on an /admin/* route. We suppress the guard for 800ms so InnerLayout's
  // useEffect can navigate to /admin/dashboard before the guard fires.
  const prevImpersonatingRef = useRef(isImpersonating);
  const suppressGuardRef = useRef(false);

  useEffect(() => {
    if (prevImpersonatingRef.current === true && isImpersonating === false) {
      // Impersonation just stopped — suppress the unauthorized guard briefly
      suppressGuardRef.current = true;
      const t = setTimeout(() => { suppressGuardRef.current = false; }, 800);
      prevImpersonatingRef.current = false;
      return () => clearTimeout(t);
    }
    prevImpersonatingRef.current = isImpersonating;
  }, [isImpersonating]);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isLoading) return; // Wait until session check is done
    if (suppressGuardRef.current) return; // Suppress during impersonation-stop transition

    const publicRoutes = ['login', 'main-login', 'register', 'forgot-password', 'reset-password', 'index', ''];
    const inPublicRoute = publicRoutes.includes(segments[0] as string) || segments[0] === undefined;
    const role = user?.role?.trim()?.toLowerCase();

    if (isAuthenticated && inPublicRoute) {
      // User is logged in but on a public/auth screen — send to dashboard
      if (role === 'superadmin') {
        router.replace('/superadmin/dashboard');
      } else if (role === 'admin' || isImpersonating) {
        // For impersonating a partner-role user, show the Partner Dashboard
        if (isImpersonating && role === 'partner') {
          router.replace('/admin/PartnerDashboard');
        } else {
          router.replace('/admin/dashboard');
        }
      } else {
        router.replace('/select-workspace');
      }
    } else if (!isAuthenticated && !inPublicRoute) {
      // User is not logged in but on a protected screen — send to login
      router.replace('/main-login');
    } else if (isAuthenticated && !inPublicRoute) {
      // Namespace guards
      if (segments[0] === 'superadmin' && role !== 'superadmin') {
        Toast.show({
          type: 'error',
          text1: 'Unauthorized',
          text2: 'You do not have permission to access superadmin pages.',
        });
        if (role === 'admin' || isImpersonating) {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/select-workspace');
        }
      } else if (segments[0] === 'admin' && role !== 'admin' && !isImpersonating) {
        // Skip warning if user is impersonating, allowing them to test the admin panel
        Toast.show({
          type: 'error',
          text1: 'Unauthorized',
          text2: 'You do not have permission to access admin pages.',
        });
        if (role === 'superadmin') {
          router.replace('/superadmin/dashboard');
        } else {
          router.replace('/select-workspace');
        }
      } else if (segments[0] === 'select-workspace') {
        if (role === 'superadmin') {
          router.replace('/superadmin/dashboard');
        } else if (role === 'admin' || isImpersonating) {
          // If impersonating a non-admin user, still go to admin dashboard (same as web behavior)
          router.replace('/admin/dashboard');
        }
      }
    }
  }, [isAuthenticated, isLoading, segments, user, isImpersonating]);

  return null;
}

import SuperAdminHeader from '@/superadmin/components/Header';
import SuperAdminBottomNav from '@/superadmin/components/BottomNav';
import AdminHeader from '@/admin/components/Header';
import AdminBottomNav from '@/admin/components/BottomNav';
import { BottomMenuSheet } from '@/admin/components/BottomMenuSheet';
import { View, StatusBar, Text, TouchableOpacity, Alert, Modal, ActivityIndicator, Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { NavigationBar } from 'expo-navigation-bar';
import { LogOut } from 'lucide-react-native';
import { getAdminTheme } from '@/theme/adminTheme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OTAUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  adminTheme: any;
}

function OTAUpdateModal({ visible, onClose, isDark, adminTheme }: OTAUpdateModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: adminTheme.cardBg || (isDark ? '#1e293b' : '#ffffff'),
            borderRadius: 20,
            borderWidth: 1,
            borderColor: adminTheme.border || (isDark ? '#334155' : '#e2e8f0'),
            padding: 24,
            width: '100%',
            maxWidth: 340,
            alignItems: 'center',
            gap: 16,
            position: 'relative',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
            elevation: 5,
          }}
        >
          {/* Close Button (Cross Mark) */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              padding: 4,
              borderRadius: 12,
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              zIndex: 10,
            }}
          >
            <X size={18} color={adminTheme.textSecondary || (isDark ? '#94a3b8' : '#64748b')} />
          </TouchableOpacity>

          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#10b98115',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#10b98130',
              marginTop: 8,
            }}
          >
            <Sparkles size={28} color="#10b981" />
          </View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: adminTheme.textPrimary || (isDark ? '#ffffff' : '#0f172a'),
              textAlign: 'center',
            }}
          >
            Update Available!
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: adminTheme.textSecondary || (isDark ? '#94a3b8' : '#64748b'),
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            A new version of the app is ready. Restart now to apply the latest changes and improvements.
          </Text>

          <TouchableOpacity
            onPress={async () => {
              try {
                await Updates.reloadAsync();
              } catch (err) {
                console.error('Failed to reload app:', err);
              }
            }}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 10,
              backgroundColor: '#10b981',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
              Restart App
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function InnerLayout() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isConnected } = useNetwork();
  const segments = useSegments();
  const adminTheme = getAdminTheme(isDark);
  const user = useAuthStore((state) => state.user);
  const isImpersonating = useAuthStore((state) => state.isImpersonating);
  const impersonatedUsername = useAuthStore((state) => state.impersonatedUsername);
  const stopImpersonation = useAuthStore((state) => state.stopImpersonation);
  const isLoading = useAuthStore((state) => state.isLoading);
  const userRole = user?.role?.trim()?.toLowerCase();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isStopConfirmOpen, setIsStopConfirmOpen] = React.useState(false);
  const [isStopping, setIsStopping] = React.useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = React.useState(false);

  useEffect(() => {
    async function checkOTAUpdates() {
      if (__DEV__) return;
      try {
        const updateCheck = await Updates.checkForUpdateAsync();
        if (updateCheck.isAvailable) {
          await Updates.fetchUpdateAsync();
          setIsUpdateModalVisible(true);
        }
      } catch (error) {
        console.warn('OTA Check failed:', error);
      }
    }
    
    const timer = setTimeout(() => {
      checkOTAUpdates();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const isSuperAdminFlow = (segments[0] as string) === 'superadmin' || 
    (['profile', 'change-password', 'select-workspace'].includes(segments[0] as string) && userRole === 'superadmin');

  const isAdminFlow = (segments[0] as string) === 'admin' || 
    (['profile', 'change-password', 'select-workspace'].includes(segments[0] as string) && userRole === 'admin');

  // Sync Android System Navigation Bar & Root Background Color to match Active Login Theme
  useEffect(() => {
    if (Platform.OS === 'android') {
      const activeNavBg = isSuperAdminFlow
        ? (isDark ? '#0f172a' : '#ffffff')
        : adminTheme.cardBg;

      SystemUI.setBackgroundColorAsync(activeNavBg).catch(() => {});
    }
  }, [isDark, isSuperAdminFlow, adminTheme.cardBg]);

  // Track when impersonation stops and navigate back to correct dashboard
  // Uses isLoading as a gate: navigates as soon as loading finishes after impersonation ends
  const wasImpersonatingRef = useRef(isImpersonating);
  useEffect(() => {
    // Wait until isLoading settles, then check if impersonation just ended
    if (!isLoading && wasImpersonatingRef.current === true && isImpersonating === false) {
      // Impersonation just ended — go back to correct dashboard
      if (userRole === 'superadmin') {
        router.replace('/superadmin/dashboard');
      } else {
        router.replace('/admin/dashboard');
      }
    }
    // Only update the ref when NOT loading (avoid false transitions mid-load)
    if (!isLoading) {
      wasImpersonatingRef.current = isImpersonating;
    }
  }, [isImpersonating, isLoading, userRole]);

  const isPublicRoute = ['login', 'main-login', 'register', 'forgot-password', 'reset-password', 'index', ''].includes(segments[0] as string) || segments[0] === undefined;

  let activeTab: 'dashboard' | 'tenants' | 'inquiries' | 'subscriptions' | 'profile' = 'dashboard';
  let adminActiveTab: 'dashboard' | 'users' | 'settings' | 'profile' = 'dashboard';
  const path = segments.join('/');

  if (path.includes('superadmin/dashboard')) {
    activeTab = 'dashboard';
  } else if (path.includes('superadmin/tenants') || path.includes('superadmin/create-tenant') || path.includes('superadmin/edit-tenant')) {
    activeTab = 'tenants';
  } else if (path.includes('superadmin/inquiries')) {
    activeTab = 'inquiries';
  } else if (path.includes('superadmin/subscriptions') || path.includes('superadmin/plans') || path.includes('superadmin/create-plan')) {
    activeTab = 'subscriptions';
  } else if (path.includes('profile') || path.includes('superadmin/payment-config') || path.includes('superadmin/settings') || path.includes('superadmin/transactions')) {
    activeTab = 'profile';
  }

  if (path.includes('admin/dashboard')) {
    adminActiveTab = 'dashboard';
  } else if (path.includes('admin/users')) {
    adminActiveTab = 'users';
  } else if (path.includes('admin/settings')) {
    adminActiveTab = 'settings';
  } else if (path.includes('profile')) {
    adminActiveTab = 'profile';
  }

  const themeClass = isSuperAdminFlow ? 'superadmin-theme' : isAdminFlow ? 'admin-theme' : '';

  let headerComponent = null;
  let bottomNavComponent = null;

  if (isSuperAdminFlow) {
    headerComponent = <SuperAdminHeader />;
    bottomNavComponent = <SuperAdminBottomNav active={activeTab} />;
  } else if (isAdminFlow) {
    headerComponent = <AdminHeader onMenuPress={() => setIsMenuOpen(true)} />;
    bottomNavComponent = <AdminBottomNav active={adminActiveTab} />;
  }

  const stackComponent = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="main-login" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="select-workspace" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="admin/dashboard" />
      <Stack.Screen name="admin/PartnerDashboard" />
      <Stack.Screen name="admin/leads" />
      <Stack.Screen name="admin/users" />
      <Stack.Screen name="admin/settings" />
      <Stack.Screen name="admin/paymentconfig/index" />
      <Stack.Screen name="admin/bankaccountconfig/index" />
      <Stack.Screen name="admin/chatbot/index" />
      <Stack.Screen name="admin/Tasks/index" />
      <Stack.Screen name="admin/unassigned/index" />
      <Stack.Screen name="admin/teammanagement/Agent" />
      <Stack.Screen name="admin/teammanagement/CreateAgent" />
      <Stack.Screen name="admin/teammanagement/channelpartner/channel" />
      <Stack.Screen name="admin/teammanagement/channelpartner/createchannel" />
      <Stack.Screen name="admin/teammanagement/channelpartner/PartnerDetails" />
      <Stack.Screen name="superadmin/dashboard" />
      <Stack.Screen name="superadmin/tenants" />
      <Stack.Screen name="superadmin/tenants-hub" />
      <Stack.Screen name="superadmin/tenants/[id]" />
      <Stack.Screen name="superadmin/create-tenant" />
      <Stack.Screen name="superadmin/edit-tenant/[id]" />
      <Stack.Screen name="superadmin/plans" />
      <Stack.Screen name="superadmin/create-plan" />
      <Stack.Screen name="superadmin/subscriptions" />
      <Stack.Screen name="superadmin/subscriptions-hub" />
      <Stack.Screen name="superadmin/inquiries" />
      <Stack.Screen name="superadmin/transactions" />
      <Stack.Screen name="superadmin/payment-config" />
      <Stack.Screen name="superadmin/settings" />
      <Stack.Screen name="superadmin/profile" />
    </Stack>
  );

  if (isPublicRoute) {
    return (
      <ExpoThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <View className="flex-1 bg-primary-bg">
          {stackComponent}
        </View>
        <OTAUpdateModal 
          visible={isUpdateModalVisible} 
          onClose={() => setIsUpdateModalVisible(false)} 
          isDark={isDark} 
          adminTheme={adminTheme} 
        />
        <AuthGuardLayout />
        <Toast />
      </ExpoThemeProvider>
    );
  }

  return (
    <ExpoThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <NavigationBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView 
        className={`flex-1 bg-primary-bg ${themeClass}`} 
        style={{ backgroundColor: isAdminFlow ? adminTheme.primaryBg : undefined }}
        edges={['bottom', 'left', 'right']}
      >
        <View style={{ flex: 1 }}>
          {headerComponent}
          {!isConnected && (
            <View style={{
              backgroundColor: '#b91c1c',
              paddingVertical: 8,
              paddingHorizontal: 16,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
            }}>
              <WifiOff size={14} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                Offline Mode · Showing cached data
              </Text>
            </View>
          )}
          {isImpersonating && (
            <View style={{
              backgroundColor: '#eab308',
              paddingVertical: 8,
              paddingHorizontal: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#d97706',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13 }}>🕵️</Text>
                <Text style={{ color: '#1e293b', fontSize: 12, fontWeight: '700' }}>
                  Impersonating: {impersonatedUsername}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsStopConfirmOpen(true)}
                style={{
                  backgroundColor: '#1e293b',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>
                  Stop
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CUSTOM MODAL FOR STOPPING IMPERSONATION */}
          <Modal visible={isStopConfirmOpen} transparent animationType="fade">
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.6)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: adminTheme.cardBg || (isDark ? '#1e293b' : '#ffffff'),
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: adminTheme.border || (isDark ? '#334155' : '#e2e8f0'),
                  padding: 24,
                  width: '100%',
                  maxWidth: 360,
                  alignItems: 'center',
                  gap: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 5,
                  elevation: 5,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#ef444420',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#ef444440',
                  }}
                >
                  <LogOut size={28} color="#ef4444" />
                </View>

                <Text style={{ fontSize: 18, fontWeight: '700', color: adminTheme.textPrimary || (isDark ? '#ffffff' : '#0f172a'), textAlign: 'center' }}>
                  Stop Impersonation
                </Text>

                <Text style={{ fontSize: 13, color: adminTheme.textSecondary || (isDark ? '#94a3b8' : '#475569'), textAlign: 'center', lineHeight: 18 }}>
                  Are you sure you want to stop impersonating <Text style={{ fontWeight: '700' }}>{impersonatedUsername}</Text> and return to your original administrator context?
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => setIsStopConfirmOpen(false)}
                    disabled={isStopping}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: adminTheme.border || (isDark ? '#334155' : '#e2e8f0'),
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: adminTheme.textSecondary || (isDark ? '#94a3b8' : '#475569'), fontWeight: '600', fontSize: 13 }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      setIsStopping(true);
                      try {
                        await stopImpersonation();
                        setIsStopConfirmOpen(false);
                      } catch (err) {
                        console.error('Failed stopping impersonation:', err);
                      } finally {
                        setIsStopping(false);
                      }
                    }}
                    disabled={isStopping}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 10,
                      backgroundColor: '#ef4444',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {isStopping ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Stop</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <OTAUpdateModal 
            visible={isUpdateModalVisible} 
            onClose={() => setIsUpdateModalVisible(false)} 
            isDark={isDark} 
            adminTheme={adminTheme} 
          />
          <View style={{ flex: 1 }}>
            {stackComponent}
          </View>
          {bottomNavComponent}
        </View>
      </SafeAreaView>
      {isAdminFlow && (
        <BottomMenuSheet isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      )}
      <AuthGuardLayout />
      <Toast />
    </ExpoThemeProvider>
  );
}

function RootLayout() {
  useEffect(() => {
    // Fetch remote config (API URL), then hide the splash screen.
    // initRemoteConfig applies cached config instantly and refreshes from network.
    initRemoteConfig()
      .catch((err) => {
        console.warn('Remote config fetch failed, using fallback URL:', err);
      })
      .finally(() => {
        SplashScreen.hideAsync().catch((err) => {
          console.warn('Failed to hide splash screen:', err);
        });
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NetworkProvider>
            <InnerLayout />
          </NetworkProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default wrapObserveRoot(RootLayout);
