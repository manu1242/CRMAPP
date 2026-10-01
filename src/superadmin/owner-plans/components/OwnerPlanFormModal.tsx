import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OwnerPlan, CreateOwnerPlanRequest, UpdateOwnerPlanRequest } from '../models/ownerPlan';
import { useTheme } from '../../../contexts/ThemeContext';

interface OwnerPlanFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOwnerPlanRequest | UpdateOwnerPlanRequest) => void;
  planToEdit?: OwnerPlan | null;
  isLoading?: boolean;
}

export const OwnerPlanFormModal: React.FC<OwnerPlanFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  planToEdit,
  isLoading = false,
}) => {
  const { isDark } = useTheme();

  // Theme colors
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#cbd5e1';
  const inputBg = isDark ? '#0f172a' : '#f8fafc';

  // Form State
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [isUnlimitedLeads, setIsUnlimitedLeads] = useState(false);
  const [maxLeadsUnlock, setMaxLeadsUnlock] = useState('50');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (planToEdit) {
      setPlanName(planToEdit.planName || '');
      setPrice(planToEdit.price !== undefined ? String(planToEdit.price) : '');
      setValidityDays(planToEdit.validityDays !== undefined ? String(planToEdit.validityDays) : '30');
      const unlimited = planToEdit.maxLeadsUnlock === -1 || planToEdit.maxLeadsUnlock < 0;
      setIsUnlimitedLeads(unlimited);
      setMaxLeadsUnlock(unlimited ? '' : String(planToEdit.maxLeadsUnlock));
      setDescription(planToEdit.description || '');
      setIsActive(planToEdit.isActive ?? true);
    } else {
      setPlanName('');
      setPrice('');
      setValidityDays('30');
      setIsUnlimitedLeads(false);
      setMaxLeadsUnlock('50');
      setDescription('');
      setIsActive(true);
    }
    setErrors({});
  }, [planToEdit, visible]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!planName.trim()) {
      errs.planName = 'Package name is required';
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) < 0) {
      errs.price = 'Please enter a valid price';
    }
    if (!validityDays.trim() || isNaN(Number(validityDays)) || Number(validityDays) <= 0) {
      errs.validityDays = 'Please enter valid validity in days';
    }
    if (!isUnlimitedLeads) {
      if (!maxLeadsUnlock.trim() || isNaN(Number(maxLeadsUnlock)) || Number(maxLeadsUnlock) < 0) {
        errs.maxLeadsUnlock = 'Please enter a valid lead unlock number';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload: CreateOwnerPlanRequest = {
      planName: planName.trim(),
      price: parseFloat(price),
      validityDays: parseInt(validityDays, 10),
      maxLeadsUnlock: isUnlimitedLeads ? -1 : parseInt(maxLeadsUnlock, 10),
      description: description.trim() || undefined,
      isActive,
    };

    onSubmit(payload);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Pressable
            style={[
              styles.modalContainer,
              {
                backgroundColor: cardBg,
                borderColor: borderCol,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: borderCol }]}>
              <View>
                <Text style={[styles.modalTitle, { color: textColor }]}>
                  {planToEdit ? 'Edit Owner Package' : 'Create Owner Package'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: subTextColor }]}>
                  {planToEdit
                    ? 'Update pricing and limits for this package'
                    : 'Add a new owner subscription package'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
              >
                <Ionicons name="close" size={18} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Form Scroll Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
            >
              {/* Plan Name */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  Package Name <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      borderColor: errors.planName ? '#ef4444' : borderCol,
                      color: textColor,
                    },
                  ]}
                  placeholder="e.g. Gold Package Pro"
                  placeholderTextColor={subTextColor}
                  value={planName}
                  onChangeText={(text) => {
                    setPlanName(text);
                    if (errors.planName) setErrors((prev) => ({ ...prev, planName: '' }));
                  }}
                />
                {errors.planName ? (
                  <Text style={styles.errorText}>{errors.planName}</Text>
                ) : null}
              </View>

              {/* Price & Validity Row */}
              <View style={styles.row}>
                {/* Price */}
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: textColor }]}>
                    Price (₹) <Text style={{ color: '#ef4444' }}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWithIcon,
                      {
                        backgroundColor: inputBg,
                        borderColor: errors.price ? '#ef4444' : borderCol,
                      },
                    ]}
                  >
                    <Text style={[styles.currencyPrefix, { color: subTextColor }]}>₹</Text>
                    <TextInput
                      style={[styles.nestedInput, { color: textColor }]}
                      placeholder="399.00"
                      placeholderTextColor={subTextColor}
                      keyboardType="decimal-pad"
                      value={price}
                      onChangeText={(text) => {
                        setPrice(text);
                        if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                      }}
                    />
                  </View>
                  {errors.price ? (
                    <Text style={styles.errorText}>{errors.price}</Text>
                  ) : null}
                </View>

                {/* Validity Days */}
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: textColor }]}>
                    Validity (Days) <Text style={{ color: '#ef4444' }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: inputBg,
                        borderColor: errors.validityDays ? '#ef4444' : borderCol,
                        color: textColor,
                      },
                    ]}
                    placeholder="30"
                    placeholderTextColor={subTextColor}
                    keyboardType="number-pad"
                    value={validityDays}
                    onChangeText={(text) => {
                      setValidityDays(text);
                      if (errors.validityDays) setErrors((prev) => ({ ...prev, validityDays: '' }));
                    }}
                  />
                  {errors.validityDays ? (
                    <Text style={styles.errorText}>{errors.validityDays}</Text>
                  ) : null}
                </View>
              </View>

              {/* Max Leads Unlock */}
              <View style={styles.fieldGroup}>
                <View style={styles.leadHeaderRow}>
                  <Text style={[styles.label, { color: textColor, marginBottom: 0 }]}>
                    Leads Unlock Limit <Text style={{ color: '#ef4444' }}>*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      const next = !isUnlimitedLeads;
                      setIsUnlimitedLeads(next);
                      if (next) {
                        setMaxLeadsUnlock('');
                      } else {
                        setMaxLeadsUnlock('50');
                      }
                    }}
                    style={styles.unlimitedToggleBtn}
                  >
                    <Ionicons
                      name={isUnlimitedLeads ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={isUnlimitedLeads ? '#8b5cf6' : subTextColor}
                    />
                    <Text
                      style={[
                        styles.unlimitedToggleText,
                        { color: isUnlimitedLeads ? '#8b5cf6' : subTextColor },
                      ]}
                    >
                      Unlimited Leads (-1)
                    </Text>
                  </TouchableOpacity>
                </View>

                {!isUnlimitedLeads ? (
                  <View style={{ marginTop: 8 }}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: inputBg,
                          borderColor: errors.maxLeadsUnlock ? '#ef4444' : borderCol,
                          color: textColor,
                        },
                      ]}
                      placeholder="e.g. 50"
                      placeholderTextColor={subTextColor}
                      keyboardType="number-pad"
                      value={maxLeadsUnlock}
                      onChangeText={(text) => {
                        setMaxLeadsUnlock(text);
                        if (errors.maxLeadsUnlock)
                          setErrors((prev) => ({ ...prev, maxLeadsUnlock: '' }));
                      }}
                    />
                    {errors.maxLeadsUnlock ? (
                      <Text style={styles.errorText}>{errors.maxLeadsUnlock}</Text>
                    ) : null}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.unlimitedInfoBox,
                      { backgroundColor: isDark ? '#1e1b4b30' : '#f5f3ff', borderColor: '#c4b5fd' },
                    ]}
                  >
                    <Ionicons name="infinite" size={16} color="#8b5cf6" />
                    <Text style={[styles.unlimitedInfoText, { color: '#8b5cf6' }]}>
                      This package grants unlimited lead unlocks (value: -1).
                    </Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: textColor }]}>Description</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: inputBg,
                      borderColor: borderCol,
                      color: textColor,
                    },
                  ]}
                  placeholder="Describe target audience, perks and details..."
                  placeholderTextColor={subTextColor}
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Is Active Status Switch */}
              <View
                style={[
                  styles.switchBox,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderColor: borderCol,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchTitle, { color: textColor }]}>
                    Active Status
                  </Text>
                  <Text style={[styles.switchSubtitle, { color: subTextColor }]}>
                    {isActive
                      ? 'Package is published and available for owners'
                      : 'Package is inactive / hidden'}
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#93c5fd' }}
                  thumbColor={isActive ? '#2563eb' : isDark ? '#64748b' : '#f1f5f9'}
                />
              </View>
            </ScrollView>

            {/* Action Footer */}
            <View style={[styles.modalFooter, { borderTopColor: borderCol }]}>
              <TouchableOpacity
                onPress={onClose}
                disabled={isLoading}
                style={[styles.cancelButton, { borderColor: borderCol }]}
              >
                <Text style={[styles.cancelButtonText, { color: subTextColor }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                style={styles.saveButton}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
                    <Text style={styles.saveButtonText}>
                      {planToEdit ? 'Update Package' : 'Create Package'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 480,
  },
  modalContainer: {
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    padding: 20,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  inputWithIcon: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  nestedInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
  },
  textArea: {
    minHeight: 70,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  leadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unlimitedToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlimitedToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  unlimitedInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  unlimitedInfoText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
