import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  AlertCircle,
  User,
  FileText,
  X,
  Check,
  Send,
  Search,
  ChevronDown,
  CalendarX,
  ArrowLeft,
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
import { DeviceNotificationService } from '../../../Services/DeviceNotificationService';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028];

export default function AgentCalender() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  const routeAgentId = (params.agentId as string) || '';

  const currentDate = new Date();
  const [selectedAgentId, setSelectedAgentId] = useState<string>(routeAgentId);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  // View mode: 'month' vs 'week' (matching web FullCalendar switch)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [focusedWeekDate, setFocusedWeekDate] = useState<Date>(new Date());

  // Search input in the top control bar
  const [agentSearchQuery, setAgentSearchQuery] = useState('');

  // Modals state
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);

  // Selected Day for inspecting intervals (defaults to today or selected calendar day)
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

  // Fetch Calendar Data from backend
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

          // On pull-to-refresh keep the selected day in sync with fresh data. Not on an
          // agent/month switch: the closure's selectedDay belongs to the previous context.
          if (isRefresh && selectedDay) {
            const matchedDay = response.data.calendarDays?.find((d) => d.date === selectedDay.date);
            if (matchedDay) {
              setSelectedDay(matchedDay);
            }
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
    [selectedAgentId, year, month, selectedDay]
  );

  // Switching agent or month invalidates the selected day and its session intervals.
  // Without this, the previous agent's/month's intervals stayed on screen under the new agent.
  // Reset during render (React's "adjust state when inputs change" pattern), not in an effect.
  const calendarContextKey = `${selectedAgentId}|${year}|${month}`;
  const [prevCalendarContextKey, setPrevCalendarContextKey] = useState(calendarContextKey);
  if (prevCalendarContextKey !== calendarContextKey) {
    setPrevCalendarContextKey(calendarContextKey);
    setSelectedDay(null);
    setIntervalsData(null);
    setIntervalsLoading(false);
  }

  // Lets an in-flight intervals request detect that the agent/month changed or that a newer
  // day was tapped, so a slow response cannot overwrite the current selection.
  const latestCalendarContextRef = useRef(calendarContextKey);
  const intervalsRequestRef = useRef(0);
  useEffect(() => {
    latestCalendarContextRef.current = calendarContextKey;
  }, [calendarContextKey]);

  useEffect(() => {
    fetchCalendarData();
  }, [selectedAgentId, year, month]);

  // When calendarData loads, initialize selectedDay to today if present
  useEffect(() => {
    if (calendarData?.calendarDays && !selectedDay) {
      const todayItem = calendarData.calendarDays.find((d) => d.isToday);
      if (todayItem) {
        setSelectedDay(todayItem);
      }
    }
  }, [calendarData]);

  // Load intervals when selectedDay changes
  const loadDayIntervals = useCallback(
    async (day: CalendarDayItem) => {
      const requestId = ++intervalsRequestRef.current;
      const requestContext = calendarContextKey;
      const isCurrent = () =>
        requestId === intervalsRequestRef.current &&
        requestContext === latestCalendarContextRef.current;

      setSelectedDay(day);
      setIntervalsData(null);
      setIntervalsLoading(true);
      try {
        const targetAgentId = selectedAgentId || calendarData?.selectedAgent?.encodedAgentId || '';
        const res = await attendanceService.getIntervals({
          agentId: targetAgentId,
          date: day.date,
        });
        if (!isCurrent()) return; // superseded by a newer day, agent or month
        if (res.success && res.data) {
          setIntervalsData(res.data);
        } else {
          setIntervalsData(null);
        }
      } catch (err) {
        if (!isCurrent()) return;
        console.error('Error loading day intervals:', err);
        setIntervalsData(null);
      } finally {
        if (isCurrent()) setIntervalsLoading(false);
      }
    },
    [selectedAgentId, calendarData, calendarContextKey]
  );

  // Trigger day select
  const handleDayPress = (day: CalendarDayItem) => {
    loadDayIntervals(day);
  };

  // Calendar toolbar navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      if (month === 1) {
        setMonth(12);
        setYear((prev) => prev - 1);
      } else {
        setMonth((prev) => prev - 1);
      }
    } else {
      // Move 7 days back in week mode
      const nextDate = new Date(focusedWeekDate);
      nextDate.setDate(nextDate.getDate() - 7);
      setFocusedWeekDate(nextDate);
      if (nextDate.getMonth() + 1 !== month || nextDate.getFullYear() !== year) {
        setMonth(nextDate.getMonth() + 1);
        setYear(nextDate.getFullYear());
      }
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      if (month === 12) {
        setMonth(1);
        setYear((prev) => prev + 1);
      } else {
        setMonth((prev) => prev + 1);
      }
    } else {
      // Move 7 days forward in week mode
      const nextDate = new Date(focusedWeekDate);
      nextDate.setDate(nextDate.getDate() + 7);
      setFocusedWeekDate(nextDate);
      if (nextDate.getMonth() + 1 !== month || nextDate.getFullYear() !== year) {
        setMonth(nextDate.getMonth() + 1);
        setYear(nextDate.getFullYear());
      }
    }
  };

  const handleToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setFocusedWeekDate(now);
    if (calendarData?.calendarDays) {
      const todayItem = calendarData.calendarDays.find((d) => d.isToday);
      if (todayItem) {
        loadDayIntervals(todayItem);
      }
    }
  };

  // Clock In / Clock Out Action
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
            text1: 'Clock Out Successful',
            text2: res.message || 'Logged out successfully',
          });
          fetchCalendarData(true);
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
            text1: 'Clock In Successful',
            text2: res.message || 'Logged in successfully',
          });
          fetchCalendarData(true);
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
        DeviceNotificationService.triggerSystemNotification({
          title: 'Attendance Correction Submitted',
          body: res.message || `Correction request for ${correctionTargetDay.date} submitted.`,
        });
        Alert.alert('Success', res.message || 'Correction request submitted successfully');
        setShowCorrectionModal(false);
        setCorrectionReason('');
        fetchCalendarData(true);
      } else {
        Alert.alert('Submission Failed', res.message || 'Unable to submit correction request');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit correction request');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Correction Request (Admin/Partner)
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
        fetchCalendarData(true);
      } else {
        Alert.alert('Approval Failed', res.message || 'Unable to approve request');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error approving correction request');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Correction Request (Admin/Partner)
  const handleRejectCorrection = async (req: PendingCorrectionRequest) => {
    Alert.alert(
      'Confirm Rejection',
      `Reject correction request for ${req.agentName} on ${req.formattedDate}?`,
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
                fetchCalendarData(true);
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

  // Status badge styling helper (Absent: red, Present: green, In Progress: blue, Holiday: slate)
  const getStatusBadge = (statusKey: string, status: string) => {
    const s = (statusKey || status || '').toLowerCase();
    if (s.includes('present') && !s.includes('partial')) {
      return { label: 'Present', bg: '#10b981', textColor: '#ffffff' };
    }
    if (s.includes('partial') || s.includes('progress') || s.includes('active')) {
      return { label: 'In Progress', bg: '#2563eb', textColor: '#ffffff' };
    }
    if (s.includes('absent')) {
      return { label: 'Absent', bg: '#ef4444', textColor: '#ffffff' };
    }
    if (s.includes('holiday') || s.includes('weekend')) {
      return { label: 'Holiday', bg: '#64748b', textColor: '#ffffff' };
    }
    if (s.includes('leave')) {
      return { label: 'Leave', bg: '#f59e0b', textColor: '#ffffff' };
    }
    return { label: status || 'Pending', bg: '#64748b', textColor: '#ffffff' };
  };

  // Filter agents for agent picker modal
  const filteredAgents = useMemo(() => {
    if (!calendarData?.selectableAgents) return [];
    if (!agentSearchQuery.trim()) return calendarData.selectableAgents;
    const q = agentSearchQuery.toLowerCase();
    return calendarData.selectableAgents.filter(
      (a) =>
        (a.username && a.username.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.role && a.role.toLowerCase().includes(q))
    );
  }, [calendarData?.selectableAgents, agentSearchQuery]);

  // First day offset for month view
  const firstDayOffset = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    return firstDay.getDay(); // 0 = Sun, 1 = Mon...
  }, [year, month]);

  // Days to display based on viewMode ('month' vs 'week')
  const displayedDays = useMemo(() => {
    if (!calendarData?.calendarDays) return [];

    if (viewMode === 'month') {
      return calendarData.calendarDays;
    }

    // Week view: calculate the 7 days of the currently focused week
    const curr = new Date(focusedWeekDate);
    const dayOfWeek = curr.getDay(); // 0 (Sun) - 6 (Sat)
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - dayOfWeek);

    const weekDays: CalendarDayItem[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

      // Check if day exists in calendarDays
      const existing = calendarData.calendarDays.find((cd) => cd.date === dateStr);
      if (existing) {
        weekDays.push(existing);
      } else {
        weekDays.push({
          date: dateStr,
          dayNumber: d.getDate(),
          status: 'No Data',
          statusKey: 'nodata',
          totalHours: 0,
          loginTime: null,
          logoutTime: null,
          hasLogin: false,
          hasLogout: false,
          correctionRequested: false,
          correctionStatus: '',
          correctionReason: null,
          attendanceId: 0,
          isToday:
            d.getDate() === currentDate.getDate() &&
            d.getMonth() === currentDate.getMonth() &&
            d.getFullYear() === currentDate.getFullYear(),
          isFuture: d > currentDate,
        });
      }
    }
    return weekDays;
  }, [calendarData?.calendarDays, viewMode, focusedWeekDate]);

  const selectedAgent = calendarData?.selectedAgent;
  const headerStats = calendarData?.headerStats;

  // Active intervals to display in bottom card (either for clicked day, or today's intervals)
  const currentIntervals = useMemo(() => {
    if (intervalsData?.intervals) {
      return intervalsData.intervals;
    }
    if (selectedDay?.isToday && calendarData?.todayIntervals) {
      return calendarData.todayIntervals;
    }
    return [];
  }, [intervalsData, selectedDay, calendarData?.todayIntervals]);

  const isTodayActive = headerStats?.hasActiveSession;

  return (
    <View style={[styles.container, { backgroundColor: adminTheme.primaryBg }]}>
      {/* 1. Header Navigation Bar */}
      <View
        style={[
          styles.headerNav,
          { backgroundColor: adminTheme.cardBg, borderBottomColor: adminTheme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: adminTheme.inputBg }]}
        >
          <ArrowLeft size={18} color={adminTheme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerBreadcrumb, { color: adminTheme.textSecondary }]}>
            Attendance / Agent Attendance / <Text style={{ color: adminTheme.brand }}>Calendar</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/admin/attendance/AgentAttendance' as any)}
          style={[styles.backToAgentsBtn, { borderColor: adminTheme.border }]}
        >
          <ArrowLeft size={12} color={adminTheme.brand} />
          <Text style={[styles.backToAgentsText, { color: adminTheme.brand }]}>Agents List</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpacing + 28 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCalendarData(true)}
            tintColor={adminTheme.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Banner Matching Web Screenshot 2 */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerIconBox}>
              <CalendarIcon size={22} color="#ffd68a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Agent Attendance</Text>
              <Text style={styles.bannerSubtitle}>
                View and track agent attendance calendar in place
              </Text>
            </View>
          </View>

          {/* Today's Header Badges */}
          {headerStats && (headerStats.todayTotalLogins > 0 || headerStats.todayTotalHours > 0) ? (
            <View style={styles.bannerBadgesRow}>
              <View style={styles.bannerBadge}>
                <LogIn size={11} color="#ffffff" />
                <Text style={styles.bannerBadgeText}>Logins: {headerStats.todayTotalLogins}</Text>
              </View>
              <View style={styles.bannerBadge}>
                <LogOut size={11} color="#ffffff" />
                <Text style={styles.bannerBadgeText}>Logouts: {headerStats.todayTotalLogouts}</Text>
              </View>
              <View style={[styles.bannerBadge, styles.bannerBadgeGold]}>
                <Clock size={11} color="#ffd68a" />
                <Text style={[styles.bannerBadgeText, { color: '#ffd68a' }]}>
                  {headerStats.todayTotalHours.toFixed(1)}h
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* 3. Top Controls Bar: SELECT AGENT + JUMP TO (Month / Year) */}
        <View
          style={[
            styles.controlsCard,
            { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
          ]}
        >
          {/* SELECT AGENT Group */}
          <View style={styles.controlGroupSection}>
            <View style={styles.controlLabelRow}>
              <User size={13} color={adminTheme.brand} />
              <Text style={[styles.controlLabel, { color: adminTheme.brand }]}>SELECT AGENT:</Text>
            </View>

            <View style={styles.agentInputsRow}>
              {/* Quick Search Input */}
              <View
                style={[
                  styles.agentSearchBox,
                  { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border },
                ]}
              >
                <Search size={13} color={adminTheme.textMuted} />
                <TextInput
                  style={[styles.agentSearchInput, { color: adminTheme.textPrimary }]}
                  placeholder="Search agent..."
                  placeholderTextColor={adminTheme.textMuted}
                  value={agentSearchQuery}
                  onChangeText={(text) => {
                    setAgentSearchQuery(text);
                    if (text.length > 0 && !showAgentPicker) {
                      setShowAgentPicker(true);
                    }
                  }}
                />
              </View>

              {/* Agent Select Combobox Button */}
              <TouchableOpacity
                onPress={() => setShowAgentPicker(true)}
                style={[
                  styles.agentComboboxBtn,
                  { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border },
                ]}
              >
                <Text
                  style={[styles.agentComboboxText, { color: adminTheme.textPrimary }]}
                  numberOfLines={1}
                >
                  {selectedAgent
                    ? `${selectedAgent.username} (${selectedAgent.email || selectedAgent.role})`
                    : 'Select Agent...'}
                </Text>
                <ChevronDown size={14} color={adminTheme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* JUMP TO Group: Month & Year Dropdowns */}
          <View style={styles.jumpToSection}>
            <View style={styles.controlLabelRow}>
              <CalendarIcon size={13} color="#f59e0b" />
              <Text style={[styles.controlLabel, { color: '#f59e0b' }]}>JUMP TO:</Text>
            </View>

            <View style={styles.jumpDropdownsRow}>
              {/* Month Dropdown Button */}
              <TouchableOpacity
                onPress={() => setShowMonthPicker(true)}
                style={[
                  styles.jumpDropdownBtn,
                  { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border },
                ]}
              >
                <Text style={[styles.jumpDropdownText, { color: adminTheme.textPrimary }]}>
                  {MONTH_NAMES[month - 1]}
                </Text>
                <ChevronDown size={13} color={adminTheme.textSecondary} />
              </TouchableOpacity>

              {/* Year Dropdown Button */}
              <TouchableOpacity
                onPress={() => setShowYearPicker(true)}
                style={[
                  styles.jumpDropdownBtn,
                  { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border, width: 85 },
                ]}
              >
                <Text style={[styles.jumpDropdownText, { color: adminTheme.textPrimary }]}>
                  {year}
                </Text>
                <ChevronDown size={13} color={adminTheme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 4. Calendar Toolbar (FullCalendar Parity) */}
        <View
          style={[
            styles.calendarToolbar,
            { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
          ]}
        >
          {/* Left: Nav Buttons (< today >) */}
          <View style={styles.toolbarNavGroup}>
            <TouchableOpacity onPress={handlePrev} style={styles.toolbarIconBtn}>
              <ChevronLeft size={16} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToday} style={styles.toolbarTodayBtn}>
              <Text style={styles.toolbarTodayText}>today</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={styles.toolbarIconBtn}>
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Center: Month Year Title */}
          <Text style={[styles.toolbarTitle, { color: adminTheme.textPrimary }]}>
            {MONTH_NAMES[month - 1]} {year}
          </Text>

          {/* Right: View Switcher ([month] [week]) */}
          <View style={styles.viewSwitcherGroup}>
            <TouchableOpacity
              onPress={() => setViewMode('month')}
              style={[
                styles.viewSwitchBtn,
                viewMode === 'month' ? styles.viewSwitchActive : styles.viewSwitchInactive,
              ]}
            >
              <Text
                style={[
                  styles.viewSwitchText,
                  viewMode === 'month' ? styles.viewSwitchTextActive : styles.viewSwitchTextInactive,
                ]}
              >
                month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setViewMode('week')}
              style={[
                styles.viewSwitchBtn,
                viewMode === 'week' ? styles.viewSwitchActive : styles.viewSwitchInactive,
              ]}
            >
              <Text
                style={[
                  styles.viewSwitchText,
                  viewMode === 'week' ? styles.viewSwitchTextActive : styles.viewSwitchTextInactive,
                ]}
              >
                week
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Calendar Grid (Month / Week View) */}
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
        ) : (
          <View
            style={[
              styles.calendarCard,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            {/* Weekday Column Headers: SUN MON TUE WED THU FRI SAT */}
            <View style={styles.weekdayHeaderRow}>
              {WEEKDAYS.map((day, idx) => (
                <View key={day} style={styles.weekdayHeaderCell}>
                  <Text
                    style={[
                      styles.weekdayHeaderText,
                      { color: idx === 0 || idx === 6 ? '#2563eb' : adminTheme.textSecondary },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Day Cells Grid */}
            <View style={styles.gridDaysContainer}>
              {/* If month view, display blank offset cells for first week */}
              {viewMode === 'month' &&
                Array.from({ length: firstDayOffset }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={styles.dayGridCellEmpty} />
                ))}

              {/* Render Days */}
              {displayedDays.map((day) => {
                const badge = getStatusBadge(day.statusKey, day.status);
                const isSelected = selectedDay?.date === day.date;
                const hasStatus =
                  !day.isFuture &&
                  day.status &&
                  day.status.toLowerCase() !== 'nodata' &&
                  day.status.toLowerCase() !== 'no data';

                return (
                  <TouchableOpacity
                    key={day.date}
                    onPress={() => handleDayPress(day)}
                    activeOpacity={0.7}
                    style={[
                      styles.dayGridCell,
                      {
                        backgroundColor: isSelected
                          ? adminTheme.badgeBg
                          : adminTheme.primaryBg,
                        borderColor: isSelected
                          ? adminTheme.brand
                          : day.isToday
                          ? '#2563eb'
                          : adminTheme.border,
                        borderWidth: isSelected || day.isToday ? 2 : 1,
                      },
                      day.isFuture && { opacity: 0.4 },
                    ]}
                  >
                    {/* Top Row: Day Number */}
                    <View style={styles.dayCellTopRow}>
                      <Text
                        style={[
                          styles.dayCellNumber,
                          {
                            color: day.isToday
                              ? '#2563eb'
                              : isSelected
                              ? adminTheme.brand
                              : adminTheme.textPrimary,
                            fontWeight: day.isToday || isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {day.dayNumber}
                      </Text>

                      {day.correctionRequested && (
                        <View style={styles.correctionIconWrap}>
                          <AlertCircle size={9} color="#f59e0b" />
                        </View>
                      )}
                    </View>

                    {/* Status Pill Badge Matching Web */}
                    {hasStatus ? (
                      <View style={[styles.dayStatusPill, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.dayStatusPillText, { color: badge.textColor }]}>
                          {badge.label}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ height: 16 }} />
                    )}

                    {/* Total Hours Logged */}
                    {day.totalHours > 0 ? (
                      <Text style={[styles.dayHoursText, { color: adminTheme.textSecondary }]}>
                        {day.totalHours.toFixed(1)}h
                      </Text>
                    ) : (
                      <View style={{ height: 10 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 6. Today's / Selected Day's Logins & Action Panel (Matching Web Right Column) */}
        <View
          style={[
            styles.dayDetailPanel,
            { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
          ]}
        >
          <View style={styles.panelHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={15} color={adminTheme.brand} />
              <Text style={[styles.panelTitle, { color: adminTheme.brand }]}>
                {selectedDay?.isToday
                  ? "Today's Login/Logout Intervals"
                  : `Session Intervals (${selectedDay?.date || 'Selected Day'})`}
              </Text>
            </View>

            {selectedDay && (
              <View
                style={[
                  styles.selectedDayBadge,
                  {
                    backgroundColor: getStatusBadge(
                      selectedDay.statusKey,
                      selectedDay.status
                    ).bg + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.selectedDayBadgeText,
                    {
                      color: getStatusBadge(
                        selectedDay.statusKey,
                        selectedDay.status
                      ).bg,
                    },
                  ]}
                >
                  {selectedDay.status}
                </Text>
              </View>
            )}
          </View>

          {intervalsLoading ? (
            <View style={styles.panelLoadingBox}>
              <ActivityIndicator size="small" color={adminTheme.brand} />
              <Text style={[styles.loadingText, { color: adminTheme.textSecondary }]}>
                Loading session intervals...
              </Text>
            </View>
          ) : currentIntervals.length > 0 ? (
            <View style={styles.intervalsTableContainer}>
              {/* Table Header */}
              <View
                style={[
                  styles.tableHeaderRow,
                  { backgroundColor: adminTheme.inputBg, borderBottomColor: adminTheme.border },
                ]}
              >
                <Text style={[styles.tableColHeader, { flex: 0.8, color: adminTheme.textSecondary }]}>
                  #
                </Text>
                <Text style={[styles.tableColHeader, { flex: 2, color: adminTheme.textSecondary }]}>
                  LOGIN
                </Text>
                <Text style={[styles.tableColHeader, { flex: 2, color: adminTheme.textSecondary }]}>
                  LOGOUT
                </Text>
                <Text style={[styles.tableColHeader, { flex: 1.8, color: adminTheme.textSecondary }]}>
                  DURATION
                </Text>
              </View>

              {/* Table Rows */}
              {currentIntervals.map((interval: DayIntervalItem) => (
                <View
                  key={interval.index}
                  style={[styles.tableDataRow, { borderBottomColor: adminTheme.border }]}
                >
                  <Text style={[styles.tableCell, { flex: 0.8, fontWeight: '700', color: adminTheme.textPrimary }]}>
                    {interval.index}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2, color: '#10b981', fontWeight: '700' }]}>
                    {interval.login}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      {
                        flex: 2,
                        color: interval.logout ? '#ef4444' : '#f59e0b',
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {interval.logout || 'Active'}
                  </Text>
                  <View style={{ flex: 1.8, alignItems: 'center' }}>
                    <View
                      style={[
                        styles.durationBadge,
                        {
                          backgroundColor:
                            interval.duration === 'Active' ? '#f59e0b20' : '#10b98120',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.durationBadgeText,
                          {
                            color:
                              interval.duration === 'Active' ? '#f59e0b' : '#10b981',
                          },
                        ]}
                      >
                        {interval.duration}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Action Buttons for Logged-In User */}
              <View style={styles.actionButtonsWrap}>
                {isTodayActive ? (
                  <TouchableOpacity
                    onPress={handleClockToggle}
                    disabled={actionLoading}
                    style={[styles.webActionButton, { backgroundColor: '#ef4444' }]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <LogOut size={16} color="#ffffff" />
                        <Text style={styles.webActionBtnText}>LOGOUT</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleClockToggle}
                    disabled={actionLoading}
                    style={[styles.webActionButton, { backgroundColor: '#10b981' }]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <LogIn size={16} color="#ffffff" />
                        <Text style={styles.webActionBtnText}>LOGIN</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Request Attendance Correction Button */}
                {selectedDay && (
                  <TouchableOpacity
                    onPress={() => {
                      setCorrectionTargetDay(selectedDay);
                      setCorrectionReason('');
                      setShowCorrectionModal(true);
                    }}
                    style={[styles.correctionActionBtn, { borderColor: adminTheme.border }]}
                  >
                    <Send size={14} color={adminTheme.brand} />
                    <Text style={[styles.correctionActionText, { color: adminTheme.brand }]}>
                      Request Correction
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            /* Empty State Matching Web Screenshot 2 */
            <View style={styles.emptyIntervalsBox}>
              <CalendarX size={36} color={adminTheme.textMuted} />
              <Text style={[styles.emptyIntervalsText, { color: adminTheme.textSecondary }]}>
                No login records for {selectedDay?.isToday ? "Today's" : selectedDay?.date || 'this day'}
              </Text>

              {/* Green LOGIN Button Matching Web Screenshot 2 */}
              <TouchableOpacity
                onPress={handleClockToggle}
                disabled={actionLoading}
                style={[styles.webLoginBtn, { backgroundColor: '#10b981' }]}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <LogIn size={18} color="#ffffff" />
                    <Text style={styles.webLoginBtnText}>LOGIN</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 7. Pending Correction Requests (Admin / Partner Parity) */}
        {calendarData?.canManageAttendance &&
          calendarData?.pendingCorrectionRequests &&
          calendarData.pendingCorrectionRequests.length > 0 && (
            <View style={styles.pendingSection}>
              <View style={styles.pendingHeader}>
                <FileText size={17} color="#f59e0b" />
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

        {/* 8. Footer Info Note */}
        <View style={styles.footerNote}>
          <Text style={[styles.footerText, { color: adminTheme.textMuted }]}>
            Agent Attendance Tracking • UPropTech CRM • Indian Standard Time (IST)
          </Text>
        </View>
      </ScrollView>

      {/* ═══ MODALS ═══ */}

      {/* Modal 1: Select Agent Dropdown Combobox */}
      <Modal visible={showAgentPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowAgentPicker(false)} />
          <View style={[styles.modalSheet, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <User size={18} color={adminTheme.brand} />
                <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                  Select Employee Agent
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAgentPicker(false)}>
                <X size={20} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* In-modal Agent Search */}
            <View
              style={[
                styles.modalSearchBar,
                { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border },
              ]}
            >
              <Search size={14} color={adminTheme.textMuted} />
              <TextInput
                style={[styles.modalSearchInput, { color: adminTheme.textPrimary }]}
                placeholder="Search by agent name, email or role..."
                placeholderTextColor={adminTheme.textMuted}
                value={agentSearchQuery}
                onChangeText={setAgentSearchQuery}
                autoFocus
              />
              {agentSearchQuery ? (
                <TouchableOpacity onPress={() => setAgentSearchQuery('')}>
                  <X size={14} color={adminTheme.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView style={{ maxHeight: 340 }}>
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent: SelectableAgent) => {
                  const agentKey = agent.encodedUserId || agent.userId.toString();
                  const isCurSel = selectedAgentId === agentKey;

                  return (
                    <TouchableOpacity
                      key={agentKey}
                      onPress={() => {
                        setSelectedAgentId(agentKey);
                        setShowAgentPicker(false);
                      }}
                      style={[
                        styles.agentListItem,
                        { borderBottomColor: adminTheme.border },
                        isCurSel && { backgroundColor: adminTheme.badgeBg },
                      ]}
                    >
                      <View style={[styles.miniAvatar, { backgroundColor: adminTheme.brand }]}>
                        <Text style={styles.miniAvatarText}>
                          {agent.username ? agent.username.substring(0, 2).toUpperCase() : 'AG'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.agentListItemName, { color: adminTheme.textPrimary }]}>
                          {agent.username}
                        </Text>
                        <Text
                          style={[styles.agentListItemEmail, { color: adminTheme.textSecondary }]}
                        >
                          {agent.email}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor:
                              agent.role === 'Commission' ? '#3b82f620' : '#10b98120',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleBadgeText,
                            {
                              color:
                                agent.role === 'Commission' ? '#3b82f6' : '#10b981',
                            },
                          ]}
                        >
                          {agent.role}
                        </Text>
                      </View>
                      {isCurSel && <CheckCircle size={18} color={adminTheme.brand} />}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={{ color: adminTheme.textMuted, fontSize: 13 }}>
                    No agents match "{agentSearchQuery}"
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Jump To Month Selector */}
      <Modal visible={showMonthPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowMonthPicker(false)} />
          <View style={[styles.modalSheet, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CalendarIcon size={18} color="#f59e0b" />
                <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                  Select Month
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <X size={20} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {MONTH_NAMES.map((name, idx) => {
                const mVal = idx + 1;
                const isCur = mVal === month;
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => {
                      setMonth(mVal);
                      setShowMonthPicker(false);
                    }}
                    style={[
                      styles.pickerListItem,
                      { borderBottomColor: adminTheme.border },
                      isCur && { backgroundColor: adminTheme.badgeBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { color: isCur ? adminTheme.brand : adminTheme.textPrimary },
                        isCur && { fontWeight: '700' },
                      ]}
                    >
                      {name}
                    </Text>
                    {isCur && <Check size={18} color={adminTheme.brand} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Jump To Year Selector */}
      <Modal visible={showYearPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowYearPicker(false)} />
          <View style={[styles.modalSheet, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CalendarIcon size={18} color="#f59e0b" />
                <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                  Select Year
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <X size={20} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 260 }}>
              {AVAILABLE_YEARS.map((yr) => {
                const isCur = yr === year;
                return (
                  <TouchableOpacity
                    key={yr}
                    onPress={() => {
                      setYear(yr);
                      setShowYearPicker(false);
                    }}
                    style={[
                      styles.pickerListItem,
                      { borderBottomColor: adminTheme.border },
                      isCur && { backgroundColor: adminTheme.badgeBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { color: isCur ? adminTheme.brand : adminTheme.textPrimary },
                        isCur && { fontWeight: '700' },
                      ]}
                    >
                      {yr}
                    </Text>
                    {isCur && <Check size={18} color={adminTheme.brand} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 4: Request Attendance Correction */}
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
              placeholder="Provide reason for missing or incomplete login/logout sessions..."
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
                <Text style={styles.submitReasonText}>Submit Correction Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 5: Admin Approve Correction Hours */}
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
              Approved Working Hours:
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
              placeholder="e.g. 8.0"
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
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerBreadcrumb: {
    fontSize: 11,
    fontWeight: '500',
  },
  backToAgentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  backToAgentsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 14,
    gap: 12,
  },

  // Banner
  bannerContainer: {
    backgroundColor: '#0f223a',
    borderRadius: 12,
    padding: 14,
    borderBottomWidth: 3,
    borderBottomColor: '#d4a45a',
    gap: 10,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 164, 90, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 90, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  bannerBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  bannerBadgeGold: {
    backgroundColor: 'rgba(212, 164, 90, 0.28)',
  },
  bannerBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Controls Card
  controlsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  controlGroupSection: {
    gap: 6,
  },
  controlLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  agentInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agentSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 38,
    gap: 6,
  },
  agentSearchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 0,
  },
  agentComboboxBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 4,
  },
  agentComboboxText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  jumpToSection: {
    gap: 6,
  },
  jumpDropdownsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jumpDropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  jumpDropdownText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Calendar Toolbar
  calendarToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toolbarNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarIconBtn: {
    backgroundColor: '#166299',
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarTodayBtn: {
    backgroundColor: '#166299',
    paddingHorizontal: 8,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarTodayText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  toolbarTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  viewSwitcherGroup: {
    flexDirection: 'row',
    backgroundColor: '#0f223a',
    borderRadius: 6,
    overflow: 'hidden',
  },
  viewSwitchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  viewSwitchActive: {
    backgroundColor: '#166299',
  },
  viewSwitchInactive: {
    backgroundColor: 'transparent',
  },
  viewSwitchText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewSwitchTextActive: {
    color: '#ffffff',
  },
  viewSwitchTextInactive: {
    color: '#94a3b8',
  },

  // Calendar Card
  calendarCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f030',
    paddingBottom: 6,
    marginBottom: 4,
  },
  weekdayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayHeaderText: {
    fontSize: 10,
    fontWeight: '800',
  },
  gridDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayGridCellEmpty: {
    width: '14.28%',
    aspectRatio: 1.15,
  },
  dayGridCell: {
    width: '14.28%',
    aspectRatio: 1.15,
    borderRadius: 8,
    padding: 2,
    marginVertical: 2,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCellTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  dayCellNumber: {
    fontSize: 11,
  },
  correctionIconWrap: {
    padding: 1,
  },
  dayStatusPill: {
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    maxWidth: '96%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayStatusPillText: {
    fontSize: 7.5,
    fontWeight: '800',
  },
  dayHoursText: {
    fontSize: 8,
    fontWeight: '600',
  },

  // Day Details Panel
  dayDetailPanel: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f030',
    paddingBottom: 8,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedDayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  selectedDayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  panelLoadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  intervalsTableContainer: {
    gap: 6,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderBottomWidth: 1,
  },
  tableColHeader: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 11,
    textAlign: 'center',
  },
  durationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  durationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionButtonsWrap: {
    marginTop: 8,
    gap: 8,
  },
  webActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  webActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  correctionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  correctionActionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty Intervals State
  emptyIntervalsBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  emptyIntervalsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  webLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  webLoginBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Pending Corrections
  pendingSection: {
    gap: 8,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  pendingCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  pendingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pendingAgentName: {
    fontSize: 13,
    fontWeight: '700',
  },
  pendingDate: {
    fontSize: 11,
    marginTop: 1,
  },
  statusPendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
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
    gap: 8,
    marginTop: 4,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Footer Note
  footerNote: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 10,
    textAlign: 'center',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 12,
  },
  agentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
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
    fontSize: 12,
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
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pickerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 14,
  },
  modalCenterCard: {
    marginHorizontal: 20,
    marginVertical: 'auto',
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  correctionDateLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
    height: 80,
  },
  submitReasonButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitReasonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  approveAgentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  approveDateText: {
    fontSize: 11,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  hoursInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
});
