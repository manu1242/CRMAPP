import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '@/theme/adminTheme';
import {
  Users,
  Search,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  UserCheck,
  UserX,
  Filter,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Check,
  X,
  Mail,
  Shield,
  Briefcase,
  Award,
} from 'lucide-react-native';
import {
  attendanceService,
  AgentOverviewData,
  AgentOverviewItem,
} from '../../../Services/attendanceService';

const ROLES = ['All', 'Agent', 'Sales'];
const PERFORMANCE_OPTIONS = [
  { label: 'All Performance', value: '' },
  { label: 'Excellent (≥90%)', value: 'excellent' },
  { label: 'Good (75-89%)', value: 'good' },
  { label: 'Average (60-74%)', value: 'average' },
  { label: 'Poor (<60%)', value: 'poor' },
];

export default function AgentAttendance() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overviewData, setOverviewData] = useState<AgentOverviewData | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedPerformance, setSelectedPerformance] = useState('');

  // Dropdown Modal Visibility
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPerfModal, setShowPerfModal] = useState(false);

  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchOverview = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await attendanceService.getAgentOverview({
          search: search.trim() || undefined,
          role: selectedRole === 'All' ? undefined : selectedRole,
          performance: selectedPerformance || undefined,
          year,
          month,
          page,
          pageSize,
        });

        if (response.success && response.data) {
          setOverviewData(response.data);
        } else {
          setError(response.message || 'Failed to fetch attendance overview');
        }
      } catch (err: any) {
        console.error('Error fetching attendance overview:', err);
        setError(err.message || 'Error connecting to attendance service');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, selectedRole, selectedPerformance, year, month, page]
  );

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
    setPage(1);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
    setPage(1);
  };

  const getPerformanceBadgeColor = (key: string) => {
    switch ((key || '').toLowerCase()) {
      case 'excellent':
        return { bg: '#10b98118', text: '#10b981', border: '#10b98140', dot: '#10b981' };
      case 'good':
        return { bg: '#3b82f618', text: '#3b82f6', border: '#3b82f640', dot: '#3b82f6' };
      case 'average':
        return { bg: '#f59e0b18', text: '#f59e0b', border: '#f59e0b40', dot: '#f59e0b' };
      case 'poor':
      default:
        return { bg: '#ef444418', text: '#ef4444', border: '#ef444440', dot: '#ef4444' };
    }
  };

  const headerStats = overviewData?.headerStats;
  const currentPerfLabel =
    PERFORMANCE_OPTIONS.find((p) => p.value === selectedPerformance)?.label || 'All Performance';

  return (
    <View style={[styles.container, { backgroundColor: adminTheme.primaryBg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOverview(true)}
            tintColor={adminTheme.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Inline Top Header & Month Navigator */}
        <View style={styles.topRowContainer}>
          <View style={styles.topTitleRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: adminTheme.inputBg }]}
            >
              <ChevronLeft size={20} color={adminTheme.textPrimary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { color: adminTheme.textPrimary }]}>
                Agent Attendance
              </Text>
              <Text style={[styles.pageSubtitle, { color: adminTheme.textSecondary }]}>
                {headerStats?.currentMonthName || `Month ${month}, ${year}`} Performance
              </Text>
            </View>

            {/* Inline Month Selector */}
            <View style={[styles.monthSelector, { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border }]}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrow}>
                <ChevronLeft size={16} color={adminTheme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.monthText, { color: adminTheme.textPrimary }]}>
                {headerStats?.currentMonthShort || `${month}`}/{year.toString().substring(2)}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrow}>
                <ChevronRight size={16} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Summary Header Stats Row */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total Agents */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#6366f115' }]}>
              <Users size={16} color="#6366f1" />
            </View>
            <Text style={[styles.statValue, { color: adminTheme.textPrimary }]}>
              {headerStats?.totalAgents ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: adminTheme.textSecondary }]}>
              Total Agents
            </Text>
          </View>

          {/* Card 2: Working Days */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#10b98115' }]}>
              <Clock size={16} color="#10b981" />
            </View>
            <Text style={[styles.statValue, { color: adminTheme.textPrimary }]}>
              {headerStats?.workingDays ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: adminTheme.textSecondary }]}>
              Working Days
            </Text>
          </View>

          {/* Card 3: Avg Attendance */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#f59e0b15' }]}>
              <TrendingUp size={16} color="#f59e0b" />
            </View>
            <Text style={[styles.statValue, { color: adminTheme.textPrimary }]}>
              {headerStats?.avgAttendancePercentage?.toFixed(1) ?? '0.0'}%
            </Text>
            <Text style={[styles.statLabel, { color: adminTheme.textSecondary }]}>
              Avg Rate
            </Text>
          </View>
        </View>

        {/* Filters Section */}
        <View
          style={[
            styles.filterContainer,
            { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
          ]}
        >
          {/* Search Input */}
          <View style={[styles.searchBox, { backgroundColor: adminTheme.inputBg }]}>
            <Search size={16} color={adminTheme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: adminTheme.textPrimary }]}
              placeholder="Search agent by name or email..."
              placeholderTextColor={adminTheme.textMuted}
              value={search}
              onChangeText={(txt) => {
                setSearch(txt);
                setPage(1);
              }}
            />
          </View>

          {/* Role & Performance Dropdowns Row */}
          <View style={styles.dropdownsRow}>
            {/* Role Dropdown Button */}
            <TouchableOpacity
              onPress={() => setShowRoleModal(true)}
              style={[
                styles.dropdownSelector,
                { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border },
              ]}
            >
              <View style={styles.dropdownLabelContainer}>
                <Text style={[styles.dropdownPreLabel, { color: adminTheme.textSecondary }]}>
                  Role:
                </Text>
                <Text
                  style={[styles.dropdownValueText, { color: adminTheme.textPrimary }]}
                  numberOfLines={1}
                >
                  {selectedRole === 'All' ? 'All Roles' : selectedRole}
                </Text>
              </View>
              <ChevronDown size={16} color={adminTheme.textSecondary} />
            </TouchableOpacity>

            {/* Performance Dropdown Button */}
            <TouchableOpacity
              onPress={() => setShowPerfModal(true)}
              style={[
                styles.dropdownSelector,
                { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border },
              ]}
            >
              <View style={styles.dropdownLabelContainer}>
                <Text style={[styles.dropdownPreLabel, { color: adminTheme.textSecondary }]}>
                  Perf:
                </Text>
                <Text
                  style={[styles.dropdownValueText, { color: adminTheme.textPrimary }]}
                  numberOfLines={1}
                >
                  {currentPerfLabel.split(' ')[0]}
                </Text>
              </View>
              <ChevronDown size={16} color={adminTheme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error State */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: '#ef444415', borderColor: '#ef444440' }]}>
            <AlertCircle size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchOverview()} style={styles.retryButton}>
              <RefreshCw size={14} color="#ef4444" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Agents Redesigned Cards List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={adminTheme.brand} />
            <Text style={[styles.loadingText, { color: adminTheme.textSecondary }]}>
              Loading agent attendance...
            </Text>
          </View>
        ) : overviewData?.agents && overviewData.agents.length > 0 ? (
          <View style={styles.cardsList}>
            {overviewData.agents.map((agent: AgentOverviewItem) => {
              const perfBadge = getPerformanceBadgeColor(agent.performanceKey || agent.performance);
              const ratePercent = Math.min(100, Math.max(0, agent.attendancePercentage || 0));

              return (
                <View
                  key={agent.agentId || agent.encodedAgentId}
                  style={[
                    styles.redesignedCard,
                    { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
                  ]}
                >
                  {/* Top Profile Header Row */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.avatarWrapper}>
                      {agent.profileImage ? (
                        <Image source={{ uri: agent.profileImage }} style={styles.avatarImage} />
                      ) : (
                        <View style={[styles.avatarCircle, { backgroundColor: adminTheme.brand }]}>
                          <Text style={styles.avatarInitial}>
                            {agent.username ? agent.username.charAt(0).toUpperCase() : 'A'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.agentInfoCol}>
                      <Text style={[styles.redesignedName, { color: adminTheme.textPrimary }]}>
                        {agent.username}
                      </Text>
                      <View style={styles.emailRow}>
                        <Mail size={12} color={adminTheme.textSecondary} />
                        <Text
                          style={[styles.redesignedEmail, { color: adminTheme.textSecondary }]}
                          numberOfLines={1}
                        >
                          {agent.email}
                        </Text>
                      </View>

                      {/* Role Pill */}
                      <View style={[styles.rolePill, { backgroundColor: adminTheme.inputBg }]}>
                        <Briefcase size={10} color={adminTheme.brand} />
                        <Text style={[styles.rolePillText, { color: adminTheme.brand }]}>
                          {agent.role || 'Agent'}
                        </Text>
                      </View>
                    </View>

                    {/* Performance Status Badge */}
                    <View
                      style={[
                        styles.redesignedPerfBadge,
                        { backgroundColor: perfBadge.bg, borderColor: perfBadge.border },
                      ]}
                    >
                      <View style={[styles.perfDot, { backgroundColor: perfBadge.dot }]} />
                      <Text style={[styles.redesignedPerfText, { color: perfBadge.text }]}>
                        {agent.performance}
                      </Text>
                    </View>
                  </View>

                  {/* Attendance Rate Hero Metric Bar */}
                  <View style={[styles.rateBarContainer, { backgroundColor: adminTheme.inputBg }]}>
                    <View style={styles.rateHeaderRow}>
                      <Text style={[styles.rateTitleText, { color: adminTheme.textSecondary }]}>
                        Attendance Score
                      </Text>
                      <Text style={[styles.rateValueText, { color: adminTheme.brand }]}>
                        {agent.attendancePercentage.toFixed(1)}%
                      </Text>
                    </View>

                    {/* Dynamic Progress Track Bar */}
                    <View style={[styles.progressTrack, { backgroundColor: adminTheme.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${ratePercent}%`,
                            backgroundColor: perfBadge.text,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* 3 Metric Pills Grid */}
                  <View style={styles.metricsGrid}>
                    {/* Present Pill */}
                    <View
                      style={[
                        styles.metricTile,
                        { backgroundColor: '#10b98110', borderColor: '#10b98130' },
                      ]}
                    >
                      <UserCheck size={14} color="#10b981" />
                      <Text style={[styles.metricTileValue, { color: '#10b981' }]}>
                        {agent.presentDays}
                      </Text>
                      <Text style={[styles.metricTileLabel, { color: adminTheme.textSecondary }]}>
                        Present
                      </Text>
                    </View>

                    {/* Absent Pill */}
                    <View
                      style={[
                        styles.metricTile,
                        { backgroundColor: '#ef444410', borderColor: '#ef444430' },
                      ]}
                    >
                      <UserX size={14} color="#ef4444" />
                      <Text style={[styles.metricTileValue, { color: '#ef4444' }]}>
                        {agent.absentDays}
                      </Text>
                      <Text style={[styles.metricTileLabel, { color: adminTheme.textSecondary }]}>
                        Absent
                      </Text>
                    </View>

                    {/* Working Days Pill */}
                    <View
                      style={[
                        styles.metricTile,
                        { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border },
                      ]}
                    >
                      <Clock size={14} color={adminTheme.textPrimary} />
                      <Text style={[styles.metricTileValue, { color: adminTheme.textPrimary }]}>
                        {agent.workingDays}
                      </Text>
                      <Text style={[styles.metricTileLabel, { color: adminTheme.textSecondary }]}>
                        Work Days
                      </Text>
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/admin/attendance/AgentCalender',
                        params: { agentId: agent.encodedAgentId || agent.agentId.toString() },
                      })
                    }
                    style={[
                      styles.viewCalendarAction,
                      { backgroundColor: adminTheme.brand },
                    ]}
                  >
                    <CalendarIcon size={16} color="#ffffff" />
                    <Text style={styles.viewCalendarActionText}>
                      View Attendance Calendar
                    </Text>
                    <ArrowRight size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Users size={36} color={adminTheme.textMuted} />
            <Text style={[styles.emptyTitle, { color: adminTheme.textPrimary }]}>
              No Agents Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: adminTheme.textSecondary }]}>
              No agent attendance records matched your current filters.
            </Text>
          </View>
        )}

        {/* Pagination Bar */}
        {overviewData && overviewData.totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              disabled={page <= 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              style={[
                styles.pageButton,
                { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
                page <= 1 && { opacity: 0.4 },
              ]}
            >
              <ChevronLeft size={16} color={adminTheme.textPrimary} />
              <Text style={[styles.pageButtonText, { color: adminTheme.textPrimary }]}>Prev</Text>
            </TouchableOpacity>

            <Text style={[styles.pageInfoText, { color: adminTheme.textSecondary }]}>
              Page {overviewData.pageNumber} of {overviewData.totalPages}
            </Text>

            <TouchableOpacity
              disabled={page >= overviewData.totalPages}
              onPress={() => setPage((p) => Math.min(overviewData.totalPages, p + 1))}
              style={[
                styles.pageButton,
                { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
                page >= overviewData.totalPages && { opacity: 0.4 },
              ]}
            >
              <Text style={[styles.pageButtonText, { color: adminTheme.textPrimary }]}>Next</Text>
              <ChevronRight size={16} color={adminTheme.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Role Filter Modal Dropdown */}
      <Modal visible={showRoleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowRoleModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                Select Role Filter
              </Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <X size={20} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>

            {ROLES.map((r) => {
              const isSelected = selectedRole === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => {
                    setSelectedRole(r);
                    setPage(1);
                    setShowRoleModal(false);
                  }}
                  style={[
                    styles.optionItem,
                    { borderBottomColor: adminTheme.border },
                    isSelected && { backgroundColor: adminTheme.badgeBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: adminTheme.textPrimary },
                      isSelected && { fontWeight: '700', color: adminTheme.brand },
                    ]}
                  >
                    {r === 'All' ? 'All Roles' : r}
                  </Text>
                  {isSelected && <Check size={18} color={adminTheme.brand} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Performance Filter Modal Dropdown */}
      <Modal visible={showPerfModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowPerfModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                Select Performance Filter
              </Text>
              <TouchableOpacity onPress={() => setShowPerfModal(false)}>
                <X size={20} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>

            {PERFORMANCE_OPTIONS.map((p) => {
              const isSelected = selectedPerformance === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => {
                    setSelectedPerformance(p.value);
                    setPage(1);
                    setShowPerfModal(false);
                  }}
                  style={[
                    styles.optionItem,
                    { borderBottomColor: adminTheme.border },
                    isSelected && { backgroundColor: adminTheme.badgeBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: adminTheme.textPrimary },
                      isSelected && { fontWeight: '700', color: adminTheme.brand },
                    ]}
                  >
                    {p.label}
                  </Text>
                  {isSelected && <Check size={18} color={adminTheme.brand} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  topRowContainer: {
    marginBottom: 2,
  },
  topTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  monthArrow: {
    padding: 2,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  filterContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
  },
  dropdownsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dropdownSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  dropdownLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dropdownPreLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownValueText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#ef4444',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  cardsList: {
    gap: 14,
  },

  /* Redesigned Agent Card Styles */
  redesignedCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  agentInfoCol: {
    flex: 1,
  },
  redesignedName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  redesignedEmail: {
    fontSize: 12,
    flex: 1,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    marginTop: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  redesignedPerfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  perfDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  redesignedPerfText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rateBarContainer: {
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  rateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateTitleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rateValueText: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  metricTileValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricTileLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  viewCalendarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 2,
  },
  viewCalendarActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  pageButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pageInfoText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 14,
  },
});
