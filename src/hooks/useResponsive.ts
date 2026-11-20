import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ResponsiveValues {
  width: number;
  height: number;
  isSmallPhone: boolean;       // < 360px (e.g., 320px - 359px)
  isStandardPhone: boolean;    // 360px - 399px
  isLargePhone: boolean;       // 400px - 479px
  isTablet: boolean;           // >= 480px
  isShortDevice: boolean;      // height < 700px
  isLandscape: boolean;
  contentPadding: number;      // 12 on small, 16 on standard/large
  cardGap: number;             // 8 on small, 12 on standard/large
  insets: ReturnType<typeof useSafeAreaInsets>;
  /**
   * Helper to compute responsive 2-column card width safely without overflow
   */
  getTwoColumnWidth: (horizontalPadding?: number, gap?: number) => number;
  /**
   * Helper to scale font size slightly on small phones to prevent text truncation
   */
  fontSize: (size: number, min?: number) => number;
}

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallPhone = width < 360;
  const isStandardPhone = width >= 360 && width < 400;
  const isLargePhone = width >= 400 && width < 480;
  const isTablet = width >= 480;
  const isShortDevice = height < 700;
  const isLandscape = width > height;

  const contentPadding = isSmallPhone ? 12 : 16;
  const cardGap = isSmallPhone ? 8 : 12;

  const getTwoColumnWidth = (
    horizontalPadding: number = contentPadding * 2,
    gap: number = cardGap
  ): number => {
    return Math.floor((width - horizontalPadding - gap) / 2);
  };

  const fontSize = (size: number, min: number = 10): number => {
    if (isSmallPhone) {
      return Math.max(min, Math.round(size * 0.92));
    }
    return size;
  };

  return {
    width,
    height,
    isSmallPhone,
    isStandardPhone,
    isLargePhone,
    isTablet,
    isShortDevice,
    isLandscape,
    contentPadding,
    cardGap,
    insets,
    getTwoColumnWidth,
    fontSize,
  };
}

export default useResponsive;
