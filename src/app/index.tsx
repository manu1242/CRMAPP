import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../auth/store/authStore';
import { useTheme } from '../contexts/ThemeContext';
import SplashView from '../auth/components/onboarding/SplashView';
import OnboardingView from '../auth/components/onboarding/OnboardingView';
import { AppInitService, AppInitResult } from '../auth/services/AppInitService';

// ─── App state machine ────────────────────────────────────────────────────────
type AppState =
  | 'splash'          // Showing splash + running boot init
  | 'onboarding'      // First-time user onboarding flow
  | 'routing'         // Init done — waiting to navigate
  | 'no-internet'     // No internet connectivity
  | 'server-down'     // Backend unreachable
  | 'maintenance';    // Backend in maintenance mode

export default function EntryScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  // Auth state (used only for final routing decision, not for session init)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // App boot state machine
  const [appState, setAppState] = useState<AppState>('splash');
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Track whether init has already run (prevent double-fire in StrictMode)
  const initRanRef = useRef(false);

  // ── 1. Fetch onboarding completed flag on mount ─────────────────────────────
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (__DEV__) {
        setOnboardingCompleted(false);
        return;
      }
      try {
        const completed = await AsyncStorage.getItem('crm_onboarding_completed');
        setOnboardingCompleted(completed === 'true');
      } catch {
        setOnboardingCompleted(false);
      }
    };
    checkOnboardingStatus();
  }, []);

  // ── 2. Run app init pipeline during splash ─────────────────────────────────
  const runInit = useCallback(async (forceRefresh = false) => {
    setIsRetrying(false);
    setAppState('splash');

    const result: AppInitResult = await AppInitService.run(() => {
      // status updates intentionally suppressed — splash shows no text
    }, forceRefresh);

    // Short pause so user can read the last status message
    await new Promise((r) => setTimeout(r, 400));

    if (!result.hasInternet) {
      setAppState('no-internet');
      return;
    }
    if (!result.backendReachable) {
      setAppState('server-down');
      return;
    }
    if (result.maintenance) {
      setAppState('maintenance');
      return;
    }

    // All checks passed — proceed to routing
    setAppState('routing');
  }, []);

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;
    runInit(false);
  }, [runInit]);

  // ── 3. Route once init finishes and onboarding flag is loaded ──────────────
  useEffect(() => {
    if (appState !== 'routing') return;
    if (onboardingCompleted === null) return;

    if (isAuthenticated) {
      const role = user?.role?.toLowerCase();
      if (role === 'superadmin') {
        router.replace('/superadmin/dashboard');
      } else if (role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/select-workspace');
      }
    } else {
      if (onboardingCompleted) {
        router.replace('/main-login');
      } else {
        setAppState('onboarding');
      }
    }
  }, [appState, onboardingCompleted, isAuthenticated, user, router]);

  // ── 4. Onboarding complete ─────────────────────────────────────────────────
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('crm_onboarding_completed', 'true');
    } catch {
      /* ignore */
    }
    router.replace('/main-login');
  };

  // ── 5. Retry handler (for error screens) ──────────────────────────────────
  const handleRetry = () => {
    initRanRef.current = false;
    setIsRetrying(true);
    runInit(true);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  // Splash screen (shown during init and on retry)
  if (appState === 'splash' || isRetrying) {
    return (
      <SplashView onFinish={() => {}} />
    );
  }

  // Onboarding flow
  if (appState === 'onboarding') {
    return (
      <OnboardingView
        isDark={isDark}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // ── Error screens ──────────────────────────────────────────────────────────
  if (appState === 'no-internet') {
    return (
      <ErrorScreen
        emoji="📡"
        title="No Internet Connection"
        message="Please check your Wi-Fi or mobile data and try again."
        onRetry={handleRetry}
        isDark={isDark}
      />
    );
  }

  if (appState === 'server-down') {
    return (
      <ErrorScreen
        emoji="☁️"
        title="Server Unavailable"
        message="We couldn't reach the server. Please try again in a moment."
        onRetry={handleRetry}
        isDark={isDark}
      />
    );
  }

  if (appState === 'maintenance') {
    return (
      <MaintenanceScreen isDark={isDark} />
    );
  }

  // Intermediate routing state (very brief)
  return (
    <View style={[styles.center, { backgroundColor: isDark ? '#000000' : '#f8fafc' }]}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
}

// ─── Error Screen Component ───────────────────────────────────────────────────
function ErrorScreen({
  emoji,
  title,
  message,
  onRetry,
  isDark,
}: {
  emoji: string;
  title: string;
  message: string;
  onRetry: () => void;
  isDark: boolean;
}) {
  const bg = isDark ? '#0a0a0a' : '#f8fafc';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={[styles.center, { backgroundColor: bg }]}>
      <Text style={styles.errorEmoji}>{emoji}</Text>
      <Text style={[styles.errorTitle, { color: textPrimary }]}>{title}</Text>
      <Text style={[styles.errorMessage, { color: textSecondary }]}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Maintenance Screen Component ─────────────────────────────────────────────
function MaintenanceScreen({ isDark }: { isDark: boolean }) {
  const bg = isDark ? '#0a0a0a' : '#f8fafc';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={[styles.center, { backgroundColor: bg }]}>
      <Text style={styles.errorEmoji}>🔧</Text>
      <Text style={[styles.errorTitle, { color: textPrimary }]}>
        Under Maintenance
      </Text>
      <Text style={[styles.errorMessage, { color: textSecondary }]}>
        We're making some improvements.{'\n'}We'll be back shortly!
      </Text>
      <View style={styles.maintenanceBadge}>
        <Text style={styles.maintenanceBadgeText}>● Come back soon</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorEmoji: {
    fontSize: 52,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  maintenanceBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  maintenanceBadgeText: {
    color: '#eab308',
    fontSize: 12,
    fontWeight: '600',
  },
});
