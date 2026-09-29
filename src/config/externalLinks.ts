import { Linking } from 'react-native';

/**
 * Centralized External Links Configuration
 * 
 * Update any URLs here whenever needed without modifying component code.
 */
export const EXTERNAL_LINKS = {
  // Terms and Conditions & Privacy Policy
  TERMS_AND_CONDITIONS: 'https://uproptech.com/superadmin/privacy',
  PRIVACY_POLICY: 'https://uproptech.com/superadmin/privacy',

  // Contact Page & Inquiry Link
  CONTACT_US: 'https://uproptech.com/#inquiry',
  INQUIRY: 'https://uproptech.com/#inquiry',
  SUPPORT: 'https://uproptech.com/#inquiry',

  // Official Website
  WEBSITE: 'https://uproptech.com',
} as const;

export type ExternalLinkKey = keyof typeof EXTERNAL_LINKS;

/**
 * Helper to safely open external links across iOS and Android
 */
export const openExternalLink = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(url);
    }
  } catch (err) {
    console.error(`[ExternalLink] Failed to open URL: ${url}`, err);
  }
};
