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

export const AssignOwnerSubscriptionModal: React.FC<AssignOwnerSubscriptionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const { isDark } = useTheme();

  const cardBg = isDark ? '#242424' : '#ffffff';
  const textColor = isDark ? '#FFFFFF' : '#0a0a0a';
  const subTextColor = isDark ? '#a1a1aa' : '#52525b';
  const borderCol = isDark ? '#2e2e2e' : '#e4e4e7';
  const inputBg = isDark ? '#1e1e1e' : '#f4f4f5';

  const [phone, setPhone] = useState('');
  const [months, setMonths] = useState('');
  const [amountPaid, setAmountPaid] = useState('499');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setPhone('');
      setMonths('');
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

    const parsedMonths = parseInt(months.trim(), 10);
    if (!months.trim() || isNaN(parsedMonths) || parsedMonths < 1 || parsedMonths > 120) {
      errs.months = 'Enter a valid duration (1 - 120 months)';
    }

    if (amountPaid.trim() === '' || isNaN(Number(amountPaid)) || Number(amountPaid) < 0) {
      errs.amountPaid = 'Please enter a valid amount (or 0 for free)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const parsedMonths = parseInt(months.trim(), 10) || 1;

    const payload: AssignOwnerSubscriptionRequest = {
      ownerPhone: phone.trim().replace(/\D/g, ''),
      months: parsedMonths,
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
                <View style={[styles.headerIconBox, { backgroundColor: isDark ? '#835CEE25' : '#835CEE15' }]}>
                  <Ionicons name="person-add-outline" size={18} color="#835CEE" />
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
                <View
                  style={[
                    styles.inputWithIcon,
                    {
                      backgroundColor: inputBg,
                      borderColor: errors.months ? '#ef4444' : borderCol,
                    },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={16} color={subTextColor} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.nestedInput, { color: textColor }]}
                    placeholder="e.g. 1"
                    placeholderTextColor={subTextColor}
                    keyboardType="number-pad"
                    value={months}
                    onChangeText={(t) => {
                      setMonths(t);
                      if (errors.months) setErrors((prev) => ({ ...prev, months: '' }));
                    }}
                  />
                </View>
                {errors.months ? <Text style={styles.errorText}>{errors.months}</Text> : null}
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
    backgroundColor: '#835CEE',
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
