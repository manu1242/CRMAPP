import { router as expoRouter, useRouter as useExpoRouter } from 'expo-router';
import { useCallback, useRef } from 'react';

// Module-level state for global navigation deduplication and throttling
let activePathname = '';
let lastNavigationKey = '';
let lastNavigationTimestamp = 0;
let isNavigationInProgress = false;
let navigationCooldownTimer: ReturnType<typeof setTimeout> | null = null;
let navigationContainerRef: any = null;

// Configurable timing thresholds
const RAPID_TAP_THRESHOLD_MS = 600; // Block duplicate taps to identical target within 600ms
const MAX_LOCK_DURATION_MS = 800;  // Maximum lock time before auto-releasing guard

/**
 * Normalizes any route input (string, object with pathname/params) into
 * a clean comparable path, full unique key, and params map.
 */
export function normalizeHref(href: any): { path: string; fullKey: string; params: Record<string, any> } {
  if (!href) {
    return { path: '', fullKey: '', params: {} };
  }

  // Handle plain string routes (e.g. "/admin/leads/123", "/admin/leads?status=active")
  if (typeof href === 'string') {
    const trimmed = href.trim();
    const [pathPart, queryPart] = trimmed.split('?');
    const cleanPath = (pathPart || '').replace(/\/+$/, '') || '/';
    const params: Record<string, string> = {};

    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    const sortedQuery = Object.keys(params)
      .sort()
      .map((k) => `${k}=${encodeURIComponent(params[k])}`)
      .join('&');

    const fullKey = sortedQuery ? `${cleanPath}?${sortedQuery}` : cleanPath;
    return {
      path: cleanPath.toLowerCase(),
      fullKey: fullKey.toLowerCase(),
      params,
    };
  }

  // Handle object routes (e.g. { pathname: "/admin/properties/propertydetails", params: { id: 5 } })
  if (typeof href === 'object') {
    const rawPath = typeof href.pathname === 'string' ? href.pathname.trim() : '';
    const cleanPath = rawPath.replace(/\/+$/, '') || '/';
    const params: Record<string, any> =
      href.params && typeof href.params === 'object' ? { ...href.params } : {};

    const sortedQuery = Object.keys(params)
      .sort()
      .map((k) => `${k}=${encodeURIComponent(String(params[k]))}`)
      .join('&');

    const fullKey = sortedQuery ? `${cleanPath}?${sortedQuery}` : cleanPath;
    return {
      path: cleanPath.toLowerCase(),
      fullKey: fullKey.toLowerCase(),
      params,
    };
  }

  const str = String(href).trim().toLowerCase();
  return { path: str, fullKey: str, params: {} };
}

/**
 * Updates the active navigation context (current pathname and navigationRef)
 * called from root layout and global navigation handlers.
 */
export function setActiveNavigationContext(navigationRef: any, currentPathname?: string) {
  if (navigationRef) {
    navigationContainerRef = navigationRef;
  }
  if (typeof currentPathname === 'string') {
    activePathname = currentPathname.trim().replace(/\/+$/, '').toLowerCase();
  }
}

/**
 * Checks whether the requested destination route already exists in the active navigation stack.
 * If true, Expo Router's navigate() should be preferred over push() to avoid stacking duplicates.
 */
