import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { AssignOwnerSubscriptionRequest } from '../models/ownerSubscription';
import { useTheme } from '../../../contexts/ThemeContext';

interface AssignOwnerSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: AssignOwnerSubscriptionRequest) => void;
  isLoading?: boolean;
}

const PRESET_MONTHS = [1, 3, 6, 12];

export const AssignOwnerSubscriptionModal: React.FC<AssignOwnerSubscriptionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const { isDark } = useTheme();

  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#cbd5e1';
  const inputBg = isDark ? '#0f172a' : '#f8fafc';

  const [phone, setPhone] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [customMonths, setCustomMonths] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [amountPaid, setAmountPaid] = useState('499');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setPhone('');
      setSelectedMonths(1);
      setCustomMonths('');
      setIsCustom(false);
      setAmountPaid('499');
      setNotes('');
      setErrors({});
    }
  }, [visible]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Enter a valid 10-digit mobile number';
    }

    const effectiveMonths = isCustom ? parseInt(customMonths, 10) : selectedMonths;
    if (!effectiveMonths || isNaN(effectiveMonths) || effectiveMonths <= 0) {
      errs.months = 'Please specify valid duration in months';
    }

    if (amountPaid.trim() === '' || isNaN(Number(amountPaid)) || Number(amountPaid) < 0) {
      errs.amountPaid = 'Please enter a valid amount (or 0 for free)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const effectiveMonths = isCustom ? parseInt(customMonths, 10) : selectedMonths;

    const payload: AssignOwnerSubscriptionRequest = {
      ownerPhone: phone.trim().replace(/\D/g, ''),
      months: effectiveMonths,
      amountPaid: parseFloat(amountPaid) || 0,
      notes: notes.trim() || undefined,
    };

    onSubmit(payload);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Pressable
            style={[styles.modalContainer, { backgroundColor: cardBg, borderColor: borderCol }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: borderCol }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.headerIconBox, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}>
                  <Ionicons name="person-add-outline" size={18} color="#3b82f6" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: textColor }]}>
                    Assign Owner Subscription
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: subTextColor }]}>
                    Grant active subscription directly to an owner
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
              >
                <Ionicons name="close" size={18} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Body */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
              {/* Owner Phone */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  Owner Mobile Number <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWithIcon,
                    {
                      backgroundColor: inputBg,
                      borderColor: errors.phone ? '#ef4444' : borderCol,
                    },
                  ]}
                >
                  <Ionicons name="call-outline" size={16} color={subTextColor} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.nestedInput, { color: textColor }]}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor={subTextColor}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(t) => {
                      setPhone(t);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                  />
                </View>
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
              </View>

              {/* Duration in Months */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  Duration (Months) <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <View style={styles.presetsRow}>
                  {PRESET_MONTHS.map((m) => {
                    const active = !isCustom && selectedMonths === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => {
                          setIsCustom(false);
                          setSelectedMonths(m);
                          if (errors.months) setErrors((prev) => ({ ...prev, months: '' }));
                        }}
                        style={[
                          styles.presetChip,
                          active
                            ? { backgroundColor: '#2563eb', borderColor: '#2563eb' }
                            : {
                                backgroundColor: inputBg,
                                borderColor: borderCol,
                              },
                        ]}
                      >
                        <Text style={[styles.presetText, { color: active ? '#ffffff' : textColor }]}>
                          {m} {m === 1 ? 'Month' : 'Months'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => {
                      setIsCustom(true);
                    }}
                    style={[
                      styles.presetChip,
                      isCustom
                        ? { backgroundColor: '#2563eb', borderColor: '#2563eb' }
                        : {
                            backgroundColor: inputBg,
                            borderColor: borderCol,
                          },
                    ]}
                  >
                    <Text style={[styles.presetText, { color: isCustom ? '#ffffff' : textColor }]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>

                {isCustom && (
                  <View style={{ marginTop: 8 }}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: inputBg,
                          borderColor: errors.months ? '#ef4444' : borderCol,
                          color: textColor,
                        },
                      ]}
                      placeholder="Enter number of months (e.g. 2, 5)"
                      placeholderTextColor={subTextColor}
                      keyboardType="number-pad"
                      value={customMonths}
                      onChangeText={(t) => {
                        setCustomMonths(t);
                        if (errors.months) setErrors((prev) => ({ ...prev, months: '' }));
                      }}
                    />
                    {errors.months ? <Text style={styles.errorText}>{errors.months}</Text> : null}
                  </View>
                )}
              </View>

              {/* Amount Paid */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: textColor }]}>
                  Amount Paid (₹) <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWithIcon,
                    {
                      backgroundColor: inputBg,
                      borderColor: errors.amountPaid ? '#ef4444' : borderCol,
                    },
                  ]}
                >
                  <Text style={[styles.currencyPrefix, { color: subTextColor }]}>₹</Text>
                  <TextInput
                    style={[styles.nestedInput, { color: textColor }]}
                    placeholder="499.00"
                    placeholderTextColor={subTextColor}
                    keyboardType="decimal-pad"
                    value={amountPaid}
                    onChangeText={(t) => {
                      setAmountPaid(t);
                      if (errors.amountPaid) setErrors((prev) => ({ ...prev, amountPaid: '' }));
                    }}
                  />
                </View>
                {errors.amountPaid ? <Text style={styles.errorText}>{errors.amountPaid}</Text> : null}
              </View>

              {/* Notes */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: textColor }]}>Notes / Remarks</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: inputBg,
                      borderColor: borderCol,
                      color: textColor,
                    },
                  ]}
                  placeholder="e.g. Direct bank transfer / promo activation"
                  placeholderTextColor={subTextColor}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.modalFooter, { borderTopColor: borderCol }]}>
              <TouchableOpacity
                onPress={onClose}
                disabled={isLoading}
                style={[styles.cancelButton, { borderColor: borderCol }]}
              >
                <Text style={[styles.cancelButtonText, { color: subTextColor }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSubmit} disabled={isLoading} style={styles.saveButton}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
                    <Text style={styles.saveButtonText}>Assign Subscription</Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
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
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
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
