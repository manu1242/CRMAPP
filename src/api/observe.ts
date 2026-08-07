import { ComponentType } from 'react';
import { NativeModules } from 'react-native';

// EAS Observe requires the native module 'ExpoAppMetrics' to be present in the binary.
// Expo Go does not bundle this native module. We check its presence directly to prevent crashes.
const hasNativeModule = !!(
  (typeof globalThis !== 'undefined' && (globalThis as any).ExpoModules?.ExpoAppMetrics) ||
  NativeModules?.ExpoAppMetrics
);

let Observe: any = null;
let ObserveRoot: any = null;
let useObserveHook: any = null;

if (hasNativeModule) {
  try {
    // Dynamically require the package so static imports do not run when the native module is missing
    const expoObserve = require('expo-observe');
    Observe = expoObserve.Observe;
    ObserveRoot = expoObserve.ObserveRoot;
    useObserveHook = expoObserve.useObserve;

    // Configure EAS Observe metrics reporting
    if (Observe) {
      Observe.configure({
        dispatchInDebug: true,
        integrations: {
          'expo-router': true,
        },
      });
    }
  } catch (err) {
    console.warn('[EAS Observe] Failed to load native modules (this is expected in simulators without built dev clients):', err);
  }
}

/**
 * Wraps a Root component with EAS Observe metrics reporting.
 * Automatically acts as a no-op fallback when running inside Expo Go or if native modules are missing.
 */
export function wrapObserveRoot<T extends ComponentType<any>>(Component: T): T {
  if (ObserveRoot && typeof ObserveRoot.wrap === 'function') {
    return ObserveRoot.wrap(Component);
  }
  return Component;
}

/**
 * Hook to signal that a route is fully interactive for the user.
 * Automatically acts as a no-op fallback when running inside Expo Go or if native modules are missing.
 */
export function useSafeObserve() {
  if (useObserveHook) {
    try {
      const { markInteractive } = useObserveHook();
      return {
        markInteractive: () => {
          try {
            markInteractive();
          } catch (err) {
            console.warn('[EAS Observe] markInteractive failed:', err);
          }
        },
      };
    } catch (err) {
      console.warn('[EAS Observe] useObserve hook initialization failed:', err);
    }
  }

  return {
    markInteractive: () => {
      // No-op fallback
    },
  };
}
