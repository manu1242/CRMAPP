import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Safe Haptic Feedback Helper
 */
export const triggerHaptic = (
  type: 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
) => {
  if (Platform.OS === 'web') return;

  try {
    switch (type) {
      case 'selection':
        Haptics.selectionAsync().catch(() => {});
        break;
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        break;
    }
  } catch {
    // Graceful fallback if device lacks haptics hardware
  }
};

