import { useEffect, useRef, useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

export interface DoubleBackToExitOptions {
  enabled?: boolean;
  timeoutMs?: number;
  message?: string;
  onExit?: () => void;
}

let globalLastBackPressTime = 0;
let globalResetTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Handles the double-back-to-exit logic programmatically.
 * Returns true if the back press was handled (either toast shown or app exited).
 */
export function handleDoubleBackToExit(options?: {
  timeoutMs?: number;
  message?: string;
  onExit?: () => void;
}): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }

  const timeoutMs = options?.timeoutMs ?? 2000;
  const message = options?.message ?? 'Press back again to exit';
  const now = Date.now();

  // If the user pressed back within the timeout window, exit the app
  if (now - globalLastBackPressTime < timeoutMs) {
    if (globalResetTimer) {
      clearTimeout(globalResetTimer);
      globalResetTimer = null;
    }
    globalLastBackPressTime = 0;
    if (options?.onExit) {
      options.onExit();
    } else {
      BackHandler.exitApp();
    }
    return true;
  }

  // First press: record timestamp and show confirmation toast
  globalLastBackPressTime = now;

  if (globalResetTimer) {
    clearTimeout(globalResetTimer);
  }
  globalResetTimer = setTimeout(() => {
    globalLastBackPressTime = 0;
    globalResetTimer = null;
  }, timeoutMs);

  Toast.show({
    type: 'info',
    text1: message,
    visibilityTime: timeoutMs,
    position: 'bottom',
    bottomOffset: Platform.OS === 'android' ? 70 : 90,
  });

  return true;
}

/**
 * Resets the double-back-to-exit confirmation state.
 */
export function resetDoubleBackState(): void {
  globalLastBackPressTime = 0;
  if (globalResetTimer) {
    clearTimeout(globalResetTimer);
    globalResetTimer = null;
  }
}

/**
 * Reusable hook for root screens to enable double-press-to-exit.
 */
export function useDoubleBackToExit(options: DoubleBackToExitOptions = {}) {
  const {
    enabled = true,
    timeoutMs = 2000,
    message = 'Press back again to exit',
    onExit,
  } = options;

  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  const handleBackPress = useCallback(() => {
    if (!enabled || Platform.OS !== 'android') {
      return false;
    }
    return handleDoubleBackToExit({
      timeoutMs,
      message,
      onExit: onExitRef.current,
    });
  }, [enabled, timeoutMs, message]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => {
      subscription.remove();
    };
  }, [enabled, handleBackPress]);

  return {
    handleDoubleBackToExit: handleBackPress,
    resetDoubleBackState,
  };
}

