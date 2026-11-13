import React, { useState } from 'react';
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
import { UserCheck, X } from 'lucide-react-native';
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

  const [selectedAgent, setSelectedAgent] = useState<AgentOption | null>(
    currentAgentId ? { userId: currentAgentId, username: currentAgentName || `Agent #${currentAgentId}` } : null
  );
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.iconWrap, { backgroundColor: `${brandCol}15` }]}>
                  <UserCheck size={18} color={brandCol} />
                </View>
                <View>
                  <Text style={[styles.title, { color: textColor }]}>Assign Lead</Text>
                  <Text style={[styles.subtitle, { color: subTextColor }]}>
                    Lead #{leadId} {leadName ? `· ${leadName}` : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <View style={styles.body}>
              <Text style={[styles.label, { color: subTextColor }]}>Current Assignee</Text>
              <Text style={[styles.currentText, { color: textColor }]}>
                {currentAgentName || (currentAgentId ? `Agent #${currentAgentId}` : 'Unassigned')}
              </Text>

              <Text style={[styles.label, { color: subTextColor, marginTop: 14 }]}>
                New Assignee
              </Text>
              <TouchableOpacity
                onPress={() => setShowSelector(true)}
                style={[styles.pickerBtn, { backgroundColor: inputBg, borderColor: borderCol }]}
              >
                <Text
                  style={[
                    styles.pickerBtnText,
                    { color: selectedAgent ? textColor : subTextColor },
                  ]}
                >
                  {selectedAgent ? `${selectedAgent.username} (${selectedAgent.role || 'Agent'})` : 'Select an agent or unassign...'}
                </Text>
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
    maxWidth: 400,
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
  },
  currentText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  pickerBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: '500',
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
    minWidth: 120,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

