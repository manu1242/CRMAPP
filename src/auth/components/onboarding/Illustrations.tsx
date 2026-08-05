import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2, 
  Briefcase, 
  Activity,
  ArrowUpRight
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface IllustrationProps {
  isDark: boolean;
}

// ----------------------------------------------------
// Illustration 1: Lead Pipeline & Database Management
// ----------------------------------------------------
export const LeadPipelineIllustration = ({ isDark }: IllustrationProps) => {
  // Animated values for floating elements
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating animations
    const createFloatingAnim = (val: Animated.Value, duration: number, toVal: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: toVal,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      );
    };

    Animated.parallel([
      createFloatingAnim(float1, 3000, -8),
      createFloatingAnim(float2, 3500, -12),
      createFloatingAnim(float3, 2800, -6),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          })
        ])
      )
    ]).start();
  }, []);

  const themeColors = {
    cardBg: isDark ? 'rgba(17, 16, 16, 0.85)' : 'rgba(255, 255, 255, 0.9)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
    textPrimary: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#a1a1aa' : '#64748b',
    glow: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.06)',
    dotBg: isDark ? '#27272a' : '#f1f5f9',
  };

  return (
    <View style={styles.container}>
      {/* Central Connector Pipeline (Background) */}
      <View style={styles.pipelineLineContainer}>
        <Svg height="4" width="220" viewBox="0 0 220 4">
          <Line 
            x1="0" 
            y1="2" 
            x2="220" 
            y2="2" 
            stroke={isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.15)'} 
            strokeWidth="3" 
            strokeDasharray="6, 6" 
          />
        </Svg>
      </View>

      {/* Pipeline Step 1 (Left) - Connected Lead */}
      <Animated.View style={[
        styles.pipelineNode,
        { transform: [{ translateY: float3 }], left: '8%' }
      ]}>
        <View style={[styles.nodeIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
          <Briefcase size={16} color="#10b981" />
        </View>
      </Animated.View>

      {/* Pipeline Step 2 (Center) - Pulsing Target Node */}
      <Animated.View style={[
        styles.pipelineNodeActive,
        { 
          transform: [{ translateY: float1 }, { scale: pulseScale }],
          left: '42%'
        }
      ]}>
        <View style={styles.nodeIconBgActive}>
          <Activity size={20} color="#ffffff" />
        </View>
      </Animated.View>

      {/* Pipeline Step 3 (Right) - Database Lead */}
      <Animated.View style={[
        styles.pipelineNode,
        { transform: [{ translateY: float2 }], right: '8%' }
      ]}>
        <View style={[styles.nodeIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
          <Users size={16} color="#3b82f6" />
        </View>
      </Animated.View>

      {/* Main Glassmorphic Lead Profile Card (Center Middle) */}
      <Animated.View style={[
        styles.leadCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.cardBorder,
          transform: [{ translateY: float1 }],
          shadowOpacity: isDark ? 0.25 : 0.08,
        }
      ]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>SC</Text>
          </View>
          <View style={styles.cardHeaderDetails}>
            <Text style={[styles.cardTitle, { color: themeColors.textPrimary }]}>Sarah Connor</Text>
            <Text style={[styles.cardSubtitle, { color: themeColors.textSecondary }]}>Cyberdyne Systems</Text>
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>New Lead</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <CheckCircle2 size={13} color="#10b981" style={{ marginRight: 6 }} />
            <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>Lead Qualified</Text>
          </View>
          <View style={styles.infoRow}>
            <CheckCircle2 size={13} color="#10b981" style={{ marginRight: 6 }} />
            <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>Contacted via Phone</Text>
          </View>
        </View>
      </Animated.View>

      {/* Floating Card 2: Deal Status (Bottom Right) */}
      <Animated.View style={[
        styles.dealCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.cardBorder,
          transform: [{ translateY: float2 }],
          shadowOpacity: isDark ? 0.3 : 0.1,
        }
      ]}>
        <View style={styles.dealContent}>
          <View style={styles.dealIconBg}>
            <TrendingUp size={15} color="#10b981" />
          </View>
          <View style={{ marginLeft: 8 }}>
            <Text style={[styles.dealLabel, { color: themeColors.textSecondary }]}>Deal Value</Text>
            <Text style={[styles.dealValue, { color: '#10b981' }]}>$24,500</Text>
          </View>
        </View>
      </Animated.View>

      {/* Floating Badge: Smart Status (Top Left) */}
      <Animated.View style={[
        styles.floatingStatusBadge,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.cardBorder,
          transform: [{ translateY: float3 }],
          shadowOpacity: isDark ? 0.2 : 0.06,
        }
      ]}>
        <Text style={[styles.statusText, { color: themeColors.textPrimary }]}>
          🔥 Hot Deal
        </Text>
      </Animated.View>
    </View>
  );
};

// ----------------------------------------------------
// Illustration 2: Team Collaboration & Tasks
// ----------------------------------------------------
export const TeamCollabIllustration = ({ isDark }: IllustrationProps) => {
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createFloatingAnim = (val: Animated.Value, duration: number, toVal: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: toVal,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      );
    };

    Animated.parallel([
      createFloatingAnim(float1, 3200, -10),
      createFloatingAnim(float2, 2700, -6),
      createFloatingAnim(float3, 3600, -14),
    ]).start();
  }, []);

  const themeColors = {
    cardBg: isDark ? 'rgba(17, 16, 16, 0.85)' : 'rgba(255, 255, 255, 0.9)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
    textPrimary: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#a1a1aa' : '#64748b',
    chatUserBg: isDark ? '#10b981' : '#10b981',
    chatAgentBg: isDark ? '#18181b' : '#f1f5f9',
    chatAgentText: isDark ? '#e4e4e7' : '#334155',
  };

  return (
    <View style={styles.container}>
      {/* Main Task List Card (Center Left) */}
      <Animated.View style={[
        styles.collabCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.cardBorder,
          transform: [{ translateY: float1 }],
        }
      ]}>
        <View style={styles.collabCardHeader}>
          <Calendar size={15} color="#10b981" style={{ marginRight: 6 }} />
          <Text style={[styles.collabCardTitle, { color: themeColors.textPrimary }]}>Today's Schedule</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.taskItem}>
          <View style={styles.checkBoxChecked}>
            <CheckCircle2 size={13} color="#ffffff" />
          </View>
          <Text style={[styles.taskText, styles.taskTextChecked, { color: themeColors.textSecondary }]}>
            Call with Alpha Corp
          </Text>
        </View>

        <View style={styles.taskItem}>
          <View style={styles.checkBoxUnchecked} />
          <Text style={[styles.taskText, { color: themeColors.textPrimary }]}>
            Send quote to Sarah
          </Text>
        </View>

        <View style={styles.taskItem}>
          <View style={styles.checkBoxUnchecked} />
          <Text style={[styles.taskText, { color: themeColors.textPrimary }]}>
            Team catch-up sync
          </Text>
        </View>
      </Animated.View>

      {/* Floating Chat Bubble (Top Right) */}
      <Animated.View style={[
        styles.chatBubbleContainer,
        {
          transform: [{ translateY: float2 }],
        }
      ]}>
        <View style={[styles.chatBubble, { backgroundColor: themeColors.chatUserBg }]}>
          <Text style={styles.chatTextUser}>Lead signed proposal! 🎉</Text>
        </View>
        <View style={styles.chatAvatarStack}>
          <View style={[styles.chatAvatar, { backgroundColor: '#3b82f6', zIndex: 3 }]}>
            <Text style={styles.chatAvatarText}>JD</Text>
          </View>
          <View style={[styles.chatAvatar, { backgroundColor: '#f59e0b', marginLeft: -8, zIndex: 2 }]}>
            <Text style={styles.chatAvatarText}>MK</Text>
          </View>
        </View>
      </Animated.View>

      {/* Floating Team Alert Notification (Bottom Right) */}
      <Animated.View style={[
        styles.notificationCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.cardBorder,
          transform: [{ translateY: float3 }],
        }
      ]}>
        <View style={styles.notifHeader}>
          <View style={styles.notifIconBg}>
            <MessageSquare size={14} color="#3b82f6" />
          </View>
          <View style={{ marginLeft: 8 }}>
            <Text style={[styles.notifTitle, { color: themeColors.textPrimary }]}>New Task Assigned</Text>
            <Text style={[styles.notifTime, { color: themeColors.textSecondary }]}>Just now</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// ----------------------------------------------------
