import React, { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useRouter, usePathname, useSegments, useNavigationContainerRef } from 'expo-router';
import { useAuthStore } from '../auth/store/authStore';
import { handleDoubleBackToExit, resetDoubleBackState } from '../hooks/useDoubleBackToExit';
import {
  setActiveNavigationContext,
  resetNavigationLock,
  getDuplicateRouteCount,
} from '../navigation/safeNavigation';

interface GlobalNavigationHandlerProps {
  /** Optional callback to close any open root-level modal before navigating */
  isModalOpen?: boolean;
  onCloseModal?: () => void;
}

/**
 * Global centralized navigation handler for Android hardware back button and system back gestures.
 * - Respects React Navigation hierarchy and nested stacks (`canGoBack()` -> `goBack()`).
 * - Automatically detects and skips duplicate screens in the stack so Back returns to the true unique previous screen.
 * - Preserves native iOS swipe-back gestures without interference.
 * - Handles child/tab screens where `canGoBack()` might be false by navigating back to the root dashboard.
 * - Activates Double-Press-to-Exit confirmation toast ONLY on actual application root screens.
 */
export function GlobalNavigationHandler({
  isModalOpen,
  onCloseModal,
}: GlobalNavigationHandlerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const navigationRef = useNavigationContainerRef();
  const lastBackPressTimeRef = useRef(0);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isImpersonating = useAuthStore((state) => state.isImpersonating);

  // Sync active navigation context and reset double back press state whenever route changes
  useEffect(() => {
    resetDoubleBackState();
    resetNavigationLock();
    setActiveNavigationContext(navigationRef, pathname);
  }, [pathname, navigationRef]);

  useEffect(() => {
    // Only Android handles hardware back button. On iOS, native gestures are preserved.
    if (Platform.OS !== 'android') {
      return;
    }

    const onHardwareBackPress = (): boolean => {
      const now = Date.now();
      // Debounce rapid back button bounce (within 350ms)
      if (now - lastBackPressTimeRef.current < 350) {
        return true;
      }
      lastBackPressTimeRef.current = now;

      // 1. If a modal or sheet is open at the root level, dismiss it first
      if (isModalOpen && onCloseModal) {
        onCloseModal();
        return true;
      }

      // 2. If the navigation stack can go back, navigate to the previous screen
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        resetDoubleBackState();
        resetNavigationLock();

        // Check if there are consecutive duplicate route instances at the top of the stack
        const duplicateCount = getDuplicateRouteCount(navigationRef);
        if (duplicateCount > 0) {
          // Pop past all duplicate instances so the user lands on the actual previous UNIQUE screen
          for (let i = 0; i <= duplicateCount; i++) {
            if (navigationRef.canGoBack()) {
              navigationRef.goBack();
            }
          }
        } else {
          navigationRef.goBack();
        }
        return true;
      }

      // 3. Navigation stack cannot go back. Check if current screen is the application root screen.
      const normalizedPath = (pathname || '').toLowerCase().replace(/\/+$/, '');
      const segmentsStr = segments.join('/').toLowerCase();
      const role = user?.role?.trim()?.toLowerCase();

      // Root screens per role / authentication status
      let expectedRoot = '/main-login';
      if (isAuthenticated) {
        if (role === 'superadmin') {
          expectedRoot = '/superadmin/dashboard';
        } else if (role === 'partner') {
          expectedRoot = '/admin/partnerdashboard';
        } else if (['admin', 'sales', 'agent'].includes(role || '') || isImpersonating) {
          expectedRoot = '/admin/dashboard';
        } else {
          expectedRoot = '/select-workspace';
        }
      }

      const isCurrentScreenRoot =
        normalizedPath === expectedRoot ||
        normalizedPath === '/admin/dashboard' ||
        normalizedPath === '/admin/partnerdashboard' ||
        normalizedPath === '/superadmin/dashboard' ||
        normalizedPath === '/select-workspace' ||
        normalizedPath === '/main-login' ||
        normalizedPath === '/login' ||
        normalizedPath === '/index' ||
        normalizedPath === '' ||
        segmentsStr === 'admin/dashboard' ||
        segmentsStr === 'admin/partnerdashboard' ||
        segmentsStr === 'superadmin/dashboard' ||
        segmentsStr === 'select-workspace' ||
        segmentsStr === 'main-login' ||
        segmentsStr === 'login';

      if (isCurrentScreenRoot) {
        // We are on the root screen: Double-Press-to-Exit
        return handleDoubleBackToExit({
          timeoutMs: 2000,
          message: 'Press back again to exit',
        });
      }

      // 4. We are on a child screen or tab screen, but canGoBack() was false
      // (e.g. user reached a tab via replace, or arrived via deep link / notification)
      // Return safely to the role's root dashboard instead of exiting the app.
      resetDoubleBackState();
      if (isAuthenticated) {
        if (role === 'superadmin') {
          router.replace('/superadmin/dashboard');
        } else if (role === 'partner') {
          router.replace('/admin/PartnerDashboard');
        } else if (['admin', 'sales', 'agent'].includes(role || '') || isImpersonating) {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/select-workspace');
        }
      } else {
        router.replace('/main-login');
      }

      return true;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBackPress
    );

    return () => {
      backSubscription.remove();
    };
  }, [
    isModalOpen,
    onCloseModal,
    navigationRef,
    pathname,
    segments,
    isAuthenticated,
    user,
    isImpersonating,
    router,
  ]);

  return null;
}

