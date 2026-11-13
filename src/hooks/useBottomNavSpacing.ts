import { Platform } from 'react-native';
import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../auth/store/authStore';

export interface BottomNavSpacingOptions {
  /**
   * Explicit override for whether bottom nav is present.
   * If omitted, automatically determined by current route segments and user role.
   */
  hasBottomNav?: boolean;
  /**
   * Additional clearance padding (in px) above the bottom navigation bar or screen edge.
   * Defaults to 24px when bottom nav is present, 16px when not present.
   */
  extraPadding?: number;
  /**
   * Measured height of any fixed bottom footer (e.g. action buttons container).
   * This is added to the total scroll padding so content scrolls completely above the footer.
   */
  footerHeight?: number;
  /**
   * Whether to include the device safe-area inset (insets.bottom).
   * Note: The root `_layout.tsx` wraps the app in a SafeAreaView with edge 'bottom',
   * so by default `includeSafeArea` is false to avoid double padding.
   * Set true only if the component is rendered outside the root SafeAreaView or inside a custom modal.
   */
  includeSafeArea?: boolean;
}

export interface BottomNavSpacingResult {
  /**
   * Total bottom clearance to apply to ScrollView/FlatList contentContainerStyle.
   */
  bottomSpacing: number;
  /**
   * Base physical height of the bottom navigation bar dock.
   */
  baseDockHeight: number;
  /**
   * Whether bottom navigation is active for the current screen.
   */
  hasBottomNav: boolean;
  /**
   * Bottom offset for positioning fixed bottom action containers directly above the dock.
   */
  footerBottomOffset: number;
  /**
   * Resolved safe-area bottom inset.
   */
  safeAreaBottom: number;
}

export function useBottomNavSpacing(options: BottomNavSpacingOptions = {}): BottomNavSpacingResult {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.trim()?.toLowerCase();

  const isSuperAdminFlow =
    (segments[0] as string) === 'superadmin' ||
    (['profile', 'change-password', 'select-workspace'].includes(segments[0] as string) && userRole === 'superadmin');

  const isAdminFlow =
    (segments[0] as string) === 'admin' ||
    (['profile', 'change-password', 'select-workspace'].includes(segments[0] as string) && userRole !== 'superadmin');

  // By default, bottom nav is present in both Admin and SuperAdmin flows
  const defaultHasBottomNav = isAdminFlow || isSuperAdminFlow;
  const hasBottomNav = options.hasBottomNav !== undefined ? options.hasBottomNav : defaultHasBottomNav;

  // Physical dock footprints from BottomNav components:
  // Admin dock: height 62px + offset (iOS: 6, Android: 12, default: 10) = 68px (iOS), 74px (Android)
  // SuperAdmin dock: height 64px + offset (iOS: 8, Android: 14, default: 12) = 72px (iOS), 78px (Android)
  const navHeight = isSuperAdminFlow
    ? Platform.select({ ios: 72, android: 78, default: 76 })
    : Platform.select({ ios: 68, android: 74, default: 72 });

  const baseDockHeight = hasBottomNav ? navHeight : 0;
  const defaultExtra = hasBottomNav ? 28 : 16;
  const extraPadding = options.extraPadding !== undefined ? options.extraPadding : defaultExtra;
  const footerHeight = options.footerHeight || 0;
  const safeAreaBottom = options.includeSafeArea ? insets.bottom : 0;

  // Total bottom clearance for ScrollView / FlatList contentContainerStyle
  const bottomSpacing = baseDockHeight + footerHeight + extraPadding + safeAreaBottom;

  // Position offset for fixed floating footers so they sit directly above the bottom nav dock
  const footerBottomOffset = baseDockHeight + safeAreaBottom + (hasBottomNav ? 8 : 0);

  return {
    bottomSpacing,
    baseDockHeight,
    hasBottomNav,
    footerBottomOffset,
    safeAreaBottom,
  };
}

