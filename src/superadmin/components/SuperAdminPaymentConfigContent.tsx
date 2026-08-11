import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import AppFooter from '../../auth/components/AppFooter';
import { apiClient } from '@/api/apiClient';
import { API_ENDPOINTS } from '@/api/endpoints';

interface PaymentConfig {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
}

const emptyConfig: PaymentConfig = {
  razorpayKeyId: '',
  razorpayKeySecret: '',
  razorpayWebhookSecret: '',
};

export default function SuperAdminPaymentConfigContent() {
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PaymentConfig>(emptyConfig);
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);

  // Theme
  const bgColor    = isDark ? '#0f172a' : '#f8fafc';
  const cardBg     = isDark ? '#1e293b' : '#ffffff';
  const textColor  = isDark ? '#f1f5f9' : '#1e293b';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol  = isDark ? '#334155' : '#e2e8f0';
  const inputBg    = isDark ? '#0f172a' : '#ffffff';

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get(API_ENDPOINTS.PAYMENT_CONFIG.GET);
      if (res?.success && res?.data) {
        const d = res.data;
        setConfig({
          razorpayKeyId:       d.razorpayKeyId       ?? d.RazorpayKeyId       ?? '',
          razorpayKeySecret:   d.razorpayKeySecret   ?? d.RazorpayKeySecret   ?? '',
          razorpayWebhookSecret: d.razorpayWebhookSecret ?? d.RazorpayWebhookSecret ?? '',
        });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const saveConfig = useCallback(async () => {
    if (!config.razorpayKeyId.trim() || !config.razorpayKeySecret.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Key ID and Secret Key are required.' });
      return;
    }
    try {
      setSaving(true);
      const res: any = await apiClient.put(API_ENDPOINTS.PAYMENT_CONFIG.SAVE, {
        razorpayKeyId:        config.razorpayKeyId.trim(),
        razorpayKeySecret:    config.razorpayKeySecret.trim(),
        razorpayWebhookSecret: config.razorpayWebhookSecret.trim(),
      });
      if (res?.success) {
        Toast.show({ type: 'success', text1: 'Saved', text2: res.message || 'Payment configuration saved successfully.' });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res?.message || 'Failed to save.' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setSaving(false);
    }
  }, [config]);

  const updateField = (key: keyof PaymentConfig, val: string) =>
    setConfig(prev => ({ ...prev, [key]: val }));

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card */}
        <View style={{
          backgroundColor: cardBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: borderCol,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: borderCol,
          }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="card-outline" size={18} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                Razorpay Configuration
              </Text>
              <Text style={{ fontSize: 12, color: labelColor, marginTop: 1 }}>
                Payment gateway credentials for the platform
              </Text>
            </View>
          </View>

          <View style={{ padding: 16, gap: 20 }}>
            {/* Key ID */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="key-outline" size={15} color={labelColor} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                  Key ID
                </Text>
              </View>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  borderWidth: 1,
                  borderColor: borderCol,
                  backgroundColor: inputBg,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  height: 46,
                  color: textColor,
                  fontSize: 14,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                }}
                value={config.razorpayKeyId}
                onChangeText={v => updateField('razorpayKeyId', v)}
                placeholder="rzp_live_xxxxxxxxxx"
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              />
              <Text style={{ fontSize: 11, color: labelColor, marginTop: 5 }}>
                Your Razorpay Key ID (starts with rzp_live_ or rzp_test_)
              </Text>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: borderCol }} />

            {/* Secret Key */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="lock-closed-outline" size={15} color={labelColor} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                  Secret Key
                </Text>
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: borderCol,
                backgroundColor: inputBg,
                borderRadius: 10,
                paddingHorizontal: 14,
                height: 46,
              }}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showSecret}
                  style={{
                    flex: 1,
                    color: textColor,
                    fontSize: 14,
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  }}
                  value={config.razorpayKeySecret}
                  onChangeText={v => updateField('razorpayKeySecret', v)}
                  placeholder="Enter Secret Key"
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                />
                <TouchableOpacity onPress={() => setShowSecret(s => !s)} style={{ padding: 4 }}>
                  <Ionicons
                    name={showSecret ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color={labelColor}
                  />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: labelColor, marginTop: 5 }}>
                Keep this secret — never share publicly
              </Text>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: borderCol }} />

            {/* Webhook Secret */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="git-merge-outline" size={15} color={labelColor} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                  Webhook Secret
                </Text>
                <View style={{
                  marginLeft: 4,
                  backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}>
                  <Text style={{ fontSize: 10, color: labelColor, fontWeight: '600' }}>Optional</Text>
                </View>
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: borderCol,
                backgroundColor: inputBg,
                borderRadius: 10,
                paddingHorizontal: 14,
                height: 46,
              }}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showWebhook}
                  style={{
                    flex: 1,
                    color: textColor,
                    fontSize: 14,
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  }}
                  value={config.razorpayWebhookSecret}
                  onChangeText={v => updateField('razorpayWebhookSecret', v)}
                  placeholder="Enter Webhook Secret"
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                />
                <TouchableOpacity onPress={() => setShowWebhook(s => !s)} style={{ padding: 4 }}>
                  <Ionicons
                    name={showWebhook ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color={labelColor}
                  />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: labelColor, marginTop: 5 }}>
                Required only if you have Razorpay webhook events configured
              </Text>
            </View>

            {/* Info note */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 8,
            }}>
              <Ionicons name="information-circle-outline" size={15} color={labelColor} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 12, color: labelColor, lineHeight: 17 }}>
                Find your credentials in the Razorpay Dashboard under{' '}
                <Text style={{ fontWeight: '700' }}>Settings → API Keys</Text>.
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={saveConfig}
          disabled={saving}
          style={{
            backgroundColor: '#0284c7',
            marginTop: 20,
            borderRadius: 14,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>Saving...</Text>
            </>
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>Save Configuration</Text>
            </>
          )}
        </TouchableOpacity>

        <AppFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
