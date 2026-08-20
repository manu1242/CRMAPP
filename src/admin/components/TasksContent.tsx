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

// Helper date utilities
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
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

  const [currentMondayDate, setCurrentMondayDate] = useState<Date>(() => getMonday(new Date()));
  const weekStartStr = formatDateISO(currentMondayDate);

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
    setCurrentMondayDate((prev) => addDays(prev, -7));
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentMondayDate((prev) => addDays(prev, 7));
  }, []);

  const handleTodayClick = useCallback(() => {
    setCurrentMondayDate(getMonday(new Date()));
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

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
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

          {/* Today's Follow-up Alerts button */}
          <TouchableOpacity
            onPress={() => setShowNotifModal(true)}
            style={{
              position: 'relative',
              backgroundColor: inputBg,
              padding: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: borderCol,
            }}
          >
            <Bell size={18} color={textColor} />
            {notificationCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#ef4444',
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>
                  {notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
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

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
              {activeDayData?.dayName || ''}, {activeDayData?.displayDate || ''}
            </Text>
            {activeDayData?.isToday && (
              <View
                style={{
                  backgroundColor: adminTheme.badgeBg,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: adminTheme.badgeText, fontSize: 10, fontWeight: '700' }}>TODAY</Text>
              </View>
            )}
            <Text style={{ fontSize: 12, color: subTextColor }}>
              ({pendingCountForDay} pending, {completedCountForDay} done)
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['all', 'pending', 'completed'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setStatusFilter(filter)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor:
                    statusFilter === filter
                      ? inputBg
                      : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: statusFilter === filter ? textColor : subTextColor,
                    textTransform: 'capitalize',
                  }}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
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
                <View
                  key={task.leadId}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: task.isCompleted ? borderCol : brandCol + '40',
                    padding: 16,
                    opacity: task.isCompleted ? 0.75 : 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <TouchableOpacity onPress={() => handleToggleComplete(task.leadId, task.isCompleted)}>
                        {task.isCompleted ? (
                          <CheckCircle2 size={24} color={brandCol} />
                        ) : (
                          <Circle size={24} color={subTextColor} />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleNavigateToLead(task.leadId)}
                        style={{ flex: 1 }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: '700',
                              color: textColor,
                              textDecorationLine: task.isCompleted ? 'line-through' : 'none',
                            }}
                          >
                            {task.name}
                          </Text>
                          <ExternalLink size={14} color={subTextColor} />
                        </View>
                        <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                          {task.contact}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View
                      style={{
                        backgroundColor: '#3b82f615',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#3b82f6' }}>
                        {task.stage || 'Lead'}
                      </Text>
                    </View>
                  </View>

                  {task.comments && (
                    <View
                      style={{
                        marginTop: 12,
                        backgroundColor: bgColor,
                        padding: 10,
                        borderRadius: 10,
                        borderLeftWidth: 3,
                        borderLeftColor: brandCol,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: textColor, fontStyle: 'italic' }}>
                        "{task.comments}"
                      </Text>
                    </View>
                  )}

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 14,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: borderCol,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        {formatFollowUpTime(task.followUpDate)}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${task.contact}`)}
                        style={{
                          backgroundColor: adminTheme.badgeBg,
                          padding: 8,
                          borderRadius: 8,
                        }}
                      >
                        <Phone size={14} color={brandCol} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          Linking.openURL(
                            `whatsapp://send?phone=${task.contact.replace(/[^0-9]/g, '')}`
                          )
                        }
                        style={{
                          backgroundColor: '#25D36615',
                          padding: 8,
                          borderRadius: 8,
                        }}
                      >
                        <MessageCircle size={14} color="#25D366" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => openRescheduleModal(task)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: inputBg,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                      >
                        <RotateCcw size={12} color={textColor} />
                        <Text style={{ fontSize: 11, fontWeight: '600', color: textColor }}>
                          Reschedule
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
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