// Illustration 3: Business Analytics & Growth
// ----------------------------------------------------
export const AnalyticsIllustration = ({ isDark }: IllustrationProps) => {
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  
  // Bar heights
  const bar1Height = useRef(new Animated.Value(10)).current;
  const bar2Height = useRef(new Animated.Value(10)).current;
  const bar3Height = useRef(new Animated.Value(10)).current;
  const bar4Height = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Floating
    const createFloatingAnim = (val: Animated.Value, duration: number, toVal: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: toVal,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      );
    };

    Animated.parallel([
      createFloatingAnim(float1, 3100, -8),
      createFloatingAnim(float2, 3400, -10),
      createFloatingAnim(float3, 2600, -6),
      
      // Bar heights growth
      Animated.spring(bar1Height, { toValue: 60, friction: 5, useNativeDriver: false }),
      Animated.spring(bar2Height, { toValue: 90, friction: 5, delay: 200, useNativeDriver: false }),
      Animated.spring(bar3Height, { toValue: 75, friction: 5, delay: 400, useNativeDriver: false }),
      Animated.spring(bar4Height, { toValue: 110, friction: 5, delay: 600, useNativeDriver: false }),
    ]).start();
  }, []);

  const themeColors = {
    cardBg: isDark ? 'rgba(17, 16, 16, 0.85)' : 'rgba(255, 255, 255, 0.9)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
    textPrimary: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#a1a1aa' : '#64748b',
    barContainerBg: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
    barBg: isDark ? '#27272a' : '#e2e8f0',
  };

  return (
    <View style={styles.container}>
      {/* Chart Layout Card (Center Left) */}
      <Animated.View style={[
        styles.chartCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.cardBorder,
          transform: [{ translateY: float1 }],
        }
      ]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: themeColors.textPrimary }]}>Monthly Revenue</Text>
          <View style={styles.trendBadge}>
            <ArrowUpRight size={10} color="#10b981" />
            <Text style={styles.trendText}>+12.4%</Text>
          </View>
        </View>

        {/* Custom SVG Bar Graph */}
        <View style={[styles.chartBarArea, { backgroundColor: themeColors.barContainerBg }]}>
          <View style={styles.graphContainer}>
            <View style={styles.yAxisLines}>
              <View style={[styles.yLine, { borderColor: isDark ? '#27272a' : '#f1f5f9' }]} />
              <View style={[styles.yLine, { borderColor: isDark ? '#27272a' : '#f1f5f9' }]} />
              <View style={[styles.yLine, { borderColor: isDark ? '#27272a' : '#f1f5f9' }]} />
            </View>
            <View style={styles.barsRow}>
              {/* Bar 1 */}
              <View style={styles.barWrapper}>
                <Animated.View 
                  style={[
                    styles.bar, 
                    { 
                      height: bar1Height, 
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0' 
                    }
                  ]} 
                />
              </View>
              {/* Bar 2 */}
              <View style={styles.barWrapper}>
                <Animated.View 
                  style={[
                    styles.bar, 
                    { 
                      height: bar2Height, 
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#bfdbfe' 
                    }
                  ]} 
                />
              </View>
              {/* Bar 3 */}
              <View style={styles.barWrapper}>
                <Animated.View 
                  style={[
                    styles.bar, 
                    { 
                      height: bar3Height, 
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.6)' : '#6ee7b7' 
                    }
                  ]} 
                />
              </View>
              {/* Bar 4 (Highlighted Brand Bar) */}
              <View style={styles.barWrapper}>
                <Animated.View 
                  style={[
                    styles.bar, 
                    { 
                      height: bar4Height, 
                      backgroundColor: '#10b981' 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Circular Progress Ring Card (Top Right) */}
      <Animated.View style={[
        styles.progressCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.cardBorder,
          transform: [{ translateY: float2 }],
        }
      ]}>
        <View style={styles.progressRingWrapper}>
          <Svg height="68" width="68" viewBox="0 0 66 66">
            <Defs>
              <LinearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#10b981" />
                <Stop offset="100%" stopColor="#3b82f6" />
              </LinearGradient>
            </Defs>
            <Circle 
              cx="33" 
              cy="33" 
              r="28" 
              stroke={isDark ? '#27272a' : '#f1f5f9'} 
              strokeWidth="5" 
              fill="transparent" 
            />
            <Circle 
              cx="33" 
              cy="33" 
              r="28" 
              stroke="url(#circleGrad)" 
              strokeWidth="5" 
              strokeDasharray="176" 
              strokeDashoffset="32" // (1 - 0.82) * 176
              strokeLinecap="round"
              fill="transparent" 
            />
          </Svg>
          <View style={styles.progressCenterText}>
            <Text style={[styles.progressPct, { color: themeColors.textPrimary }]}>82%</Text>
          </View>
        </View>
        <Text style={[styles.progressLabel, { color: themeColors.textSecondary }]}>Sales Target</Text>
      </Animated.View>

      {/* Floating Cloud Security Card (Bottom Right) */}
      <Animated.View style={[
        styles.securityCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.cardBorder,
          transform: [{ translateY: float3 }],
        }
      ]}>
        <View style={styles.secContent}>
          <ShieldCheck size={16} color="#10b981" />
          <Text style={[styles.secText, { color: themeColors.textPrimary }]}>Secure Cloud</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 240,
    width: width - 48,
    alignSelf: 'center',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  
  // Pipeline Styling
  pipelineLineContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    zIndex: 1,
  },
  pipelineNode: {
    position: 'absolute',
    top: 36,
    zIndex: 2,
  },
  pipelineNodeActive: {
    position: 'absolute',
    top: 30,
    zIndex: 3,
  },
  nodeIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nodeIconBgActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  // Lead Card (Onboarding 1)
  leadCard: {
    width: 220,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    zIndex: 10,
    marginTop: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  cardHeaderDetails: {
    marginLeft: 10,
    flex: 1,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 13,
  },
  cardSubtitle: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  badgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 8.5,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    marginVertical: 10,
  },
  cardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 10.5,
    fontWeight: '500',
  },

  // Deal Card (Onboarding 1)
  dealCard: {
    position: 'absolute',
    bottom: -5,
    right: '8%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    zIndex: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 5,
  },
  dealContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dealIconBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  dealValue: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Floating Status (Onboarding 1)
  floatingStatusBadge: {
    position: 'absolute',
    top: 76,
    left: '8%',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    zIndex: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Task List Card (Onboarding 2)
  collabCard: {
    width: 210,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    zIndex: 10,
    position: 'absolute',
    left: '6%',
    top: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  collabCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collabCardTitle: {
    fontWeight: '700',
    fontSize: 12.5,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkBoxChecked: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkBoxUnchecked: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#a1a1aa',
    marginRight: 8,
  },
  taskText: {
    fontSize: 11,
    fontWeight: '500',
  },
  taskTextChecked: {
    textDecorationLine: 'line-through',
  },

  // Chat Bubble (Onboarding 2)
  chatBubbleContainer: {
    position: 'absolute',
    top: 15,
    right: '6%',
    zIndex: 15,
    alignItems: 'flex-end',
  },
  chatBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomRightRadius: 2,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  chatTextUser: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  chatAvatarStack: {
    flexDirection: 'row',
    marginTop: 6,
    marginRight: 2,
  },
  chatAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  chatAvatarText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },

  // Notification Card (Onboarding 2)
  notificationCard: {
    position: 'absolute',
    bottom: 15,
    right: '6%',
    width: 170,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 10,
    zIndex: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 10,
    fontWeight: '700',
  },
  notifTime: {
    fontSize: 8,
    fontWeight: '500',
    marginTop: 1,
  },

  // Revenue/Chart Card (Onboarding 3)
  chartCard: {
    width: 210,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    zIndex: 10,
    position: 'absolute',
    left: '6%',
    top: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontWeight: '700',
    fontSize: 12,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  trendText: {
    color: '#10b981',
    fontSize: 8.5,
    fontWeight: '700',
    marginLeft: 2,
  },
  chartBarArea: {
    borderRadius: 12,
    padding: 10,
    height: 120,
    justifyContent: 'flex-end',
  },
  graphContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  yAxisLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  yLine: {
    borderBottomWidth: 1,
    width: '100%',
    opacity: 0.5,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 6,
    zIndex: 5,
  },
  barWrapper: {
    width: 24,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 14,
    borderRadius: 7,
  },

  // Progress Circle Card (Onboarding 3)
  progressCard: {
    position: 'absolute',
    top: 15,
    right: '8%',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  progressRingWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },

  // Security Cloud Card (Onboarding 3)
  securityCard: {
    position: 'absolute',
    bottom: 12,
    right: '8%',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    zIndex: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  secContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
});
