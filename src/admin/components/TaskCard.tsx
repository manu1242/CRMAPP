import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { TaskLeadItem } from '../models/TaskTypes';

export interface TaskItem extends Partial<TaskLeadItem> {
  leadId: number;
  name: string;
  contact: string;
  taskType?: string;
  taskTime?: string;
  taskTitle?: string;
}

interface TaskCardProps {
  task: TaskLeadItem | TaskItem;
  onToggleComplete?: (leadId: number, isCompleted: boolean) => void;
  onReschedule?: (task: any) => void;
}

export default function TaskCard({ task, onToggleComplete, onReschedule }: TaskCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const [completed, setCompleted] = useState<boolean>(Boolean(task.isCompleted));

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

  const handleToggle = () => {
    const nextVal = !completed;
    setCompleted(nextVal);
    if (onToggleComplete) {
      onToggleComplete(task.leadId, nextVal);
    }
  };

  const cleanPhone = (task.contact || '').replace(/[^0-9+]/g, '');

  const handleCall = () => {
    if (cleanPhone) Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleWhatsApp = () => {
    if (cleanPhone) {
      const num = cleanPhone.startsWith('+') ? cleanPhone.replace('+', '') : `91${cleanPhone}`;
      Linking.openURL(`whatsapp://send?phone=${num}&text=Hi%20${encodeURIComponent(task.name || '')}`);
    }
  };

  // Derive task fields safely for either TaskItem or TaskLeadItem
  const taskAny = task as any;
  const taskType = taskAny.taskType || taskAny.stage || 'Follow-up';
  const taskTime = taskAny.taskTime || (taskAny.followUpDate ? taskAny.followUpDate.split('T')[1]?.substring(0, 5) : undefined);
  const taskTitle = taskAny.taskTitle || taskAny.name || 'Task';

  // Icon mapping based on taskType
  const getTypeColor = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('visit') || t.includes('site')) return '#10b981';
    if (t.includes('meet') || t.includes('discuss')) return '#8b5cf6';
    if (t.includes('quot') || t.includes('invoice')) return '#3b82f6';
    if (t.includes('book')) return '#f59e0b';
    return '#06b6d4';
  };

  const typeColor = getTypeColor(taskType);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: cardBg, borderColor: borderCol },
        completed && { opacity: 0.65 },
      ]}
    >
      <View style={styles.topRow}>
        {/* Checkbox */}
        <TouchableOpacity onPress={handleToggle} style={styles.checkbox}>
          {completed ? (
            <CheckCircle2 size={20} color={brandCol} />
          ) : (
            <Circle size={20} color={subTextColor} />
          )}
        </TouchableOpacity>

        {/* Content */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.7}
          onPress={() => router.push(`/admin/leads/${task.leadId}`)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15`, borderColor: `${typeColor}35` }]}>
              <Text style={[styles.typeText, { color: typeColor }]}>{taskType}</Text>
            </View>
            {taskTime ? (
              <View style={styles.timeWrap}>
                <Clock size={11} color={subTextColor} />
                <Text style={[styles.timeText, { color: subTextColor }]}>{taskTime}</Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[
              styles.taskTitle,
              { color: textColor },
              completed && { textDecorationLine: 'line-through' },
            ]}
            numberOfLines={2}
          >
            {taskTitle}
          </Text>

          <Text style={[styles.leadMeta, { color: subTextColor }]}>
            {task.name} {task.contact ? `· ${task.contact}` : ''}
          </Text>

          {task.comments ? (
            <Text style={[styles.comments, { color: subTextColor }]} numberOfLines={2}>
              "{task.comments}"
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Footer Actions */}
      <View style={[styles.footer, { borderTopColor: borderCol }]}>
        <View style={styles.actionIcons}>
          {cleanPhone ? (
            <TouchableOpacity onPress={handleCall} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
              <Phone size={13} color={brandCol} />
            </TouchableOpacity>
          ) : null}

          {cleanPhone ? (
            <TouchableOpacity onPress={handleWhatsApp} style={[styles.iconBtn, { backgroundColor: inputBg }]}>
              <MessageSquare size={13} color="#25D366" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {onReschedule ? (
            <TouchableOpacity
              onPress={() => onReschedule(task)}
              style={[styles.rescheduleBtn, { backgroundColor: inputBg, borderColor: borderCol }]}
            >
              <Calendar size={12} color={subTextColor} />
              <Text style={[styles.rescheduleText, { color: textColor }]}>Reschedule</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => router.push(`/admin/leads/${task.leadId}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
          >
            <Text style={{ fontSize: 11, color: brandCol, fontWeight: '600' }}>View Lead</Text>
            <ChevronRight size={13} color={brandCol} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    paddingTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  leadMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  comments: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  rescheduleText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