export function isRouteInStack(targetHref: any): boolean {
  if (!navigationContainerRef || !navigationContainerRef.isReady || !navigationContainerRef.isReady()) {
    return false;
  }

  try {
    const rootState = navigationContainerRef.getRootState();
    if (!rootState) return false;

    const { path: targetPath, params: targetParams } = normalizeHref(targetHref);
    if (!targetPath) return false;

    // Normalised route name without leading slash (e.g. "admin/leads", "admin/salesunit/bookings")
    const cleanTargetName = targetPath.replace(/^\//, '');

    let found = false;

    const searchRoutes = (routes: any[]) => {
      if (!routes || !Array.isArray(routes) || found) return;
      for (const r of routes) {
        if (!r) continue;
        const rName = (r.name || '').replace(/^\//, '').toLowerCase();
        const rPath = (r.path || '').replace(/^\//, '').toLowerCase();

        const nameMatches =
          rName === cleanTargetName ||
          rName === `${cleanTargetName}/index` ||
          `${rName}/index` === cleanTargetName;

        const pathMatches = rPath && (rPath === cleanTargetName || rPath === targetPath);

        if (nameMatches || pathMatches) {
          const targetKeys = Object.keys(targetParams);
          if (targetKeys.length === 0) {
            found = true;
            return;
          }
          const rParams = r.params || {};
          const allParamsMatch = targetKeys.every(
            (k) => String(targetParams[k]) === String(rParams[k])
          );
          if (allParamsMatch) {
            found = true;
            return;
          }
        }

        if (r.state?.routes) {
          searchRoutes(r.state.routes);
        }
      }
    };

    searchRoutes(rootState.routes || []);
    return found;
  } catch {
    return false;
  }
}

/**
 * Checks whether navigation to the given target is currently safe and allowed.
 * Prevents rapid double taps and navigations to the current route.
 */
export function canPerformNavigation(href: any, actionType: 'push' | 'navigate' | 'replace'): boolean {
  const now = Date.now();
  const { path: targetPath, fullKey: targetKey } = normalizeHref(href);

  if (!targetKey) {
    return false;
  }

  // 1. Guard against rapid double-taps to the exact same destination
  if (targetKey === lastNavigationKey && now - lastNavigationTimestamp < RAPID_TAP_THRESHOLD_MS) {
    if (__DEV__) {
      console.log(`[SafeNav] Blocked duplicate rapid tap to "${targetKey}" (${now - lastNavigationTimestamp}ms)`);
    }
    return false;
  }

  // 2. Guard against navigating to the screen the user is already on
  const currentPath = activePathname;
  if (currentPath && (targetPath === currentPath || targetKey === currentPath)) {
    if (__DEV__) {
      console.log(`[SafeNav] Blocked redundant navigation: already on "${targetKey}"`);
    }
    return false;
  }

  // 3. Check active route in navigationRef if available
  if (navigationContainerRef && navigationContainerRef.isReady && navigationContainerRef.isReady()) {
    try {
      const activeRoute = navigationContainerRef.getCurrentRoute();
      if (activeRoute) {
        const activeRoutePath = (activeRoute.path || activeRoute.name || '').replace(/^\//, '').toLowerCase();
        const cleanTarget = targetPath.replace(/^\//, '').toLowerCase();

        if (
          activeRoutePath === cleanTarget ||
          activeRoutePath === `${cleanTarget}/index` ||
          `${activeRoutePath}/index` === cleanTarget
        ) {
          // If params match or both have no params, we are already on this screen
          const targetKeys = Object.keys(normalizeHref(href).params);
          if (targetKeys.length === 0) {
            if (__DEV__) {
              console.log(`[SafeNav] Blocked redundant navigation via activeRoute: "${cleanTarget}"`);
            }
            return false;
          }
          const activeParams = activeRoute.params || {};
          const allParamsMatch = targetKeys.every(
            (k) => String(normalizeHref(href).params[k]) === String(activeParams[k])
          );
          if (allParamsMatch) {
            if (__DEV__) {
              console.log(`[SafeNav] Blocked redundant navigation with matching params: "${cleanTarget}"`);
            }
            return false;
          }
        }
      }
    } catch {
      // Ignore navigationRef read failures
    }
  }

  // Record this valid navigation attempt and arm lock
  lastNavigationKey = targetKey;
  lastNavigationTimestamp = now;
  isNavigationInProgress = true;

  if (navigationCooldownTimer) {
    clearTimeout(navigationCooldownTimer);
  }

  // Auto-release lock after threshold to prevent permanent stall
  navigationCooldownTimer = setTimeout(() => {
    isNavigationInProgress = false;
  }, MAX_LOCK_DURATION_MS);

  return true;
}

/**
 * Resets the in-progress navigation lock (e.g. after back button, state transition, or unmount).
 */
export function resetNavigationLock() {
  isNavigationInProgress = false;
  lastNavigationKey = '';
  lastNavigationTimestamp = 0;
  if (navigationCooldownTimer) {
    clearTimeout(navigationCooldownTimer);
    navigationCooldownTimer = null;
  }
}

/**
 * Counts consecutive duplicate routes at the top of the active navigation stack.
 * Used by BackHandler to pop past duplicate instances and return to the actual unique previous screen.
 */
export function getDuplicateRouteCount(navigationRef: any): number {
  if (!navigationRef || !navigationRef.isReady || !navigationRef.isReady()) {
    return 0;
  }

  try {
    const rootState = navigationRef.getRootState();
    if (!rootState) return 0;

    // Traverse to the currently focused leaf stack
    const activeStack: any[] = [];
    let currentLevel = rootState;

    while (currentLevel) {
      if (currentLevel.routes && currentLevel.routes.length > 0) {
        const activeIndex = currentLevel.index ?? currentLevel.routes.length - 1;
        for (let i = 0; i <= activeIndex; i++) {
          activeStack.push(currentLevel.routes[i]);
        }
        currentLevel = currentLevel.routes[activeIndex]?.state;
      } else {
        break;
      }
    }

    if (activeStack.length < 2) return 0;

    const topRoute = activeStack[activeStack.length - 1];
    let duplicateCount = 0;

    for (let i = activeStack.length - 2; i >= 0; i--) {
      const prevRoute = activeStack[i];
      if (
        prevRoute.name === topRoute.name &&
        JSON.stringify(prevRoute.params || {}) === JSON.stringify(topRoute.params || {})
      ) {
        duplicateCount++;
      } else {
        break;
      }
    }

    return duplicateCount;
  } catch {
    return 0;
  }
}

/**
 * Global Safe Router patch:
 * Monkey-patches Expo Router's singleton `router` object so that all existing
 * calls to router.push(), router.navigate(), and router.replace() throughout the app
 * automatically benefit from duplicate navigation protection and stack deduplication.
 */
export function installSafeRouter() {
  const routerObj = expoRouter as any;
  if (!routerObj || routerObj.__safe_router_installed) {
    return;
  }
  routerObj.__safe_router_installed = true;

  const rawPush = routerObj.push.bind(routerObj);
  const rawNavigate = routerObj.navigate.bind(routerObj);
  const rawReplace = routerObj.replace.bind(routerObj);

  // 1. Safe Push
  routerObj.push = (href: any, options?: any) => {
    if (!canPerformNavigation(href, 'push')) {
      return;
    }

    // If destination already exists in the stack, use navigate() instead of push()
    // to avoid creating duplicate instances in the stack (satisfies Requirement 4)
    if (isRouteInStack(href)) {
      if (__DEV__) {
        console.log('[SafeNav] Route already exists in stack, routing via navigate() to reuse instance:', href);
      }
      return rawNavigate(href, options);
    }

    return rawPush(href, options);
  };

  // 2. Safe Navigate
  routerObj.navigate = (href: any, options?: any) => {
    if (!canPerformNavigation(href, 'navigate')) {
      return;
    }
    return rawNavigate(href, options);
  };

  // 3. Safe Replace
  routerObj.replace = (href: any, options?: any) => {
    if (!canPerformNavigation(href, 'replace')) {
      return;
    }
    return rawReplace(href, options);
  };

  if (__DEV__) {
    console.log('[SafeNav] Global safe router installed successfully');
  }
}

/**
 * Custom React Hook providing safe navigation methods for any component.
 */
export function useSafeRouter() {
  const router = useExpoRouter();

  const push = useCallback(
    (href: any, options?: any) => {
      if (!canPerformNavigation(href, 'push')) return;
      if (isRouteInStack(href)) {
        return router.navigate(href as any, options);
      }
      return router.push(href as any, options);
    },
    [router]
  );

  const navigate = useCallback(
    (href: any, options?: any) => {
      if (!canPerformNavigation(href, 'navigate')) return;
      return router.navigate(href as any, options);
    },
    [router]
  );

  const replace = useCallback(
    (href: any, options?: any) => {
      if (!canPerformNavigation(href, 'replace')) return;
      return router.replace(href as any, options);
    },
    [router]
  );

  const back = useCallback(() => {
    resetNavigationLock();
    return router.back();
  }, [router]);

  return {
    ...router,
    push,
    navigate,
    replace,
    back,
  };
}

