import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Animated, 
  StyleSheet, 
  Image, 
  StatusBar, 
  Text
} from 'react-native';

interface SplashViewProps {
  onFinish: () => void;
}

export default function SplashView({ onFinish }: SplashViewProps) {
  // Animation values — only the center splash image animates
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Center logo: scale from small (0.7) to full size + fade in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* BACKGROUND LAYER: Solid Black */}
      <View style={[StyleSheet.absoluteFill, styles.bgBase]} />

      {/* CONTENT LAYER */}
      <View style={styles.contentContainer}>
        {/* Company Logo Centered */}
        <Animated.View 
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          <Image 
            source={require('../../../../assets/images/splashscreen.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* BOTTOM LAYER: Powered by row — icon + company name */}
      <View style={styles.footerContainer}>
        <Text style={styles.poweredByLabel}>Powered by</Text>
        <View style={styles.brandRow}>
          <Image
            source={require('../../../../assets/images/splash-icon.png')}
            style={styles.brandIcon}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>UltraKey IT Solutions</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bgBase: {
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoWrapper: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 52,
    gap: 6,
  },
  poweredByLabel: {
    color: 'rgba(255, 255, 255, 0.28)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 22,
    height: 22,
  },
  brandName: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

