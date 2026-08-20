import React from 'react';
import { View, Text, Image } from 'react-native';
import { useSegments } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';

const expoBadge = require('../../../../assets/images/expo-badge.png');
const expoBadgeWhite = require('../../../../assets/images/expo-badge-white.png');

export default function AppFooter() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const segments = useSegments();

  const currentSegment = segments[0];
  const showImageRoutes = ['login', 'main-login', 'register', 'forgot-password', 'reset-password', 'index', '', 'profile'];
  const shouldShowImage = currentSegment === undefined || showImageRoutes.includes(currentSegment);

  return (
    <View 
      style={{
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: adminTheme.border,
        backgroundColor: 'transparent',
        marginTop: 'auto',
        width: '100%',
        gap: shouldShowImage ? 6 : 0
      }}
    >
      <Text 
        style={{ 
          fontSize: 10.5,
          color: adminTheme.FooterText,
          textAlign: 'center',
          paddingHorizontal: 16,
          fontWeight: '500',
          lineHeight: 16
        }}
      >
        © 2015-2026 UPropTech Solutions. All Rights Reserved.{"\n"}
        Powered by Ultrakey IT Solutions Pvt Ltd.
      </Text>
      {/* {shouldShowImage && (
        <Image
          source={isDark ? expoBadgeWhite : expoBadge}
          style={{
            width: 145,
            height: 45,
            tintColor: adminTheme.textSecondary,
          }}
          resizeMode="contain"
        />
      )} */}
    </View>
  );
}

