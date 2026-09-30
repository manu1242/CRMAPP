import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSegments } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme, getSuperAdminTheme } from '../../../theme/adminTheme';
import { EXTERNAL_LINKS, openExternalLink } from '../../../config/externalLinks';

interface AppFooterProps {
  showLinks?: boolean;
}

export default function AppFooter({ showLinks = true }: AppFooterProps) {
  const { isDark } = useTheme();
  const segments = useSegments();
  const isSuperAdmin = segments.some(
    (segment) => typeof segment === 'string' && segment.toLowerCase().includes('superadmin')
  );
  const theme = isSuperAdmin ? getSuperAdminTheme(isDark) : getAdminTheme(isDark);

  return (
    <View 
      style={{
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.border,
        backgroundColor: 'transparent',
        marginTop: 'auto',
        width: '100%',
        gap: 6,
      }}
    >
      {showLinks && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 2 }}>
          <TouchableOpacity 
            onPress={() => openExternalLink(EXTERNAL_LINKS.PRIVACY_POLICY)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.brand }}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 11, color: theme.FooterText }}>•</Text>
          <TouchableOpacity 
            onPress={() => openExternalLink(EXTERNAL_LINKS.TERMS_AND_CONDITIONS)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.brand }}>
              Terms & Conditions
            </Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 11, color: theme.FooterText }}>•</Text>
          <TouchableOpacity 
            onPress={() => openExternalLink(EXTERNAL_LINKS.CONTACT_US)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.brand }}>
              Contact Us
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text 
        style={{ 
          fontSize: 10.5,
          color: theme.FooterText,
          textAlign: 'center',
          paddingHorizontal: 16,
          fontWeight: '500',
          lineHeight: 16
        }}
      >
        © 2015-2026 UPropTech Solutions. All Rights Reserved.{"\n"}
        Powered by Ultrakey IT Solutions Pvt Ltd.
      </Text>
    </View>
  );
}


