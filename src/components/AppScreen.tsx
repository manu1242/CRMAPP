import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  StyleProp,
  RefreshControlProps,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAdminTheme, getSuperAdminTheme } from '../theme/adminTheme';
import { useSegments } from 'expo-router';
import { useAuthStore } from '../auth/store/authStore';
import { useBottomNavSpacing, BottomNavSpacingOptions } from '../hooks/useBottomNavSpacing';

export interface AppScreenProps extends BottomNavSpacingOptions {
  children?: React.ReactNode;
  /**
   * If true, wraps content in a ScrollView with automatically computed bottom padding.
   * If false, renders a flex: 1 View container (ideal for FlatList / SectionList).
   * Defaults to true.
   */
  scrollable?: boolean;
  /**
   * Optional fixed header rendered above the scrollable/main content.
   */
  header?: React.ReactNode;
  /**
   * Optional fixed footer rendered at the bottom (automatically positioned above bottom navigation).
   */
  footer?: React.ReactNode;
  /**
   * Height of the fixed footer, if any. Automatically forwarded to spacing calculation.
   */
  footerHeight?: number;
  /**
   * Whether to wrap the content in KeyboardAvoidingView.
   * Defaults to false, or true if specified.
   */
  keyboardAvoiding?: boolean;
  /**
   * KeyboardAvoidingView offset (if needed).
   */
  keyboardVerticalOffset?: number;
  /**
   * Style applied to the outer container.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Style applied to the inner content container (ScrollView contentContainerStyle or View style).
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Optional refresh control for ScrollView (when scrollable is true).
   */
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /**
   * Custom background color. If omitted, uses active theme background.
   */
  backgroundColor?: string;
  /**
   * Whether vertical scroll indicator should be shown (when scrollable is true).
   * Defaults to false.
   */
  showsVerticalScrollIndicator?: boolean;
  /**
   * Keyboard tap persistence for ScrollView. Defaults to 'handled'.
   */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  scrollable = true,
  header,
  footer,
  footerHeight = 0,
  keyboardAvoiding = false,
  keyboardVerticalOffset = 0,
  style,
  contentContainerStyle,
  refreshControl,
  backgroundColor,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  hasBottomNav,
  extraPadding,
  includeSafeArea,
}) => {
  const { isDark } = useTheme();
  const segments = useSegments();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.trim()?.toLowerCase();

  const isSuperAdminFlow =
    (segments[0] as string) === 'superadmin' ||
    (['profile', 'change-password', 'select-workspace'].includes(segments[0] as string) && userRole === 'superadmin');

  const theme = isSuperAdminFlow ? getSuperAdminTheme(isDark) : getAdminTheme(isDark);
  const activeBg = backgroundColor || theme.primaryBg;

  const { bottomSpacing, footerBottomOffset } = useBottomNavSpacing({
    hasBottomNav,
    extraPadding,
    footerHeight,
    includeSafeArea,
  });

  const content = scrollable ? (
    <ScrollView
      style={styles.flexOne}
      contentContainerStyle={[
        styles.scrollContentGrow,
        { paddingBottom: bottomSpacing },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flexOne, contentContainerStyle]}>{children}</View>
  );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flexOne}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View style={[styles.container, { backgroundColor: activeBg }, style]}>
      {header}
      {wrappedContent}
      {footer && (
        <View style={[styles.fixedFooter, { bottom: footerBottomOffset }]}>
          {footer}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  scrollContentGrow: {
    flexGrow: 1,
  },
  fixedFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 90,
  },
});

export default AppScreen;

