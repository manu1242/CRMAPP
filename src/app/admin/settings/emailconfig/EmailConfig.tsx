import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
  Mail,
  Lock,
  Send,
  Save,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react-native';
import {
  emailSettingsService,
  SaveSmtpPayload,
} from '../../../../admin/services/emailSettingsService';

export default function EmailConfigScreen() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const [smtpForm, setSmtpForm] = useState<SaveSmtpPayload>({
    email: '',
    password: '',
  });

  // Test Email Modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');

  const fetchSmtpSettings = async () => {
    setLoading(true);
    try {
      const res = await emailSettingsService.getSmtpSettings();
      if (res && res.success) {
        setIsConfigured(!!res.isConfigured);
        setSmtpForm({
          email: res.email || '',
          password: res.password || '',
        });
      }
    } catch (err: any) {
      console.warn('Error fetching email settings:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmtpSettings();
  }, []);

  const handleSaveSmtp = async () => {
    if (!smtpForm.email || !smtpForm.password) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Email address and App Password are required.',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await emailSettingsService.saveSmtpSettings(smtpForm);
      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Email Settings Saved',
          text2: res.message || 'Email configuration saved successfully!',
        });
        setIsConfigured(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Save Failed',
          text2: res.message || 'Failed to save email settings',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err.message || 'Server error saving email settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a recipient email address.',
      });
      return;
    }

    setTesting(true);
    try {
      const res = await emailSettingsService.sendTestEmail({ recipientEmail: testRecipient.trim() });
      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Test Email Sent',
          text2: res.message || `Test email sent to ${testRecipient}!`,
        });
        setIsTestModalOpen(false);
        setTestRecipient('');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Send Failed',
          text2: res.message || 'Failed to send test email',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err.message || 'Server error sending test email',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Header Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: '#3b82f620',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Mail size={20} color="#3b82f6" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Email Settings</Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsTestModalOpen(true)}
          style={{
            backgroundColor: '#8b5cf6',
            paddingHorizontal: 14,
            height: 38,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Send size={15} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>Test Email</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>
              Loading email settings...
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* Status Card */}
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {isConfigured ? (
                  <CheckCircle size={22} color="#10b981" />
                ) : (
                  <XCircle size={22} color="#ef4444" />
                )}
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                    {isConfigured ? 'Email Configured' : 'Email Not Configured'}
                  </Text>
                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    {isConfigured
                      ? 'Transactional email dispatch is active'
                      : 'Configure email & app password to enable outgoing emails'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Email & Password Form Card */}
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 16,
                gap: 14,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                Sender Email & App Password
              </Text>

              {/* Sender Email */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Sender Email Address *
                </Text>
                <View
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: bgColor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Mail size={16} color={subTextColor} />
                  <TextInput
                    style={{ flex: 1, color: textColor, fontSize: 13 }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="e.g. info@company.com"
                    placeholderTextColor={subTextColor}
                    value={smtpForm.email}
                    onChangeText={(val) => setSmtpForm({ ...smtpForm, email: val })}
                  />
                </View>
              </View>

              {/* App Password */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  App Password / SMTP Password *
                </Text>
                <View
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: bgColor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Lock size={16} color={subTextColor} />
                  <TextInput
                    style={{ flex: 1, color: textColor, fontSize: 13 }}
                    secureTextEntry
                    placeholder="Enter email app password"
                    placeholderTextColor={subTextColor}
                    value={smtpForm.password}
                    onChangeText={(val) => setSmtpForm({ ...smtpForm, password: val })}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveSmtp}
                disabled={saving}
                style={{
                  backgroundColor: '#10b981',
                  height: 42,
                  borderRadius: 10,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 6,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Save size={16} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>
                      Save Configuration
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* TEST EMAIL MODAL */}
      <Modal visible={isTestModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 20,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Send Test Email</Text>
                <TouchableOpacity onPress={() => setIsTestModalOpen(false)}>
                  <X size={20} color={subTextColor} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 12 }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Recipient Email Address *
                  </Text>
                  <TextInput
                    style={{
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      paddingHorizontal: 12,
                      color: textColor,
                      backgroundColor: bgColor,
                      fontSize: 13,
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="e.g. user@example.com"
                    placeholderTextColor={subTextColor}
                    value={testRecipient}
                    onChangeText={setTestRecipient}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity
                  onPress={() => setIsTestModalOpen(false)}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: subTextColor, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendTestEmail}
                  disabled={testing}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 8,
                    backgroundColor: '#8b5cf6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  {testing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Send size={15} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Send Test</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
