import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Pressable 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { CheckCircle2 } from 'lucide-react-native';
import { 
  LeadPipelineIllustration, 
  TeamCollabIllustration, 
  AnalyticsIllustration 
} from './Illustrations';

const { width, height } = Dimensions.get('window');

interface OnboardingViewProps {
  isDark: boolean;
  onComplete: () => void;
}

interface OnboardingPage {
  key: string;
  title: string;
  subtitle: string;
  features: string[];
  illustration: (isDark: boolean) => React.ReactNode;
}

const ONBOARDING_PAGES: OnboardingPage[] = [
  {
    key: 'leads',
    title: 'Manage Leads Effortlessly',
    subtitle: 'Capture, organize, and follow every lead from first contact to conversion without missing opportunities.',
    features: ['Lead Management', 'Customer Database', 'Smart Follow-ups', 'Deal Tracking'],
    illustration: (isDark) => <LeadPipelineIllustration isDark={isDark} />,
  },
  {
    key: 'team',
    title: 'Stay Connected With Your Team',
    subtitle: 'Collaborate with your team using tasks, reminders, meetings, notes, and real-time updates.',
    features: ['Task Management', 'Meeting Scheduler', 'Team Collaboration', 'Instant Notifications'],
    illustration: (isDark) => <TeamCollabIllustration isDark={isDark} />,
  },
  {
    key: 'analytics',
    title: 'Grow Faster With Business Insights',
    subtitle: 'Monitor sales performance, revenue, customer activity, and business growth through powerful analytics.',
    features: ['Sales Dashboard', 'Reports & Analytics', 'Customer Insights', 'Secure Cloud Access'],
    illustration: (isDark) => <AnalyticsIllustration isDark={isDark} />,
  },
];

export default function OnboardingView({ isDark, onComplete }: OnboardingViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingPage>>(null);
  
  // Shared animated value for driving custom indicator morph transitions
  const scrollX = useRef(new Animated.Value(0)).current;

  // Track page change
  const onViewRef = useRef((viewableItems: any) => {
    if (viewableItems.viewableItems.length > 0) {
      setActiveIndex(viewableItems.viewableItems[0].index || 0);
    }
  });
  
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handleNext = () => {
    if (activeIndex < ONBOARDING_PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  };

  const renderOnboardingPage = ({ item }: { item: OnboardingPage }) => {
    // Theme details
    const textPrimaryColor = isDark ? '#ffffff' : '#0f172a';
    const textSecondaryColor = isDark ? '#a1a1aa' : '#475569';
    const featureCardBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff';
    const featureCardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)';

    return (
      <View style={[styles.pageContainer, { width }]}>
        {/* Vector Illustration (gently floats) */}
        <View style={styles.illustrationArea}>
          {item.illustration(isDark)}
        </View>

        {/* Text Section */}
        <View style={styles.textContainer}>
          <Text style={[styles.pageTitle, { color: textPrimaryColor }]}>
            {item.title}
          </Text>
          <Text style={[styles.pageSubtitle, { color: textSecondaryColor }]}>
            {item.subtitle}
          </Text>
        </View>

        {/* Feature Highlights Grid */}
        <View style={styles.featuresGrid}>
          {item.features.map((feature, i) => (
            <View 
              key={i} 
              style={[
                styles.featureCard, 
                { 
                  backgroundColor: featureCardBg, 
                  borderColor: featureCardBorder,
                  shadowOpacity: isDark ? 0.15 : 0.04,
                }
              ]}
            >
              <CheckCircle2 size={16} color="#10b981" style={styles.checkIcon} />
              <Text style={[styles.featureText, { color: textPrimaryColor }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render Custom Progress Dot Indicators
  const renderDotIndicator = () => {
    return (
      <View style={styles.indicatorContainer}>
        {ONBOARDING_PAGES.map((_, i) => {
          // Dot width expands from 8 to 22 when active
          const dotWidth = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [8, 22, 8],
            extrapolate: 'clamp',
          });

          // Dot opacity fades in to 1 when active
          const dotOpacity = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [0.35, 1, 0.35],
            extrapolate: 'clamp',
          });

          // Dot color shifts to emerald brand when active
          const dotColor = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [
              isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.2)',
              '#10b981',
              isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.2)',
            ],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.indicatorDot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                  backgroundColor: dotColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastPage = activeIndex === ONBOARDING_PAGES.length - 1;

  // Theme values for buttons
  const textSecondaryColor = isDark ? '#a1a1aa' : '#64748b';
  const navBtnColor = isDark ? '#ffffff' : '#0f172a';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f8fafc' }]}>
      {/* Top Right Skip Button */}
      {!isLastPage && (
        <TouchableOpacity 
          onPress={onComplete}
          style={styles.topSkipButton}
          activeOpacity={0.65}
        >
          <Text style={[styles.skipText, { color: textSecondaryColor }]}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Page Horizontal Slider */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_PAGES}
        renderItem={renderOnboardingPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false } // Width & color animations do not support Native Driver
        )}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.key}
      />

      {/* Page Indicators & Actions */}
      <View style={styles.footerContainer}>
        {renderDotIndicator()}

        <View style={styles.buttonActionArea}>
          {!isLastPage ? (
            // Page 1 & 2 Action Buttons (Next is full width)
            <TouchableOpacity 
              onPress={handleNext}
              style={styles.getStartedButton}
              activeOpacity={0.85}
            >
              {/* Glow & Premium Gradient */}
              <Svg height="54" width={width - 48} style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="nextGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor="#10b981" />
                    <Stop offset="100%" stopColor="#059669" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width={width - 48} height="54" rx="27" fill="url(#nextGrad)" />
              </Svg>
              <Text style={styles.getStartedText}>Next</Text>
            </TouchableOpacity>
          ) : (
            // Page 3 (Get Started Call to Action)
            <View style={styles.ctaWrapper}>
              <TouchableOpacity 
                onPress={onComplete}
                style={styles.getStartedButton}
                activeOpacity={0.85}
              >
                {/* Glow & Premium Gradient */}
                <Svg height="54" width={width - 48} style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient id="getStartedGrad" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0%" stopColor="#10b981" />
                      <Stop offset="100%" stopColor="#059669" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width={width - 48} height="54" rx="27" fill="url(#getStartedGrad)" />
                </Svg>
                <Text style={styles.getStartedText}>Get Started</Text>
              </TouchableOpacity>

              <Pressable 
                onPress={onComplete}
                style={({ pressed }) => [
                  styles.signInLink,
                  { opacity: pressed ? 0.65 : 1 }
                ]}
              >
                <Text style={styles.signInSecondaryText}>
                  Already have an account? <Text style={styles.signInPrimaryText}>Sign In</Text>
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: height * 0.04,
  },
  illustrationArea: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginVertical: 24,
  },
  featureCard: {
    width: '48%',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 2,
  },
  checkIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.05,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  indicatorDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonActionArea: {
    width: '100%',
    minHeight: 80,
  },
  topSkipButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 100,
    padding: 10,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  ctaWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  getStartedButton: {
    height: 54,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 27,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    shadowOpacity: 0.35,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  signInLink: {
    paddingVertical: 6,
  },
  signInSecondaryText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  signInPrimaryText: {
    color: '#10b981',
    fontWeight: '700',
  },
});
