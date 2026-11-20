import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import Toast from 'react-native-toast-message';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Bell,
  X,
  RotateCcw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react-native';
import { TaskService } from '../services/TaskService';
import {
  TaskLeadItem,
  TodayTaskNotificationItem,
} from '../models/TaskTypes';
import {
  useTasksQuery,
  useTodayNotificationsQuery,
  useMarkTaskCompleteMutation,
  useRescheduleTaskMutation,
} from '../hooks/useTasksQuery';
import { useIsMounted } from '../../hooks/useIsMounted';
import ConnectionStateView from '../../app/components/ConnectionStateView';
import TaskCard from './TaskCard';
import { useBottomNavSpacing } from '../../hooks/useBottomNavSpacing';

// Helper date utilities
// Week runs Sunday–Saturday to match the Web Tasks page (TasksController.GetTasksByDate
// defaults to Today - DayOfWeek). A Monday start shifted which tasks fell in the week.
function getWeekStart(d: Date): Date {
  const date = new Date(d);
  date.setDate(date.getDate() - date.getDay());
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function formatFollowUpTime(dateStr?: string): string {
  if (!dateStr) return '10:00 AM';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '10:00 AM';
  }
}

export default function TasksContent() {
  const { isDark } = useTheme();
  const router = useRouter();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  // Color tokens
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  // ─── TanStack Query hooks (replace manual fetch/state) ──────────────────────
  //
  // Phase 9 fix: manual useState + useEffect fetch loops had no AbortController
  // cleanup, causing setState calls on unmounted components. Replaced with:
  //   • useTasksQuery     — auto-cancels via AbortSignal on key change / unmount
  //   • useTodayNotificationsQuery — same
  //   • useMarkTaskCompleteMutation / useRescheduleTaskMutation — invalidate cache

  const [currentWeekStartDate, setCurrentWeekStartDate] = useState<Date>(() => getWeekStart(new Date()));
  const weekStartStr = formatDateISO(currentWeekStartDate);

  const {
    data: tasksData,
    isLoading: loading,
    isRefetching: refreshing,
    error: tasksError,
    refetch: refetchTasks,
  } = useTasksQuery(weekStartStr);

  const {
    data: notifData,
    refetch: refetchNotifications,
  } = useTodayNotificationsQuery();

  const notifications: TodayTaskNotificationItem[] = notifData?.tasks || [];
  const notificationCount: number = notifData?.count || 0;

  // Auto-select today's date when tasks first load
  const [selectedDate, setSelectedDate] = useState<string>('');
  const days = tasksData?.tasksByDate || [];

  // Sync selectedDate when query data arrives (keep existing selection if still valid)
  React.useEffect(() => {
    if (!days.length) return;
    setSelectedDate((prev) => {
      if (prev && days.some((d) => d.date === prev)) return prev; // still valid
      const todayDay = days.find((d) => d.isToday);
      return todayDay ? todayDay.date : days[0].date;
    });
  }, [days]);

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Notification modal
  const [showNotifModal, setShowNotifModal] = useState<boolean>(false);

  // Reschedule Modal state
  const [rescheduleLead, setRescheduleLead] = useState<TaskLeadItem | null>(null);
  const [newDateInput, setNewDateInput] = useState<string>('');

  // isMounted guard for the imperative markNotificationsRead call
  const isMounted = useIsMounted();

  // Mutations (auto-invalidate ['tasks'] and ['todayNotifications'] on success)
  const markCompleteMutation = useMarkTaskCompleteMutation();
  const rescheduleMutation = useRescheduleTaskMutation();

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleNavigateToLead = useCallback((leadId: number) => {
    if (leadId) router.push(`/admin/leads/${leadId}`);
  }, [router]);

  const onRefresh = useCallback(() => {
    refetchTasks();
    refetchNotifications();
  }, [refetchTasks, refetchNotifications]);

  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStartDate((prev) => addDays(prev, -7));
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStartDate((prev) => addDays(prev, 7));
  }, []);

  const handleTodayClick = useCallback(() => {
    setCurrentWeekStartDate(getWeekStart(new Date()));
  }, []);

  const handleToggleComplete = useCallback(async (leadId: number, currentCompleted: boolean) => {
    const newStatus = !currentCompleted;
    markCompleteMutation.mutate(
      { leadId, isCompleted: newStatus },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: newStatus ? 'Task Completed' : 'Task Marked Pending',
            text2: `Lead ID ${leadId} status updated successfully.`,
          });
        },
        onError: () => {
          Toast.show({
            type: 'error',
            text1: 'Update Failed',
            text2: 'Could not update task status.',
          });
        },
      }
    );
  }, [markCompleteMutation]);

  const openRescheduleModal = useCallback((task: TaskLeadItem) => {
    setRescheduleLead(task);
    setNewDateInput(formatDateISO(addDays(new Date(), 1)));
  }, []);

  const handleRescheduleSubmit = useCallback(() => {
    if (!rescheduleLead || !newDateInput) return;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDateInput.trim())) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Date',
        text2: 'Please enter date in YYYY-MM-DD format.',
      });
      return;
    }

    rescheduleMutation.mutate(
      { leadId: rescheduleLead.leadId, newDate: newDateInput.trim() },
      {
        onSuccess: (res) => {
          Toast.show({
            type: 'success',
            text1: 'Task Rescheduled',
            text2: res.message || `Moved to ${newDateInput.trim()}`,
          });
          setRescheduleLead(null);
        },
        onError: () => {
          Toast.show({
            type: 'error',
            text1: 'Reschedule Failed',
            text2: 'Failed to update task date.',
          });
        },
      }
    );
  }, [rescheduleMutation, rescheduleLead, newDateInput]);

  const handleMarkNotificationsRead = useCallback(async () => {
    try {
      await TaskService.markTodayTasksAsRead();
      // Guard: only update state if component is still mounted
      if (!isMounted.current) return;
      Toast.show({
        type: 'success',
        text1: 'Notifications Read',
        text2: 'Marked today follow-ups as read.',
      });
      setShowNotifModal(false);
      refetchNotifications();
    } catch (err) {
      if (!isMounted.current) return;
      Toast.show({
        type: 'error',
        text1: 'Action Failed',
        text2: 'Could not mark notifications as read.',
      });
    }
  }, [isMounted, refetchNotifications]);

  const activeDayData = days.find((d) => d.date === selectedDate) || days[0];

  const allTasksForActiveDay = activeDayData?.tasks || [];
  const filteredTasks = allTasksForActiveDay.filter((task) => {
    if (statusFilter === 'pending') return !task.isCompleted;
    if (statusFilter === 'completed') return task.isCompleted;
    return true;
  });

  const totalTasksThisWeek = days.reduce((sum, d) => sum + (d.tasks?.length || 0), 0);
  const pendingCountForDay = allTasksForActiveDay.filter((t) => !t.isCompleted).length;
  const completedCountForDay = allTasksForActiveDay.filter((t) => t.isCompleted).length;
  const rescheduleLoading = rescheduleMutation.isPending;

  const errorMessage = tasksError
    ? (tasksError as any).response?.data?.message ||
      ((tasksError as any).response?.status === 401
        ? 'Session unauthorized or expired. Please sign in again.'
        : tasksError.message || 'Unable to load tasks for this week.')
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomSpacing, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[brandCol]} />}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: cardBg,
            borderBottomWidth: 1,
            borderBottomColor: borderCol,
          }}
        >
          {/* Week Navigation controls */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              onPress={handlePrevWeek}
              style={{
                padding: 8,
                borderRadius: 10,
                backgroundColor: inputBg,
              }}
            >
              <ChevronLeft size={16} color={textColor} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTodayClick}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: adminTheme.badgeBg,
                borderWidth: 1,
                borderColor: brandCol + '30',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: adminTheme.badgeText }}>
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextWeek}
              style={{
                padding: 8,
                borderRadius: 10,
                backgroundColor: inputBg,
              }}
            >
              <ChevronRight size={16} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Date range display */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }} numberOfLines={1}>
              {tasksData?.weekStart ? `${tasksData.weekStart} to ${tasksData.weekEnd}` : 'Weekly Tasks'}
            </Text>
            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>
              {totalTasksThisWeek} tasks this week
            </Text>
          </View>

         
        </View>

        {tasksData?.debug && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor: borderCol,
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: subTextColor, textTransform: 'uppercase', fontWeight: '600' }}>Role</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: brandCol, marginTop: 2 }}>{tasksData.debug.userRole || 'Sales'}</Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: borderCol }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: subTextColor, textTransform: 'uppercase', fontWeight: '600' }}>Total Leads</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginTop: 2 }}>{tasksData.debug.totalLeads ?? 0}</Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: borderCol }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: subTextColor, textTransform: 'uppercase', fontWeight: '600' }}>Follow-ups</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginTop: 2 }}>{tasksData.debug.leadsWithFollowUp ?? 0}</Text>
            </View>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 8 }}
        >
          {days.map((dayItem) => {
            const isSelected = dayItem.date === selectedDate;
            const taskCount = dayItem.tasks?.length || 0;
            return (
              <TouchableOpacity
                key={dayItem.date}
                onPress={() => setSelectedDate(dayItem.date)}
                style={{
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isSelected ? brandCol : borderCol,
                  backgroundColor: isSelected
                    ? brandCol
                    : dayItem.isToday
                    ? adminTheme.badgeBg
                    : cardBg,
                  minWidth: 70,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: isSelected ? '#ffffff' : dayItem.isToday ? adminTheme.badgeText : subTextColor,
                    textTransform: 'uppercase',
                  }}
                >
                  {dayItem.dayName.substring(0, 3)}
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: isSelected ? '#ffffff' : textColor,
                    marginTop: 2,
                  }}
                >
                  {dayItem.displayDate}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  {dayItem.isToday && !isSelected && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: brandCol,
                      }}
                    />
                  )}
                  {taskCount > 0 && (
                    <View
                      style={{
                        backgroundColor: isSelected
                          ? '#ffffff30'
                          : inputBg,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: isSelected ? '#ffffff' : textColor,
                        }}
                      >
                        {taskCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Day Header & Filter Controls */}
        <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 14 }}>
          {/* Top Title & Quick Stats */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: textColor,
                  letterSpacing: -0.2,
                }}
                numberOfLines={1}
              >
                {activeDayData?.dayName ? `${activeDayData.dayName}, ${activeDayData.displayDate}` : 'Scheduled Tasks'}
              </Text>
              {activeDayData?.isToday && (
                <View
                  style={{
                    backgroundColor: brandCol + '18',
                    borderColor: brandCol + '35',
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: brandCol, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                    TODAY
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Progress Badge */}
            {allTasksForActiveDay.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 10,
                  backgroundColor:
                    completedCountForDay === allTasksForActiveDay.length
                      ? '#10b98118'
                      : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : '#f1f5f9',
                  borderWidth: 1,
                  borderColor:
                    completedCountForDay === allTasksForActiveDay.length
                      ? '#10b98135'
                      : borderCol,
                }}
              >
                {completedCountForDay === allTasksForActiveDay.length ? (
                  <CheckCircle2 size={12} color="#10b981" />
                ) : (
                  <Clock size={12} color={subTextColor} />
                )}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: completedCountForDay === allTasksForActiveDay.length ? '#10b981' : subTextColor,
                  }}
                >
                  {completedCountForDay}/{allTasksForActiveDay.length} done
                </Text>
              </View>
            )}
          </View>

          {/* Segmented Filter Bar */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
              padding: 4,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: borderCol,
              gap: 4,
            }}
          >
            {(
              [
                { id: 'all', label: 'All', count: allTasksForActiveDay.length },
                { id: 'pending', label: 'Pending', count: pendingCountForDay },
                { id: 'completed', label: 'Completed', count: completedCountForDay },
              ] as const
            ).map((item) => {
              const isActive = statusFilter === item.id;
              const countBadgeColor = isActive
                ? item.id === 'completed'
                  ? '#10b981'
                  : item.id === 'pending'
                  ? '#f59e0b'
                  : brandCol
                : subTextColor;

              const countBadgeBg = isActive
                ? item.id === 'completed'
                  ? '#10b98120'
                  : item.id === 'pending'
                  ? '#f59e0b20'
                  : brandCol + '18'
                : isDark
                ? 'rgba(255,255,255,0.08)'
                : '#e2e8f0';

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setStatusFilter(item.id)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 7,
                    paddingHorizontal: 8,
                    borderRadius: 10,
                    gap: 6,
                    backgroundColor: isActive
                      ? isDark
                        ? cardBg
                        : '#ffffff'
                      : 'transparent',
                    shadowColor: isActive ? '#000' : 'transparent',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isActive ? (isDark ? 0.3 : 0.08) : 0,
                    shadowRadius: 2,
                    elevation: isActive ? 2 : 0,
                    borderWidth: isActive && isDark ? 1 : 0,
                    borderColor: borderCol,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? textColor : subTextColor,
                    }}
                  >
                    {item.label}
                  </Text>
                  <View
                    style={{
                      backgroundColor: countBadgeBg,
                      paddingHorizontal: 6,
                      paddingVertical: 1.5,
                      borderRadius: 8,
                      minWidth: 18,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: countBadgeColor,
                      }}
                    >
                      {item.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <ConnectionStateView
          isLoading={loading}
          error={tasksError}
          hasData={days.length > 0}
          onRetry={refetchTasks}
          isRetrying={loading}
        >
          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={brandCol} />
              <Text style={{ color: subTextColor, marginTop: 12, fontSize: 13 }}>Loading tasks...</Text>
            </View>
          ) : errorMessage && days.length === 0 ? (
            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                borderRadius: 16,
                padding: 28,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fecaca',
              }}
            >
              <AlertCircle size={36} color="#ef4444" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#ef4444', marginTop: 10 }}>
                Unable to Load Tasks
              </Text>
              <Text style={{ fontSize: 12.5, color: subTextColor, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                {errorMessage}
              </Text>
              <TouchableOpacity
                onPress={() => refetchTasks()}
                style={{
                  backgroundColor: brandCol,
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  borderRadius: 10,
                  marginTop: 14,
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 12.5, fontWeight: '700' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredTasks.length === 0 ? (
            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: cardBg,
                borderRadius: 16,
                padding: 32,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: borderCol,
              }}
            >
              <CheckCircle2 size={40} color={subTextColor} style={{ opacity: 0.5 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginTop: 12 }}>
                No tasks scheduled
              </Text>
              <Text style={{ fontSize: 12, color: subTextColor, textAlign: 'center', marginTop: 4 }}>
                {statusFilter === 'all'
                  ? 'There are no follow-ups assigned for this date.'
                  : `No ${statusFilter} tasks for this date.`}
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, gap: 12 }}>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.leadId}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onReschedule={openRescheduleModal}
                />
              ))}
            </View>
          )}
        </ConnectionStateView>
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal visible={!!rescheduleLead} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                Reschedule Task
              </Text>
              <TouchableOpacity onPress={() => setRescheduleLead(null)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: subTextColor }}>
              Reschedule follow-up for <Text style={{ fontWeight: '700', color: textColor }}>{rescheduleLead?.name}</Text>
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>Quick Presets:</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Today', days: 0 },
                { label: 'Tomorrow', days: 1 },
                { label: 'In 3 Days', days: 3 },
                { label: 'Next Week', days: 7 },
              ].map((p) => (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => setNewDateInput(formatDateISO(addDays(new Date(), p.days)))}
                  style={{
                    backgroundColor: inputBg,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, color: textColor, fontWeight: '500' }}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>
                Target Date (YYYY-MM-DD):
              </Text>
              <TextInput
                value={newDateInput}
                onChangeText={setNewDateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={subTextColor}
                style={{
                  borderWidth: 1,
                  borderColor: borderCol,
                  borderRadius: 10,
                  padding: 12,
                  color: textColor,
                  fontSize: 14,
                  backgroundColor: bgColor,
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => setRescheduleLead(null)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: subTextColor, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRescheduleSubmit}
                disabled={rescheduleMutation.isPending}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: brandCol,
                  alignItems: 'center',
                }}
              >
                {rescheduleMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Save New Date</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: '80%',
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                Today's Follow-up Alerts ({notifications.length})
              </Text>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10 }}>
              {notifications.length === 0 ? (
                <Text style={{ color: subTextColor, paddingVertical: 20, textAlign: 'center' }}>
                  No pending notifications for today.
                </Text>
              ) : (
                notifications.map((item) => (
                  <TouchableOpacity
                    key={item.leadId}
                    onPress={() => {
                      setShowNotifModal(false);
                      handleNavigateToLead(item.leadId);
                    }}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: bgColor,
                      borderWidth: 1,
                      borderColor: borderCol,
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: textColor, fontSize: 14 }}>{item.name}</Text>
                    <Text style={{ color: subTextColor, fontSize: 12, marginTop: 2 }}>{item.contact}</Text>
                    {item.comments && (
                      <Text style={{ color: textColor, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
                        "{item.comments}"
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={handleMarkNotificationsRead}
              style={{
                backgroundColor: brandCol,
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Mark All as Read</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
