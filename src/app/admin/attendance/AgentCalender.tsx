import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  User,
  Users,
  FileText,
  X,
  Check,
  Send,
  Sliders,
} from 'lucide-react-native';
import {
  attendanceService,
  CalendarData,
  CalendarDayItem,
  DayIntervalItem,
  SelectableAgent,
  PendingCorrectionRequest,
  DateIntervalsData,
} from '../../../Services/attendanceService';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AgentCalender() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const routeAgentId = (params.agentId as string) || '';

  const currentDate = new Date();
  const [selectedAgentId, setSelectedAgentId] = useState<string>(routeAgentId);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  // Intervals Modal State
  const [selectedDay, setSelectedDay] = useState<CalendarDayItem | null>(null);
  const [intervalsData, setIntervalsData] = useState<DateIntervalsData | null>(null);
  const [intervalsLoading, setIntervalsLoading] = useState(false);

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionTargetDay, setCorrectionTargetDay] = useState<CalendarDayItem | null>(null);

  // Approve Request Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveTargetRequest, setApproveTargetRequest] = useState<PendingCorrectionRequest | null>(null);
  const [approvedHoursInput, setApprovedHoursInput] = useState('8.0');

  const fetchCalendarData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await attendanceService.getCalendar({
          agentId: selectedAgentId || undefined,
          year,
          month,
        });

        if (response.success && response.data) {
          setCalendarData(response.data);
          if (!selectedAgentId && response.data.selectedAgent?.encodedAgentId) {
            setSelectedAgentId(response.data.selectedAgent.encodedAgentId);
          }
        } else {
          setError(response.message || 'Failed to fetch calendar data');
        }
      } catch (err: any) {
        console.error('Error fetching calendar data:', err);
        setError(err.message || 'Error connecting to attendance service');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedAgentId, year, month]
  );

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Month navigation
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const handleResetToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  // Clock-in / Clock-out Action
  const handleClockToggle = async () => {
    if (!calendarData) return;
    const hasActive = calendarData.headerStats?.hasActiveSession;
    const attendanceId = calendarData.headerStats?.todayAttendanceId;

    setActionLoading(true);
    try {
      if (hasActive) {
        // Clock Out
        const res = await attendanceService.logout({ attendanceId });
        if (res.success) {
          Toast.show({
            type: 'success',
            text1: 'Clock Out',
            text2: res.message || 'Logged out successfully',
          });
          fetchCalendarData();
        } else {
          Toast.show({
            type: 'error',
            text1: 'Clock Out Failed',
            text2: res.message || 'Unable to logout',
          });
        }
      } else {
        // Clock In
        const res = await attendanceService.login({
          agentId: selectedAgentId || calendarData.selectedAgent?.encodedAgentId,
          attendanceId: attendanceId > 0 ? attendanceId : undefined,
        });
        if (res.success) {
          Toast.show({
            type: 'success',
            text1: 'Clock In',
            text2: res.message || 'Logged in successfully',
          });
          fetchCalendarData();
        } else {
          Toast.show({
            type: 'error',
            text1: 'Clock In Failed',
            text2: res.message || 'Unable to login',
          });
        }
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Session Action Error',
        text2: err.message || 'An error occurred during clock-in/out',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Day Details / Intervals
  const handleDayPress = async (day: CalendarDayItem) => {
    setSelectedDay(day);
    setIntervalsLoading(true);
    setIntervalsData(null);

    try {
      const targetAgentId = selectedAgentId || calendarData?.selectedAgent?.encodedAgentId || '';
      const res = await attendanceService.getIntervals({
        agentId: targetAgentId,
        date: day.date,
      });

      if (res.success && res.data) {
        setIntervalsData(res.data);
      }
    } catch (err) {
      console.error('Error loading day intervals:', err);
    } finally {
      setIntervalsLoading(false);
    }
  };

  // Submit Correction Request
  const handleSubmitCorrection = async () => {
    if (!correctionReason.trim()) {
      Alert.alert('Validation', 'Please provide a reason for the correction request');
      return;
    }

    if (!correctionTargetDay) return;

    setActionLoading(true);
    try {
      const targetAgentId = selectedAgentId || calendarData?.selectedAgent?.encodedAgentId;
      const res = await attendanceService.requestCorrection({
        attendanceId: correctionTargetDay.attendanceId,
        reason: correctionReason.trim(),
        agentId: targetAgentId,
        date: correctionTargetDay.date,
      });

      if (res.success) {
        Alert.alert('Success', res.message || 'Correction request submitted successfully');
        setShowCorrectionModal(false);
        setCorrectionReason('');
        setSelectedDay(null);
        fetchCalendarData();
      } else {
        Alert.alert('Submission Failed', res.message || 'Unable to submit correction request');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit correction request');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Correction Request
  const handleApproveCorrectionSubmit = async () => {
    if (!approveTargetRequest) return;
    const hours = parseFloat(approvedHoursInput);
    if (isNaN(hours) || hours <= 0) {
      Alert.alert('Validation', 'Please enter a valid number of approved hours');
      return;
    }

    setActionLoading(true);
    try {
      const res = await attendanceService.approveCorrection({
        attendanceId: approveTargetRequest.attendanceId,
        approvedHours: hours,
      });

      if (res.success) {
        Alert.alert('Approved', res.message || 'Correction request approved');
        setShowApproveModal(false);
        setApproveTargetRequest(null);
        fetchCalendarData();
      } else {
        Alert.alert('Approval Failed', res.message || 'Unable to approve request');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error approving correction request');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Correction Request
  const handleRejectCorrection = async (req: PendingCorrectionRequest) => {
    Alert.alert(
      'Confirm Rejection',
      `Are you sure you want to reject the correction request for ${req.agentName} on ${req.formattedDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await attendanceService.rejectCorrection({
                attendanceId: req.attendanceId,
              });
              if (res.success) {
                Alert.alert('Rejected', res.message || 'Correction request rejected');
                fetchCalendarData();
              } else {
                Alert.alert('Action Failed', res.message || 'Unable to reject request');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Error rejecting correction request');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Calculate calendar grid padding offsets
  const getFirstDayOffset = () => {
    const firstDay = new Date(year, month - 1, 1);
    return firstDay.getDay(); // 0 = Sun, 1 = Mon, ...
  };

  const getDayBadgeColor = (statusKey: string, status: string) => {
    const s = (statusKey || status || '').toLowerCase();
    if (s.includes('present')) {
      return { bg: '#10b98120', text: '#10b981', dot: '#10b981' };
    }
    if (s.includes('absent')) {
      return { bg: '#ef444420', text: '#ef4444', dot: '#ef4444' };
    }
    if (s.includes('leave')) {
      return { bg: '#f59e0b20', text: '#f59e0b', dot: '#f59e0b' };
    }
    if (s.includes('weekend')) {
      return { bg: '#64748b20', text: '#64748b', dot: '#64748b' };
    }
    return { bg: '#64748b15', text: '#64748b', dot: '#94a3b8' };
  };

  const selectedAgent = calendarData?.selectedAgent;
  const headerStats = calendarData?.headerStats;
  const firstDayOffset = getFirstDayOffset();

  return (
    <View style={[styles.container, { backgroundColor: adminTheme.primaryBg }]}>
      {/* Header Bar */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: adminTheme.cardBg, borderBottomColor: adminTheme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: adminTheme.inputBg }]}
        >
          <ChevronLeft size={20} color={adminTheme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: adminTheme.textPrimary }]}>
            Attendance Calendar
          </Text>
          <Text style={[styles.headerSubtitle, { color: adminTheme.textSecondary }]}>
            {selectedAgent?.username || 'Select Agent'}
          </Text>
        </View>

        {/* Switch Agent Dropdown Button */}
        {calendarData?.selectableAgents && calendarData.selectableAgents.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowAgentPicker(true)}
            style={[styles.agentPickerButton, { backgroundColor: adminTheme.inputBg }]}
          >
            <User size={14} color={adminTheme.brand} />
            <Text
              style={[styles.agentPickerText, { color: adminTheme.textPrimary }]}
              numberOfLines={1}
            >
              Switch Agent
            </Text>
            <Sliders size={12} color={adminTheme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCalendarData(true)}
            tintColor={adminTheme.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Agent Card Info */}
        {selectedAgent && (
          <View
            style={[
              styles.agentCard,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            <View style={styles.agentAvatarContainer}>
              {selectedAgent.profileImage ? (
                <Image source={{ uri: selectedAgent.profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: adminTheme.brand }]}>
                  <Text style={styles.avatarText}>
                    {selectedAgent.username ? selectedAgent.username.charAt(0).toUpperCase() : 'A'}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.agentName, { color: adminTheme.textPrimary }]}>
                {selectedAgent.username}
              </Text>
              <Text style={[styles.agentEmail, { color: adminTheme.textSecondary }]}>
                {selectedAgent.email} • {selectedAgent.role}
              </Text>
            </View>

            <View style={styles.agentRateBadge}>
              <Text style={[styles.agentRateValue, { color: adminTheme.brand }]}>
                {selectedAgent.attendancePercentage?.toFixed(1) ?? '0.0'}%
              </Text>
              <Text style={[styles.agentRateLabel, { color: adminTheme.textSecondary }]}>
                Attendance
              </Text>
            </View>
          </View>
        )}

        {/* Today's Activity Stats & Clock Action Banner */}
        {headerStats && (
          <View
            style={[
              styles.statsBanner,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            <View style={styles.statsBannerRow}>
              <View style={styles.bannerStat}>
                <Text style={[styles.bannerValue, { color: adminTheme.textPrimary }]}>
                  {headerStats.todayTotalLogins}
                </Text>
                <Text style={[styles.bannerLabel, { color: adminTheme.textSecondary }]}>
                  Logins Today
                </Text>
              </View>

              <View style={styles.bannerStat}>
                <Text style={[styles.bannerValue, { color: adminTheme.textPrimary }]}>
                  {headerStats.todayTotalLogouts}
                </Text>
                <Text style={[styles.bannerLabel, { color: adminTheme.textSecondary }]}>
                  Logouts Today
                </Text>
              </View>

              <View style={styles.bannerStat}>
                <Text style={[styles.bannerValue, { color: adminTheme.brand }]}>
                  {headerStats.todayTotalHours.toFixed(1)}h
                </Text>
                <Text style={[styles.bannerLabel, { color: adminTheme.textSecondary }]}>
                  Today Hours
                </Text>
              </View>
            </View>

            {/* Clock In / Out Action Button */}
            <TouchableOpacity
              onPress={handleClockToggle}
              disabled={actionLoading}
              style={[
                styles.clockActionButton,
                headerStats.hasActiveSession
                  ? { backgroundColor: '#ef4444' }
                  : { backgroundColor: adminTheme.brand },
              ]}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : headerStats.hasActiveSession ? (
                <>
                  <LogOut size={18} color="#ffffff" />
                  <Text style={styles.clockActionText}>Clock Out (Active Session)</Text>
                </>
              ) : (
                <>
                  <LogIn size={18} color="#ffffff" />
                  <Text style={styles.clockActionText}>Clock In For Today</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Month & Year Navigation Header */}
        <View
          style={[
            styles.calendarNavRow,
            { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
          ]}
        >
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrowButton}>
            <ChevronLeft size={20} color={adminTheme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.monthYearTitleContainer}>
            <CalendarIcon size={16} color={adminTheme.brand} />
            <Text style={[styles.monthYearTitle, { color: adminTheme.textPrimary }]}>
              {new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })} {year}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              onPress={handleResetToday}
              style={[styles.todayButton, { backgroundColor: adminTheme.inputBg }]}
            >
              <Text style={[styles.todayButtonText, { color: adminTheme.textPrimary }]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowButton}>
              <ChevronRight size={20} color={adminTheme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Grid View */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={adminTheme.brand} />
            <Text style={[styles.loadingText, { color: adminTheme.textSecondary }]}>
              Loading calendar grid...
            </Text>
          </View>
        ) : error ? (
          <View style={[styles.errorCard, { backgroundColor: '#ef444415', borderColor: '#ef444440' }]}>
            <AlertCircle size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : calendarData?.calendarDays ? (
          <View
            style={[
              styles.gridContainer,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            {/* Weekday Labels Header */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((wd, i) => (
                <Text
                  key={wd}
                  style={[
                    styles.weekdayHeaderCell,
                    { color: i === 0 || i === 6 ? adminTheme.brand : adminTheme.textSecondary },
                  ]}
                >
                  {wd}
                </Text>
              ))}
            </View>

            {/* Grid Cells */}
            <View style={styles.daysGrid}>
              {/* Blank Padding Offset Cells */}
              {Array.from({ length: firstDayOffset }).map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.dayCellEmpty} />
              ))}

              {/* Month Day Cells */}
              {calendarData.calendarDays.map((day) => {
                const badge = getDayBadgeColor(day.statusKey, day.status);
                return (
                  <TouchableOpacity
                    key={day.date}
                    onPress={() => handleDayPress(day)}
                    style={[
                      styles.dayCell,
                      { backgroundColor: adminTheme.primaryBg, borderColor: adminTheme.border },
                      day.isToday && { borderColor: adminTheme.brand, borderWidth: 2 },
                      day.isFuture && { opacity: 0.4 },
                    ]}
                  >
                    <View style={styles.dayTopRow}>
                      <Text
                        style={[
                          styles.dayNumberText,
                          { color: day.isToday ? adminTheme.brand : adminTheme.textPrimary },
                        ]}
                      >
                        {day.dayNumber}
                      </Text>

                      {day.correctionRequested && (
                        <View style={styles.correctionDot}>
                          <AlertCircle size={10} color="#f59e0b" />
                        </View>
                      )}
                    </View>

                    {/* Status Badge */}
                    <View style={[styles.dayStatusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.dayStatusText, { color: badge.text }]}>
                        {day.status}
                      </Text>
                    </View>

                    {/* Hours Logged */}
                    {day.totalHours > 0 ? (
                      <Text style={[styles.dayHoursText, { color: adminTheme.textSecondary }]}>
                        {day.totalHours.toFixed(1)}h
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Pending Correction Requests (For Admin / Partner Users) */}
        {calendarData?.canManageAttendance &&
          calendarData?.pendingCorrectionRequests &&
          calendarData.pendingCorrectionRequests.length > 0 && (
            <View style={styles.pendingSection}>
              <View style={styles.pendingHeader}>
                <FileText size={18} color="#f59e0b" />
                <Text style={[styles.pendingTitle, { color: adminTheme.textPrimary }]}>
                  Pending Correction Requests ({calendarData.pendingCorrectionRequests.length})
                </Text>
              </View>

              {calendarData.pendingCorrectionRequests.map((req) => (
                <View
                  key={req.attendanceId}
                  style={[
                    styles.pendingCard,
                    { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
                  ]}
                >
                  <View style={styles.pendingCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pendingAgentName, { color: adminTheme.textPrimary }]}>
                        {req.agentName}
                      </Text>
                      <Text style={[styles.pendingDate, { color: adminTheme.textSecondary }]}>
                        {req.formattedDate || req.date}
                      </Text>
                    </View>
                    <View style={[styles.statusPendingBadge, { backgroundColor: '#f59e0b15' }]}>
                      <Text style={[styles.statusPendingText, { color: '#f59e0b' }]}>
                        {req.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.pendingReason, { color: adminTheme.textPrimary }]}>
                    "{req.reason}"
                  </Text>

                  {/* Actions */}
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setApproveTargetRequest(req);
                        setApprovedHoursInput('8.0');
                        setShowApproveModal(true);
                      }}
                      style={[styles.approveButton, { backgroundColor: '#10b981' }]}
                    >
                      <Check size={14} color="#ffffff" />
                      <Text style={styles.actionBtnText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRejectCorrection(req)}
                      style={[styles.rejectButton, { backgroundColor: '#ef444415' }]}
                    >
                      <X size={14} color="#ef4444" />
                      <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
      </ScrollView>

      {/* 1. Switch Agent Picker Modal */}
      <Modal visible={showAgentPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowAgentPicker(false)} />
          <View style={[styles.modalSheet, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                Select Employee Agent
              </Text>
              <TouchableOpacity onPress={() => setShowAgentPicker(false)}>
                <X size={20} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {calendarData?.selectableAgents?.map((agent: SelectableAgent) => (
                <TouchableOpacity
                  key={agent.userId || agent.encodedUserId}
                  onPress={() => {
                    setSelectedAgentId(agent.encodedUserId || agent.userId.toString());
                    setShowAgentPicker(false);
                  }}
                  style={[
                    styles.agentListItem,
                    { borderBottomColor: adminTheme.border },
                    selectedAgentId === (agent.encodedUserId || agent.userId.toString()) && {
                      backgroundColor: adminTheme.badgeBg,
                    },
                  ]}
                >
                  <View style={[styles.miniAvatar, { backgroundColor: adminTheme.brand }]}>
                    <Text style={styles.miniAvatarText}>
                      {agent.username ? agent.username.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.agentListItemName, { color: adminTheme.textPrimary }]}>
                      {agent.username}
                    </Text>
                    <Text style={[styles.agentListItemEmail, { color: adminTheme.textSecondary }]}>
                      {agent.email} ({agent.role})
                    </Text>
                  </View>
                  {selectedAgentId === (agent.encodedUserId || agent.userId.toString()) && (
                    <CheckCircle size={18} color={adminTheme.brand} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. Date Intervals & Session Details Modal */}
      <Modal visible={!!selectedDay} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setSelectedDay(null)} />
          <View style={[styles.modalSheet, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                  Session Intervals - {selectedDay?.date}
                </Text>

                <Text style={[styles.modalSubtitle, { color: adminTheme.textSecondary }]}>
                  Status: {selectedDay?.status} • {selectedDay?.totalHours.toFixed(1)} hrs total
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDay(null)}>
                <X size={20} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>

            {intervalsLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color={adminTheme.brand} />
                <Text style={[styles.loadingText, { color: adminTheme.textSecondary }]}>
                  Loading intervals...
                </Text>
              </View>
            ) : intervalsData?.intervals && intervalsData.intervals.length > 0 ? (
              <ScrollView style={{ maxHeight: 250, marginVertical: 10 }}>
                {intervalsData.intervals.map((item: DayIntervalItem) => (
                  <View
                    key={item.index}
                    style={[
                      styles.intervalCard,
                      { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border },
                    ]}
                  >
                    <View style={styles.intervalIndexBadge}>
                      <Text style={styles.intervalIndexText}>#{item.index}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.intervalTimeText, { color: adminTheme.textPrimary }]}>
                        Login: {item.login} | Logout: {item.logout || 'Active'}
                      </Text>
                      <Text style={[styles.intervalDuration, { color: adminTheme.textSecondary }]}>
                        Duration: {item.duration}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noIntervalsBox}>
                <Clock size={24} color={adminTheme.textMuted} />
                <Text style={[styles.noIntervalsText, { color: adminTheme.textSecondary }]}>
                  No session intervals recorded for this day.
                </Text>
              </View>
            )}

            {/* Request Correction Footer Action */}
            <TouchableOpacity
              onPress={() => {
                setCorrectionTargetDay(selectedDay);
                setCorrectionReason('');
                setShowCorrectionModal(true);
              }}
              style={[styles.modalCorrectionButton, { backgroundColor: adminTheme.brand }]}
            >
              <Send size={16} color="#ffffff" />
              <Text style={styles.modalCorrectionButtonText}>Request Attendance Correction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Submit Correction Request Form Modal */}
      <Modal visible={showCorrectionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowCorrectionModal(false)} />
          <View style={[styles.modalCenterCard, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                Request Attendance Correction
              </Text>
              <TouchableOpacity onPress={() => setShowCorrectionModal(false)}>
                <X size={18} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.correctionDateLabel, { color: adminTheme.textSecondary }]}>
              Target Date: {correctionTargetDay?.date}
            </Text>

            <TextInput
              style={[
                styles.reasonInput,
                {
                  backgroundColor: adminTheme.inputBg,
                  color: adminTheme.textPrimary,
                  borderColor: adminTheme.border,
                },
              ]}
              placeholder="Provide reason for missing/incomplete session..."
              placeholderTextColor={adminTheme.textMuted}
              multiline
              numberOfLines={4}
              value={correctionReason}
              onChangeText={setCorrectionReason}
            />

            <TouchableOpacity
              onPress={handleSubmitCorrection}
              disabled={actionLoading}
              style={[styles.submitReasonButton, { backgroundColor: adminTheme.brand }]}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitReasonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. Admin Approve Correction Hours Input Modal */}
      <Modal visible={showApproveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowApproveModal(false)} />
          <View style={[styles.modalCenterCard, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                Approve Correction Request
              </Text>
              <TouchableOpacity onPress={() => setShowApproveModal(false)}>
                <X size={18} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.approveAgentText, { color: adminTheme.textPrimary }]}>
              Agent: {approveTargetRequest?.agentName}
            </Text>
            <Text style={[styles.approveDateText, { color: adminTheme.textSecondary }]}>
              Date: {approveTargetRequest?.formattedDate || approveTargetRequest?.date}
            </Text>

            <Text style={[styles.inputLabel, { color: adminTheme.textSecondary }]}>
              Enter Approved Working Hours:
            </Text>

            <TextInput
              style={[
                styles.hoursInput,
                {
                  backgroundColor: adminTheme.inputBg,
                  color: adminTheme.textPrimary,
                  borderColor: adminTheme.border,
                },
              ]}
              keyboardType="decimal-pad"
              value={approvedHoursInput}
              onChangeText={setApprovedHoursInput}
              placeholder="e.g. 8.5"
              placeholderTextColor={adminTheme.textMuted}
            />

            <TouchableOpacity
              onPress={handleApproveCorrectionSubmit}
              disabled={actionLoading}
              style={[styles.submitReasonButton, { backgroundColor: '#10b981' }]}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitReasonText}>Confirm Approval</Text>
              )}
            </TouchableOpacity>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  agentPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  agentPickerText: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 90,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  agentAvatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  agentName: {
    fontSize: 15,
    fontWeight: '700',
  },
  agentEmail: {
    fontSize: 11,
    marginTop: 2,
  },
  agentRateBadge: {
    alignItems: 'flex-end',
  },
  agentRateValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  agentRateLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  statsBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  statsBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bannerStat: {
    alignItems: 'center',
  },
  bannerValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  bannerLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  clockActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  clockActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navArrowButton: {
    padding: 6,
  },
  monthYearTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthYearTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  todayButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
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
    fontSize: 12,
    color: '#ef4444',
  },
  gridContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
  },
  dayNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  correctionDot: {
    padding: 1,
  },
  dayStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  dayStatusText: {
    fontSize: 8,
    fontWeight: '700',
  },
  dayHoursText: {
    fontSize: 8,
    fontWeight: '500',
  },
  pendingSection: {
    gap: 10,
    marginTop: 6,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pendingCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  pendingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pendingAgentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  pendingDate: {
    fontSize: 11,
    marginTop: 2,
  },
  statusPendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusPendingText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pendingReason: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Modals
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
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  modalLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  agentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  agentListItemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  agentListItemEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  intervalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  intervalIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f620',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalIndexText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '700',
  },
  intervalTimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  intervalDuration: {
    fontSize: 11,
    marginTop: 2,
  },
  noIntervalsBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },
  noIntervalsText: {
    fontSize: 12,
  },
  modalCorrectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
  },
  modalCorrectionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalCenterCard: {
    marginHorizontal: 20,
    marginVertical: 'auto',
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  correctionDateLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 90,
  },
  submitReasonButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitReasonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  approveAgentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  approveDateText: {
    fontSize: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  hoursInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
});
