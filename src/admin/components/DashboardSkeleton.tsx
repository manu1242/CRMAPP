import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardSkeleton() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const borderCol = adminTheme.border;
  const skeletonColor = isDark ? '#1e293b' : '#e2e8f0';

  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 10,
    },
    android: { elevation: isDark ? 2 : 1 },
  });

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER SKELETON ────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: cardBg,
            borderColor: borderCol,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
            ...cardShadow,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Animated.View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: skeletonColor,
                opacity: opacityAnim,
              }}
            />
            <View style={{ gap: 8 }}>
              <Animated.View
                style={{
                  width: 150,
                  height: 18,
                  borderRadius: 6,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
              <Animated.View
                style={{
                  width: 110,
                  height: 12,
                  borderRadius: 4,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
            </View>
          </View>
          <Animated.View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: skeletonColor,
              opacity: opacityAnim,
            }}
          />
        </View>

        {/* ── KPI STAT CARDS SKELETON (2x2) ─────────────────────────── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[1, 2, 3, 4].map((item) => (
            <View
              key={item}
              style={{
                flex: 1,
                minWidth: '46%',
                backgroundColor: cardBg,
                borderColor: borderCol,
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
                gap: 12,
                ...cardShadow,
              }}
            >
              {/* Top row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Animated.View
                  style={{
                    width: 75,
                    height: 11,
                    borderRadius: 4,
                    backgroundColor: skeletonColor,
                    opacity: opacityAnim,
                  }}
                />
                <Animated.View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 10,
                    backgroundColor: skeletonColor,
                    opacity: opacityAnim,
                  }}
                />
              </View>

              {/* Value */}
              <Animated.View
                style={{
                  width: 95,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />

              {/* Sub row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Animated.View
                  style={{
                    width: 60,
                    height: 10,
                    borderRadius: 4,
                    backgroundColor: skeletonColor,
                    opacity: opacityAnim,
                  }}
                />
                <Animated.View
                  style={{
                    width: 44,
                    height: 16,
                    borderRadius: 10,
                    backgroundColor: skeletonColor,
                    opacity: opacityAnim,
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* ── FINANCIAL BANNER SKELETON ──────────────────────────────── */}
        <View
          style={{
            backgroundColor: cardBg,
            borderColor: borderCol,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
            gap: 14,
            ...cardShadow,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Animated.View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
              <View style={{ gap: 6 }}>
                <Animated.View
                  style={{
                    width: 80,
                    height: 10,
                    borderRadius: 4,
                    backgroundColor: skeletonColor,
                    opacity: opacityAnim,
                  }}
                />
                <Animated.View
                  style={{
                    width: 90,
                    height: 20,
                    borderRadius: 6,
                    backgroundColor: skeletonColor,
                    opacity: opacityAnim,
                  }}
                />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Animated.View
                style={{
                  width: 50,
                  height: 10,
                  borderRadius: 4,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
              <Animated.View
                style={{
                  width: 90,
                  height: 20,
                  borderRadius: 6,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
            </View>
          </View>

          {/* Progress bar line */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Animated.View
                style={{
                  width: 70,
                  height: 10,
                  borderRadius: 4,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
              <Animated.View
                style={{
                  width: 30,
                  height: 10,
                  borderRadius: 4,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
            </View>
            <Animated.View
              style={{
                width: '100%',
                height: 8,
                borderRadius: 4,
                backgroundColor: skeletonColor,
                opacity: opacityAnim,
              }}
            />
          </View>
        </View>

        {/* ── AREA CHART SKELETON ────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: cardBg,
            borderColor: borderCol,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
            gap: 14,
            ...cardShadow,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Animated.View
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                backgroundColor: skeletonColor,
                opacity: opacityAnim,
              }}
            />
            <Animated.View
              style={{
                width: 170,
                height: 14,
                borderRadius: 4,
                backgroundColor: skeletonColor,
                opacity: opacityAnim,
              }}
            />
          </View>

          {/* Simulated chart canvas */}
          <Animated.View
            style={{
              width: '100%',
              height: 160,
              borderRadius: 12,
              backgroundColor: skeletonColor,
              opacity: opacityAnim,
            }}
          />
        </View>

        {/* ── RECENT LEADS TABLE SKELETON ───────────────────────────── */}
        <View
          style={{
            backgroundColor: cardBg,
            borderColor: borderCol,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
            gap: 12,
            ...cardShadow,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Animated.View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
              <Animated.View
                style={{
                  width: 110,
                  height: 14,
                  borderRadius: 4,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
            </View>
            <Animated.View
              style={{
                width: 60,
                height: 20,
                borderRadius: 10,
                backgroundColor: skeletonColor,
                opacity: opacityAnim,
              }}
            />
          </View>

          {/* Rows */}
          {[1, 2, 3].map((row) => (
            <View
              key={row}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 8,
                borderBottomWidth: row === 3 ? 0 : 1,
                borderBottomColor: borderCol,
              }}
            >
              <Animated.View
                style={{
                  width: 90,
                  height: 12,
                  borderRadius: 4,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
              <Animated.View
                style={{
                  width: 70,
                  height: 12,
                  borderRadius: 4,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
              <Animated.View
                style={{
                  width: 50,
                  height: 16,
                  borderRadius: 10,
                  backgroundColor: skeletonColor,
                  opacity: opacityAnim,
                }}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
