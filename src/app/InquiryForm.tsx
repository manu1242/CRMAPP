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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import KeyboardSafeArea from '../auth/components/KeyboardSafeArea';
import { useTheme } from '../contexts/ThemeContext';
import { getAdminTheme } from '../theme/adminTheme';
import { apiClient } from '../api/apiClient';
import Toast from 'react-native-toast-message';[]

const InquiryForm = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  // States
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme-sensitive styles
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subtitleColor = adminTheme.textSecondary;
  const errorColor = '#ef4444';
  const borderCol = adminTheme.border;
  const placeholderColor = adminTheme.textMuted;
  const iconColor = adminTheme.textSecondary;

  //cleanUp Using useRef
  const NavigationTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = async () => {
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

    try {
      const payload = {
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        message: message.trim() || null,
        referralCode: referralCode.trim() || null,
      };

      // Attempt the primary /Home/SubmitInquiry submission endpoint
      await apiClient.post('/Home/SubmitInquiry', payload);

      Toast.show({
        type: 'success',
        text1: 'Inquiry Submitted',
        text2: 'Thank you! We will get back to you shortly.',
      });

      // Reset form
      setCompanyName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setReferralCode('');
      setMessage('');

      // Delay redirect slightly so user sees success toast
      NavigationTimeRef.current = setTimeout(() => {
        router.replace('/main-login');
      }, 1500);

    } catch (error: any) {
      console.error('Submission failed:', error);

      // Attempt fallback 1: mobile API
      try {
        await apiClient.post('/api/v1/InquiryApi/SubmitInquiry', {
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          message: message.trim() || null,
          referralCode: referralCode.trim() || null,
        });

        Toast.show({
          type: 'success',
          text1: 'Inquiry Submitted',
          text2: 'Thank you! We will get back to you shortly.',
        });

        NavigationTimeRef.current = setTimeout(() => {
          router.replace('/main-login');
        }, 1500);
        return;
      } catch (fallbackError: any) {
        console.error('InquiryApi fallback failed:', fallbackError);
      }

      // Attempt fallback 2: pluralized inquiries path
      try {
        await apiClient.post('/api/v1/inquiries', {
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          message: message.trim() || null,
          referralCode: referralCode.trim() || null,
        });

        Toast.show({
          type: 'success',
          text1: 'Inquiry Submitted',
          text2: 'Thank you! We will get back to you shortly.',
        });

        NavigationTimeRef.current = setTimeout(() => {
          router.replace('/main-login');
        }, 1500);
        return;
      } catch (fallbackError: any) {
        console.error('Fallback endpoint also failed:', fallbackError);
      }

      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (NavigationTimeRef.current) {
        clearTimeout(NavigationTimeRef.current);
        NavigationTimeRef.current = null;
      }
    }

  }, [])

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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: borderCol, backgroundColor: cardBg }]}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Request Access</Text>
      </View>

      {/* Form Container */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
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
              placeholder="e.g. +1 (555) 123-4567"
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
              placeholder="Tell us more about your workspace requirement..."
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
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
      </View>
    </KeyboardSafeArea>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
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
    height: 100,
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