import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { Layers, X, Plus, Check } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { LeadService } from '../services/LeadService';

interface LeadStageModalProps {
  visible: boolean;
  onClose: () => void;
  leadId: number;
  leadName?: string;
  currentStage?: string | null;
  onSuccess?: (newStage: string) => void;
}

const DEFAULT_STAGES = [
  'New',
  'Enquiry',
  'Contacted',
  'Site Visit Requested',
  'Site Visit Done',
  'Office Meeting',
  'Quotation',
  'Quotation Sent',
  'Negotiation',
  'Booked',
  'Converted',
  'Support',
];

export default function LeadStageModal({
  visible,
  onClose,
  leadId,
  leadName,
  currentStage,
  onSuccess,
}: LeadStageModalProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const queryClient = useQueryClient();

  const [stages, setStages] = useState<string[]>(DEFAULT_STAGES);
  const [selectedStage, setSelectedStage] = useState<string>(currentStage || 'New');
  const [newStageName, setNewStageName] = useState<string>('');
  const [loadingStages, setLoadingStages] = useState<boolean>(false);
  const [creatingStage, setCreatingStage] = useState<boolean>(false);
  const [savingStage, setSavingStage] = useState<boolean>(false);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

  useEffect(() => {
    if (visible) {
      setSelectedStage(currentStage || 'New');
      setNewStageName('');
      loadStages();
    }
  }, [visible, currentStage]);

  const loadStages = async () => {
    try {
      setLoadingStages(true);
      const res = await LeadService.getStages();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Unique stages
        const unique = Array.from(new Set([...DEFAULT_STAGES, ...res.data]));
        setStages(unique);
      }
    } catch (err) {
      console.warn('Failed to load stages in LeadStageModal:', err);
    } finally {
      setLoadingStages(false);
    }
  };

  const handleCreateStage = async () => {
    const trimmed = newStageName.trim();
    if (!trimmed) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Enter a stage name up to 50 characters.',
      });
      return;
    }

    if (trimmed.length > 50) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Stage name cannot exceed 50 characters.',
      });
      return;
    }

    if (stages.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      Toast.show({
        type: 'info',
        text1: 'Stage Exists',
        text2: 'That stage already exists in the list.',
      });
      setSelectedStage(trimmed);
      setNewStageName('');
      return;
    }

    try {
      setCreatingStage(true);
      const res = await LeadService.createLeadStage(trimmed);
      if (res && (res.success !== false || (res as any).stage)) {
        const createdName = (res as any).stage || trimmed;
        setStages((prev) => [...prev, createdName]);
        setSelectedStage(createdName);
        setNewStageName('');
        Toast.show({
          type: 'success',
          text1: 'Stage Created',
          text2: `Custom stage "${createdName}" added.`,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Creation Failed',
          text2: res?.message || 'Could not create stage.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || err?.message || 'Failed to create stage.',
      });
    } finally {
      setCreatingStage(false);
    }
  };

  const handleSaveStage = async () => {
    if (!leadId) return;
    if (!selectedStage) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a lead stage.',
      });
      return;
    }

    try {
      setSavingStage(true);
      const res = await LeadService.updateLeadStage(leadId, selectedStage);
      if (res && res.success !== false) {
        Toast.show({
          type: 'success',
          text1: 'Stage Updated',
          text2: `Lead stage changed to "${selectedStage}".`,
        });

        // Invalidate queries for instant UI refresh
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['lead', String(leadId)] });
        queryClient.invalidateQueries({ queryKey: ['leadDetails', String(leadId)] });
        queryClient.invalidateQueries({ queryKey: ['salesPipeline'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        if (onSuccess) {
          onSuccess(selectedStage);
        }
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: res?.message || 'Could not update lead stage.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || err?.message || 'Failed to update stage.',
      });
    } finally {
      setSavingStage(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderCol }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.iconWrap, { backgroundColor: `${brandCol}15` }]}>
                <Layers size={18} color={brandCol} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: textColor }]}>Change Lead Stage</Text>
                <Text style={[styles.subtitle, { color: subTextColor }]} numberOfLines={1}>
                  Lead #{leadId} {leadName ? `· ${leadName}` : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={subTextColor} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Select Stage</Text>
              {loadingStages && <ActivityIndicator size="small" color={brandCol} />}
            </View>

            {/* Stages Grid / Options */}
            <View style={styles.stagesContainer}>
              {stages.map((stage) => {
                const isSelected = selectedStage?.toLowerCase() === stage?.toLowerCase();
                return (
                  <TouchableOpacity
                    key={stage}
                    activeOpacity={0.7}
                    onPress={() => setSelectedStage(stage)}
                    style={[
                      styles.stageChip,
                      {
                        backgroundColor: isSelected ? `${brandCol}15` : inputBg,
                        borderColor: isSelected ? brandCol : borderCol,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected ? brandCol : borderCol,
                          backgroundColor: isSelected ? brandCol : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                    </View>
                    <Text
                      style={[
                        styles.stageChipText,
                        {
                          color: isSelected ? brandCol : textColor,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {stage}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Stage Creation Section */}
            <View style={[styles.customStageBox, { backgroundColor: inputBg, borderColor: borderCol }]}>
              <Text style={[styles.customStageTitle, { color: textColor }]}>
                Create a custom stage for this tenant
              </Text>
              <Text style={[styles.customStageHelp, { color: subTextColor }]}>
                Custom stages are saved in this tenant's database.
              </Text>

              <View style={styles.createRow}>
                <TextInput
                  value={newStageName}
                  onChangeText={setNewStageName}
                  placeholder="Enter stage name"
                  placeholderTextColor={subTextColor}
                  maxLength={50}
                  style={[
                    styles.input,
                    {
                      backgroundColor: cardBg,
                      color: textColor,
                      borderColor: borderCol,
                    },
                  ]}
                  returnKeyType="done"
                  onSubmitEditing={handleCreateStage}
                />
                <TouchableOpacity
                  onPress={handleCreateStage}
                  disabled={creatingStage || !newStageName.trim()}
                  style={[
                    styles.addBtn,
                    {
                      borderColor: brandCol,
                      backgroundColor: newStageName.trim() ? `${brandCol}12` : 'transparent',
                      opacity: newStageName.trim() ? 1 : 0.5,
                    },
                  ]}
                >
                  {creatingStage ? (
                    <ActivityIndicator size="small" color={brandCol} />
                  ) : (
                    <>
                      <Plus size={14} color={brandCol} />
                      <Text style={[styles.addBtnText, { color: brandCol }]}>Add stage</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.footer, { borderTopColor: borderCol }]}>
            <TouchableOpacity
              onPress={onClose}
              disabled={savingStage}
              style={[styles.cancelBtn, { borderColor: borderCol }]}
            >
              <Text style={[styles.cancelBtnText, { color: textColor }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveStage}
              disabled={savingStage}
              style={[styles.saveBtn, { backgroundColor: brandCol }]}
            >
              {savingStage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Stage</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  stageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageChipText: {
    fontSize: 13,
  },
  customStageBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  customStageTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  customStageHelp: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  createRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

