import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import KeyboardSafeArea from '../auth/components/KeyboardSafeArea';
import { useTheme } from '../contexts/ThemeContext';
import { getAdminTheme } from '../theme/adminTheme';
import { apiClient } from '../api/apiClient';
import Toast from 'react-native-toast-message';

const InquiryForm = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; identifier?: string }>();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  // Active Tab: 'new_account' | 'account_recovery'
  const [activeTab, setActiveTab] = useState<'new_account' | 'account_recovery'>(
    params.tab === 'recovery' ? 'account_recovery' : 'new_account'
  );

  // ── New Account States ────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [message, setMessage] = useState('');

  // ── Account Recovery States ───────────────────────────────────────────────
  const [recoveryIdentifier, setRecoveryIdentifier] = useState(params.identifier || '');
  const [recoveryFullName, setRecoveryFullName] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState(
    params.identifier && params.identifier.includes('@') ? params.identifier : ''
  );
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryCompany, setRecoveryCompany] = useState('');
  const [recoveryReason, setRecoveryReason] = useState(
    'My account was deleted/deactivated. I would like to request account reactivation and retrieve my account details.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme-sensitive styles
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subtitleColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const placeholderColor = adminTheme.textMuted;
  const iconColor = adminTheme.textSecondary;

  // Cleanup Using useRef
  const navigationTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (params.tab === 'recovery') {
      setActiveTab('account_recovery');
    }
    if (params.identifier) {
      setRecoveryIdentifier(params.identifier);
      if (params.identifier.includes('@') && !recoveryEmail) {
        setRecoveryEmail(params.identifier);
      }
    }
  }, [params.tab, params.identifier]);

  useEffect(() => {
    return () => {
      if (navigationTimeRef.current) {
        clearTimeout(navigationTimeRef.current);
        navigationTimeRef.current = null;
      }
    };
  }, []);

  // ── Submit New Account Inquiry ───────────────────────────────────────────
  const handleSubmitNewAccount = async () => {
    if (!companyName.trim() || !contactPerson.trim() || !email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Required Fields Missing',
        text2: 'Please fill in Company, Contact Person, and Email.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address.',
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      message: message.trim() || null,
      referralCode: referralCode.trim() || null,
    };

    try {
      await apiClient.post('/Home/SubmitInquiry', payload);
      Toast.show({
        type: 'success',
        text1: 'Inquiry Submitted',
        text2: 'Thank you! We will get back to you shortly.',
      });

      setCompanyName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setReferralCode('');
      setMessage('');

      navigationTimeRef.current = setTimeout(() => {
        router.replace('/main-login');
      }, 1500);
    } catch (error: any) {
      console.error('Submission failed:', error);
      try {
        await apiClient.post('/api/v1/InquiryApi/SubmitInquiry', payload);
        Toast.show({
          type: 'success',
          text1: 'Inquiry Submitted',
          text2: 'Thank you! We will get back to you shortly.',
        });
        navigationTimeRef.current = setTimeout(() => {
          router.replace('/main-login');
        }, 1500);
        return;
      } catch (fallbackError: any) {
        try {
          await apiClient.post('/api/v1/inquiries', payload);
          Toast.show({
            type: 'success',
            text1: 'Inquiry Submitted',
            text2: 'Thank you! We will get back to you shortly.',
          });
          navigationTimeRef.current = setTimeout(() => {
            router.replace('/main-login');
          }, 1500);
          return;
        } catch (err3) {
          Toast.show({
            type: 'error',
            text1: 'Submission Failed',
            text2: error?.message || 'Something went wrong. Please try again.',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Submit Account Recovery Request ──────────────────────────────────────
  const handleSubmitRecovery = async () => {
    if (!recoveryIdentifier.trim() || !recoveryEmail.trim() || !recoveryReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Required Fields Missing',
        text2: 'Please fill in Username/Email, Contact Email, and Reason.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail.trim())) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid recovery email address.',
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyName: recoveryCompany.trim() || 'Account Recovery',
      contactPerson: recoveryFullName.trim() || recoveryIdentifier.trim(),
      email: recoveryEmail.trim(),
      phone: recoveryPhone.trim() || null,
      message: `[ACCOUNT RECOVERY REQUEST]\nAccount Identifier: ${recoveryIdentifier.trim()}\nPrevious Company: ${recoveryCompany.trim() || 'N/A'}\nReason & Details: ${recoveryReason.trim()}`,
      referralCode: 'ACCOUNT_RECOVERY',
    };

    try {
      await apiClient.post('/Home/SubmitInquiry', payload);
      Toast.show({
        type: 'success',
        text1: 'Recovery Request Submitted',
        text2: 'Our team will review your account and contact you soon.',
      });

      navigationTimeRef.current = setTimeout(() => {
        router.replace('/main-login');
      }, 1500);
    } catch (error: any) {
      console.error('Recovery submission failed:', error);
      try {
        await apiClient.post('/api/v1/InquiryApi/SubmitInquiry', payload);
        Toast.show({
          type: 'success',
          text1: 'Recovery Request Submitted',
          text2: 'Our team will review your account and contact you soon.',
        });
        navigationTimeRef.current = setTimeout(() => {
          router.replace('/main-login');
        }, 1500);
        return;
      } catch (fallbackError: any) {
        try {
          await apiClient.post('/api/v1/inquiries', payload);
          Toast.show({
            type: 'success',
            text1: 'Recovery Request Submitted',
            text2: 'Our team will review your account and contact you soon.',
          });
          navigationTimeRef.current = setTimeout(() => {
            router.replace('/main-login');
          }, 1500);
          return;
        } catch (err3) {
          Toast.show({
            type: 'error',
            text1: 'Submission Failed',
            text2: error?.message || 'Something went wrong. Please try again.',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardSafeArea
      backgroundColor={bgColor}
      contentContainerStyle={{
        backgroundColor: bgColor,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
        flexGrow: 1,
      }}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: borderCol, backgroundColor: cardBg }]}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {activeTab === 'new_account' ? 'Request Access' : 'Account Recovery'}
        </Text>
      </View>

      {/* Segmented Tab Switcher */}
      <View style={[styles.tabBarContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0' }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('new_account')}
          activeOpacity={0.8}
          style={[
            styles.tabButton,
            activeTab === 'new_account' && [styles.activeTabButton, { backgroundColor: cardBg }],
          ]}
        >
          <Ionicons
            name="person-add-outline"
            size={16}
            color={activeTab === 'new_account' ? adminTheme.brand : subtitleColor}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'new_account' ? adminTheme.brand : subtitleColor },
              activeTab === 'new_account' && styles.activeTabText,
            ]}
          >
            New Account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('account_recovery')}
          activeOpacity={0.8}
          style={[
            styles.tabButton,
            activeTab === 'account_recovery' && [styles.activeTabButton, { backgroundColor: cardBg }],
          ]}
        >
          <Ionicons
            name="refresh-circle-outline"
            size={18}
            color={activeTab === 'account_recovery' ? '#10B981' : subtitleColor}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'account_recovery' ? '#10B981' : subtitleColor },
              activeTab === 'account_recovery' && styles.activeTabText,
            ]}
          >
            Account Recovery
          </Text>
        </TouchableOpacity>
      </View>

      {/* Card Container */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
        {activeTab === 'new_account' ? (
          /* ── NEW ACCOUNT FORM ── */
          <>
            <Text style={[styles.welcomeText, { color: textColor }]}>
              Submit an Inquiry
            </Text>
            <Text style={[styles.subText, { color: subtitleColor }]}>
              Provide your details below and our team will prepare your CRM workspace.
            </Text>

            {/* Company Name */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Company Name *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="business-outline" size={18} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="e.g. Acme Corporation"
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Contact Person */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Contact Person Name *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="person-outline" size={18} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={contactPerson}
                  onChangeText={setContactPerson}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Email Address *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="mail-outline" size={18} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. john@acme.com"
                  placeholderTextColor={placeholderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Phone Number (Optional)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="call-outline" size={18} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor={placeholderColor}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Referral Code */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Referral Code (Optional)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="gift-outline" size={18} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="e.g. REF-12345"
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Message */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Message / Notes (Optional)</Text>
              <View style={[styles.inputWrapper, styles.multilineWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color={iconColor} style={[styles.inputIcon, styles.multilineIcon]} />
                <TextInput
                  style={[styles.input, styles.multilineInput, { color: textColor }]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Tell us about your workspace requirement..."
                  placeholderTextColor={placeholderColor}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmitNewAccount}
              disabled={isSubmitting}
              activeOpacity={0.8}
              style={[styles.submitButton, { backgroundColor: adminTheme.brand }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitText}>Submit Inquiry</Text>
                  <Ionicons name="paper-plane" size={16} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          /* ── ACCOUNT RECOVERY FORM ── */
          <>
            <Text style={[styles.welcomeText, { color: textColor }]}>
              Account Recovery
            </Text>
            <Text style={[styles.subText, { color: subtitleColor }]}>
              If your account was deleted or deactivated, submit your details to request account restoration or retrieve your data.
            </Text>

            {/* Recovery Info Callout */}
            <View style={[
              styles.infoCallout,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
              }
            ]}>
              <Ionicons name="shield-checkmark" size={18} color="#10B981" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={[styles.infoCalloutText, { color: isDark ? '#6EE7B7' : '#065F46' }]}>
                Under our data safety and compliance retention policy, deleted accounts within the recovery grace period can be restored by our support team.
              </Text>
            </View>

            {/* Username or Registered Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Username or Registered Email *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="person-outline" size={18} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={recoveryIdentifier}
                  onChangeText={setRecoveryIdentifier}
                  placeholder="e.g. agent_rahul or rahul@example.com"
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Your Full Name (Optional)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="id-card-outline" size={18} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={recoveryFullName}
                  onChangeText={setRecoveryFullName}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Recovery Contact Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Contact Email for Response *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="mail-outline" size={18} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={recoveryEmail}
                  onChangeText={setRecoveryEmail}
                  placeholder="Where can we email you regarding recovery?"
                  placeholderTextColor={placeholderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Registered Phone Number (Optional)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="call-outline" size={18} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={recoveryPhone}
                  onChangeText={setRecoveryPhone}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor={placeholderColor}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Previous Company / Workspace */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Previous Company / Workspace (Optional)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="business-outline" size={18} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={recoveryCompany}
                  onChangeText={setRecoveryCompany}
                  placeholder="e.g. UpropTech Real Estate"
                  placeholderTextColor={placeholderColor}
                />
              </View>
            </View>

            {/* Reason / Recovery Details */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Recovery Reason & Details *</Text>
              <View style={[styles.inputWrapper, styles.multilineWrapper, { backgroundColor: bgColor, borderColor: borderCol }]}>
                <Ionicons name="document-text-outline" size={18} color={iconColor} style={[styles.inputIcon, styles.multilineIcon]} />
                <TextInput
                  style={[styles.input, styles.multilineInput, { color: textColor }]}
                  value={recoveryReason}
                  onChangeText={setRecoveryReason}
                  placeholder="Explain why you are requesting recovery or details..."
                  placeholderTextColor={placeholderColor}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Recovery Submit Button */}
            <TouchableOpacity
              onPress={handleSubmitRecovery}
              disabled={isSubmitting}
              activeOpacity={0.8}
              style={[styles.submitButton, { backgroundColor: '#10B981' }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitText}>Submit Recovery Request</Text>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardSafeArea>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabBarContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTabButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  infoCalloutText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  multilineWrapper: {
    height: 96,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  multilineIcon: {
    marginTop: 2,
  },
  multilineInput: {
    height: '100%',
    textAlignVertical: 'top',
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default InquiryForm;