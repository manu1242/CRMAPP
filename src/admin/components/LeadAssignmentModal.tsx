import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { UserCheck, X, User, UserX, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { LeadService } from '../services/LeadService';
import AgentSelector, { AgentOption } from './AgentSelector';

interface LeadAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  leadId: number;
  leadName?: string;
  currentAgentId?: number | null;
  currentAgentName?: string | null;
  onSuccess?: (newAgentId: number | null, newAgentName: string) => void;
}

const isIdLikeName = (name?: string | null): boolean => {
  if (!name) return true;
  const trimmed = name.trim();
  if (!trimmed || trimmed.toLowerCase() === 'unassigned') return true;
  return /^#?\d+$/.test(trimmed) || /^(agent|user)\s*#?\d+$/i.test(trimmed);
};

export default function LeadAssignmentModal({
  visible,
  onClose,
  leadId,
  leadName,
  currentAgentId,
  currentAgentName,
  onSuccess,
}: LeadAssignmentModalProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const queryClient = useQueryClient();

  const [executives, setExecutives] = useState<AgentOption[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentOption | null>(null);
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

  // Load active executives on modal open using scoped assignable agents
  useEffect(() => {
    if (visible) {
      let isMounted = true;
      LeadService.getAssignableAgents()
        .then((res) => {
          if (!isMounted) return;
          if (res && res.success && res.data) {
            setExecutives(res.data);
          }
        })
        .catch(() => {});

      return () => {
        isMounted = false;
      };
    }
  }, [visible]);

  // Resolve current agent's real name from props or loaded executives
  const resolvedCurrentAgent = useMemo(() => {
    if (!currentAgentId) return null;
    const matched = executives.find((e) => e.userId === currentAgentId);
    if (matched) return matched;
    if (currentAgentName && !isIdLikeName(currentAgentName)) {
      return { userId: currentAgentId, username: currentAgentName, role: 'Agent' };
    }
    return null;
  }, [currentAgentId, currentAgentName, executives]);

  const displayCurrentName = useMemo(() => {
    if (!currentAgentId) return 'Unassigned';
    if (resolvedCurrentAgent?.username) return resolvedCurrentAgent.username;
    if (currentAgentName && !isIdLikeName(currentAgentName)) return currentAgentName;
    return 'Assigned Agent';
  }, [currentAgentId, resolvedCurrentAgent, currentAgentName]);

  // Synchronize selectedAgent whenever modal opens or currentAgentId/name resolves
  useEffect(() => {
    if (visible) {
      if (currentAgentId) {
        if (resolvedCurrentAgent) {
          setSelectedAgent(resolvedCurrentAgent);
        } else {
          setSelectedAgent({
            userId: currentAgentId,
            username: currentAgentName && !isIdLikeName(currentAgentName) ? currentAgentName : 'Assigned Agent',
            role: 'Agent',
          });
        }
      } else {
        setSelectedAgent(null);
      }
    }
  }, [visible, currentAgentId, resolvedCurrentAgent]);

  const handleSave = async () => {
    if (!leadId) return;

    try {
      setSubmitting(true);
      const targetAgentId = selectedAgent ? selectedAgent.userId : null;
      const res = await LeadService.assignLead(leadId, targetAgentId);

      if (res && res.success !== false) {
        const agentName = selectedAgent ? selectedAgent.username : 'Unassigned';
        Toast.show({
          type: 'success',
          text1: 'Assignment Updated',
          text2: selectedAgent
            ? `Lead assigned to ${selectedAgent.username}`
            : 'Lead marked as unassigned',
        });

        // Invalidate relevant queries for real-time consistency
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['lead', String(leadId)] });
        queryClient.invalidateQueries({ queryKey: ['leadDetails', String(leadId)] });
        queryClient.invalidateQueries({ queryKey: ['unassigned_leads'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        if (onSuccess) {
          onSuccess(targetAgentId, agentName);
        }
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Assignment Failed',
          text2: res?.message || 'Could not update assignment',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || err?.message || 'Assignment failed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: borderCol }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={[styles.iconWrap, { backgroundColor: `${brandCol}15` }]}>
                  <UserCheck size={18} color={brandCol} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: textColor }]}>Assign Lead</Text>
                  <Text style={[styles.subtitle, { color: subTextColor }]} numberOfLines={1}>
                    {leadName ? `${leadName}` : 'Select team member'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={18} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <View style={styles.body}>
              {/* Current Assignee Section */}
              <Text style={[styles.label, { color: subTextColor }]}>Current Assignee</Text>
              <View style={[styles.assigneeCard, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <View style={styles.assigneeRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: currentAgentId ? `${brandCol}15` : '#94a3b815' }]}>
                    {currentAgentId ? (
                      <Text style={[styles.avatarText, { color: brandCol }]}>
                        {displayCurrentName.charAt(0).toUpperCase()}
                      </Text>
                    ) : (
                      <UserX size={16} color={subTextColor} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.assigneeName, { color: textColor }]} numberOfLines={1}>
                      {displayCurrentName}
                    </Text>
                    <Text style={[styles.assigneeRole, { color: subTextColor }]}>
                      {currentAgentId ? (resolvedCurrentAgent?.role || 'Active Agent') : 'No agent currently assigned'}
                    </Text>
                  </View>
                  {currentAgentId ? (
                    <View style={[styles.statusBadge, { backgroundColor: '#10b98115', borderColor: '#10b98130' }]}>
                      <Text style={[styles.statusBadgeText, { color: '#10b981' }]}>Assigned</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b30' }]}>
                      <Text style={[styles.statusBadgeText, { color: '#d97706' }]}>Unassigned</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* New Assignee Section */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <Text style={[styles.label, { color: subTextColor }]}>New Assignee</Text>
                {selectedAgent && (
                  <TouchableOpacity
                    onPress={() => setSelectedAgent(null)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#ef4444' }}>Clear (Unassign)</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setShowSelector(true)}
                activeOpacity={0.7}
                style={[
                  styles.assigneeCard,
                  styles.interactiveCard,
                  { backgroundColor: inputBg, borderColor: selectedAgent ? brandCol : borderCol },
                ]}
              >
                <View style={styles.assigneeRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: selectedAgent ? `${brandCol}20` : '#94a3b820' }]}>
                    {selectedAgent ? (
                      <Text style={[styles.avatarText, { color: brandCol }]}>
                        {selectedAgent.username.charAt(0).toUpperCase()}
                      </Text>
                    ) : (
                      <User size={16} color={subTextColor} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.assigneeName,
                        { color: selectedAgent ? textColor : subTextColor },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedAgent ? selectedAgent.username : 'Tap to select an agent...'}
                    </Text>
                    <Text style={[styles.assigneeRole, { color: subTextColor }]}>
                      {selectedAgent ? (selectedAgent.role || 'Sales Agent') : 'Choose a team member or leave unassigned'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={subTextColor} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Footer Buttons */}
            <View style={[styles.footer, { borderTopColor: borderCol }]}>
              <TouchableOpacity
                onPress={onClose}
                disabled={submitting}
                style={[styles.cancelBtn, { borderColor: borderCol }]}
              >
                <Text style={[styles.cancelBtnText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={submitting}
                style={[styles.saveBtn, { backgroundColor: brandCol }]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Confirm Assignment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Embedded Agent Selector Modal */}
      <AgentSelector
        visible={showSelector}
        selectedAgentId={selectedAgent ? selectedAgent.userId : null}
        availableAgents={executives}
        onSelect={(agent) => setSelectedAgent(agent)}
        onClose={() => setShowSelector(false)}
        allowUnassign={true}
        title="Choose Agent"
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  assigneeCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  interactiveCard: {
    borderStyle: 'solid',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  assigneeName: {
    fontSize: 13,
    fontWeight: '600',
  },
  assigneeRole: {
    fontSize: 11,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    minWidth: 130,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
