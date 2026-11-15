import { create } from 'zustand';
import { useRef, useCallback } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface HeaderScrollState {
  headerOffset: Animated.Value;
  showHeader: () => void;
  hideHeader: () => void;
  onScrollDelta: (deltaY: number, currentY: number) => void;
  resetHeader: () => void;
}

export const useHeaderScrollStore = create<HeaderScrollState>(() => {
  const headerOffset = new Animated.Value(0);
  let isVisible = true;

  const showHeader = () => {
    if (!isVisible) {
      isVisible = true;
      headerOffset.stopAnimation();
      Animated.timing(headerOffset, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
  };

  const hideHeader = () => {
    if (isVisible) {
      isVisible = false;
      headerOffset.stopAnimation();
      Animated.timing(headerOffset, {
        toValue: -79,
        duration: 220,
        useNativeDriver: false,
      }).start();
    }
  };

  const onScrollDelta = (deltaY: number, currentY: number) => {
    // If user is at or near top of the page, always show header
    if (currentY <= 25) {
      showHeader();
      return;
    }

    // Scrolling down the content (finger moving up) -> hide header
    if (deltaY > 8) {
      hideHeader();
    }
    // Scrolling up the content (finger moving down, pulling down slightly) -> show header
    else if (deltaY < -4) {
      showHeader();
    }
  };

  const resetHeader = () => {
    isVisible = true;
    headerOffset.stopAnimation();
    headerOffset.setValue(0);
  };

  return {
    headerOffset,
    showHeader,
    hideHeader,
    onScrollDelta,
    resetHeader,
  };
});

export function useDashboardScrollHandler() {
  const lastYRef = useRef(0);
  const onScrollDelta = useHeaderScrollStore((s) => s.onScrollDelta);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = e.nativeEvent.contentOffset.y;
      const delta = currentY - lastYRef.current;
      lastYRef.current = currentY;
      onScrollDelta(delta, currentY);
    },
    [onScrollDelta]
  );

  return handleScroll;
}

