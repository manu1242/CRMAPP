import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Users,
  UserPlus,
  Award,
  ChevronRight,
  Search,
  Handshake,
  TrendingUp,
  Target,
  SlidersHorizontal,
  Mail,
  UserCheck,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { useTeamDashboardQuery } from '../hooks/useDashboardQuery';
import { useBottomNavSpacing } from '../../hooks/useBottomNavSpacing';
import { useDashboardScrollHandler } from '../store/useHeaderScrollStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TeamDashboardContent() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const handleScroll = useDashboardScrollHandler();

  const [search, setSearch] = useState('');

  const { data, isLoading, isRefetching, refetch } = useTeamDashboardQuery();

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const cardBorder = adminTheme.border;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const brandColor = adminTheme.brand;

  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.25 : 0.04,
      shadowRadius: 16,
    },
    android: { elevation: isDark ? 3 : 1 },
  });

  if (isLoading && !data) {
    return (
      <View style={[styles.centered, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={brandColor} />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading Team Management Dashboard...
        </Text>
      </View>
    );
  }

  const {
    totalTeamMembers = 0,
    newTeamMembers = 0,
    totalChannelPartners = 0,
    teamPerformance = [],
    topPerformers = [],
  } = data || {};

  const filteredTeam = teamPerformance.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.username.toLowerCase().includes(q) ||
      (item.role && item.role.toLowerCase().includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q))
    );
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: bottomSpacing + 40 }}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[brandColor]}
          tintColor={brandColor}
        />
      }
    >
      {/* ── 1. Hero Gradient Header Banner (Admin Style) ── */}
      <ExpoLinearGradient
        colors={isDark ? ['#000000', '#064e3b'] : [brandColor, adminTheme.brandHover]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroGlow1} />
        <View style={styles.heroGlow2} />

        <View style={{ position: 'relative' }}>
          <Text style={styles.heroTitle}>Team Operations & Rankings</Text>
          <Text style={styles.heroSubtitle}>
            {`Overseeing ${totalTeamMembers} active team members and ${totalChannelPartners} partner networks.`}
          </Text>

          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              onPress={() => router.push('/admin/teammanagement/Agent' as any)}
              style={styles.heroPrimaryBtn}
              activeOpacity={0.8}
            >
              <Text style={[styles.heroPrimaryBtnText, { color: adminTheme.brandHover }]}>Agent Directory</Text>
              <ChevronRight size={14} color={adminTheme.brandHover} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/admin/teammanagement/channelpartner/channel' as any)}
              style={styles.heroSecondaryBtn}
              activeOpacity={0.8}
            >
              <Handshake size={14} color="#ffffff" />
              <Text style={styles.heroSecondaryBtnText}>Channel Partners</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ExpoLinearGradient>

      {/* ── 2. Bento Grid Team Metrics ── */}
      <View style={{ marginBottom: 24 }}>
        <Text style={[styles.sectionHeading, { color: textColor }]}>Team Workforce Metrics</Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Left Hero Card - Total Team */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/admin/teammanagement/Agent' as any)}
            style={[
              styles.bentoLeftCard,
              { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow },
            ]}
          >
            <View style={{ paddingTop: 4, zIndex: 1 }}>
              <Text style={[styles.cardLabel, { color: subTextColor }]}>Total Team</Text>
              <Text style={[styles.bentoBigValue, { color: textColor }]}>
                {totalTeamMembers}
              </Text>
              <Text style={[styles.cardTagText, { color: subTextColor }]}>
                👥 Active Executives
              </Text>
            </View>

            <Image
              source={require('../../../assets/images/dashlead.png')}
              style={styles.bentoLeftImg}
            />
          </TouchableOpacity>

          {/* Right Column - Stacked Cards */}
          <View style={{ flex: 1, gap: 12, height: 150 }}>
            {/* Top Card - Channel Partners */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/admin/teammanagement/channelpartner/channel' as any)}
              style={[
                styles.bentoRightCard,
                { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow },
              ]}
            >
              <View style={{ gap: 2, zIndex: 1 }}>
                <Text style={[styles.cardLabel, { color: subTextColor }]} numberOfLines={1}>
                  Channel Partners
                </Text>
                <Text style={[styles.bentoSmallValue, { color: textColor }]}>
                  {totalChannelPartners}
                </Text>
              </View>

              <Image
                source={require('../../../assets/images/inquiries.png')}
                style={styles.bentoRightImg}
              />
            </TouchableOpacity>

            {/* Bottom Card - New Members */}
            <View
              style={[
                styles.bentoRightCard,
                { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow },
              ]}
            >
              <View style={{ gap: 2, zIndex: 1 }}>
                <Text style={[styles.cardLabel, { color: subTextColor }]} numberOfLines={1}>
                  New (7 Days)
                </Text>
                <Text style={[styles.bentoSmallValue, { color: textColor }]}>
                  {newTeamMembers}
                </Text>
              </View>

              <Image
                source={require('../../../assets/images/plans.png')}
                style={styles.bentoRightImg}
              />
            </View>
          </View>
        </View>
      </View>

      {/* ── 3. Top Performers Leaderboard Card ── */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Award size={16} color="#f59e0b" />
            </View>
            <View>
              <Text style={[styles.cardHeaderTitle, { color: textColor }]}>Top Performers Leaderboard</Text>
              <Text style={[styles.cardHeaderSub, { color: subTextColor }]}>Leading sales and conversion rates</Text>
            </View>
          </View>

          <View style={[styles.pillBadge, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.10)' }]}>
            <Text style={[styles.pillBadgeText, { color: '#f59e0b' }]}>Top 5</Text>
          </View>
        </View>

        {topPerformers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: subTextColor }]}>No performance activity logged yet</Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 10 }}>
            {topPerformers.map((agent, index) => {
              const conversionPct =
                agent.leadsCount > 0 ? Math.round((agent.bookingsCount / agent.leadsCount) * 100) : 0;
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

              return (
                <View
                  key={agent.userId || index}
                  style={[
                    styles.leaderboardItem,
                    {
                      backgroundColor: isDark ? '#141414' : '#f8fafc',
                      borderColor: cardBorder,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Text style={styles.medalText}>{medal}</Text>

                    <View style={[styles.avatarBadge, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                      <Text style={[styles.avatarText, { color: brandColor }]}>
                        {(agent.username || 'A').charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: textColor }]} numberOfLines={1}>
                        {agent.username}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <Text style={[styles.itemSubtitle, { color: subTextColor }]}>
                          {agent.bookingsCount} Deals Won
                        </Text>
                        <Text style={{ fontSize: 10, color: subTextColor }}>•</Text>
                        <Text style={[styles.itemSubtitle, { color: subTextColor }]}>
                          {agent.leadsCount} Leads
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', minWidth: 64 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: brandColor }}>
                      {conversionPct}%
                    </Text>
                    <Text style={{ fontSize: 9, color: subTextColor, marginTop: 1 }}>
                      Conversion
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ── 4. Searchable Team Directory (Admin Style) ── */}
      <View style={{ marginBottom: 24 }}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <Users size={16} color="#3b82f6" />
            </View>
            <Text style={[styles.sectionHeadingTitle, { color: textColor }]}>Team Directory</Text>
          </View>

          <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>
            {filteredTeam.length} Members
          </Text>
        </View>

        {/* Live Search Input Box */}
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}>
          <Search size={15} color={subTextColor} />
          <TextInput
            placeholder="Search team members by name, role, email..."
            placeholderTextColor={subTextColor}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: textColor }]}
          />
        </View>

        {/* Members Cards List */}
        <View style={{ gap: 10 }}>
          {filteredTeam.length === 0 ? (
            <View style={[styles.card, styles.emptyBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.emptyText, { color: subTextColor }]}>No team members matching filter</Text>
            </View>
          ) : (
            filteredTeam.map((item, index) => {
              const roleColor =
                item.role?.toLowerCase() === 'admin'
                  ? '#ef4444'
                  : item.role?.toLowerCase() === 'manager'
                  ? '#3b82f6'
                  : '#10b981';

              return (
                <View
                  key={item.userId || index}
                  style={[styles.itemCard, { backgroundColor: cardBg, borderColor: cardBorder, ...cardShadow }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View style={[styles.avatarBadge, { backgroundColor: `${roleColor}15` }]}>
                      <UserCheck size={16} color={roleColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: textColor }]} numberOfLines={1}>
                        {item.username}
                      </Text>
                      <Text style={[styles.itemSubtitle, { color: subTextColor }]} numberOfLines={1}>
                        {item.email || 'No email registered'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                    <View
                      style={[
                        styles.itemStatusPill,
                        {
                          backgroundColor: `${roleColor}12`,
                          borderColor: `${roleColor}25`,
                        },
                      ]}
                    >
                      <Text style={[styles.itemStatusPillText, { color: roleColor }]}>
                        {item.role || 'Member'}
                      </Text>
                    </View>
                    <Text style={[styles.itemDate, { color: subTextColor }]}>
                      {item.bookingsCount} Deals • {item.leadsCount} Leads
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  heroBanner: {
    marginHorizontal: -16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    paddingTop: 28,
    paddingBottom: 28,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  heroGlow1: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroGlow2: {
    position: 'absolute',
    left: -20,
    bottom: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F4F5F5',
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '400',
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  heroPrimaryBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 2,
  },
  heroPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroSecondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  bentoLeftCard: {
    flex: 1.2,
    height: 150,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  bentoLeftImg: {
    position: 'absolute',
    bottom: -20,
    right: -10,
    width: 95,
    height: 95,
    opacity: 0.85,
    resizeMode: 'contain',
    zIndex: 0,
  },
  bentoRightCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
  },
  bentoRightImg: {
    position: 'absolute',
    bottom: -8,
    right: -4,
    width: 55,
    height: 55,
    opacity: 0.85,
    resizeMode: 'contain',
    zIndex: 0,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bentoBigValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.7,
  },
  cardTagText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  bentoSmallValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardHeaderSub: {
    fontSize: 11,
    marginTop: 2,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  leaderboardItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medalText: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  searchBox: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  itemStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 2,
  },
  itemStatusPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  itemDate: {
    fontSize: 10,
    marginTop: 3,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
