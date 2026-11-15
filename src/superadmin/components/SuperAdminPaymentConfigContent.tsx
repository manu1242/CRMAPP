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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import AppFooter from '../../auth/components/AppFooter';
import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { useBottomNavSpacing } from '../../hooks/useBottomNavSpacing';

interface PaymentConfig {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
  cashfreeAppId: string;
  cashfreeSecretKey: string;
  isActive: boolean;
}

const emptyConfig: PaymentConfig = {
  razorpayKeyId: '',
  razorpayKeySecret: '',
  razorpayWebhookSecret: '',
  cashfreeAppId: '',
  cashfreeSecretKey: '',
  isActive: true,
};

type GatewayTab = 'Razorpay' | 'Cashfree';

export default function SuperAdminPaymentConfigContent() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { bottomSpacing } = useBottomNavSpacing();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PaymentConfig>(emptyConfig);
  const [activeTab, setActiveTab] = useState<GatewayTab>('Razorpay');
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [showCashfreeSecret, setShowCashfreeSecret] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);

  // Theme
  const bgColor = isDark ? '#161616' : '#FFFFFF';
  const cardBg = isDark ? '#242424' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#0a0a0a';
  const labelColor = isDark ? '#a1a1aa' : '#52525b';
  const borderCol = isDark ? '#2e2e2e' : '#e4e4e7';
  const inputBg = isDark ? '#1e1e1e' : '#f4f4f5';

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get(API_ENDPOINTS.PAYMENT_CONFIG.GET);
      if (res?.success && res?.data) {
        const d = res.data;
        setConfig({
          razorpayKeyId: d.razorpayKeyId ?? d.RazorpayKeyId ?? '',
          razorpayKeySecret: d.razorpayKeySecret ?? d.RazorpayKeySecret ?? '',
          razorpayWebhookSecret: d.razorpayWebhookSecret ?? d.RazorpayWebhookSecret ?? '',
          cashfreeAppId: d.cashfreeAppId ?? d.CashfreeAppId ?? '',
          cashfreeSecretKey: d.cashfreeSecretKey ?? d.CashfreeSecretKey ?? '',
          isActive: d.isActive !== undefined ? !!d.isActive : true,
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
    if (activeTab === 'Razorpay' && !config.razorpayKeyId.trim() && !config.cashfreeAppId.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please provide credentials for at least one gateway.' });
      return;
    }

    try {
      setSaving(true);
      const res: any = await apiClient.put(API_ENDPOINTS.PAYMENT_CONFIG.SAVE, {
        razorpayKeyId: config.razorpayKeyId.trim(),
        razorpayKeySecret: config.razorpayKeySecret.trim(),
        razorpayWebhookSecret: config.razorpayWebhookSecret.trim(),
        cashfreeAppId: config.cashfreeAppId.trim(),
        cashfreeSecretKey: config.cashfreeSecretKey.trim(),
        isActive: config.isActive,
      });
      if (res?.success) {
        Toast.show({ type: 'success', text1: 'Saved', text2: res.message || 'Payment configuration saved successfully.' });
        loadConfig();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res?.message || 'Failed to save.' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setSaving(false);
    }
  }, [config, activeTab, loadConfig]);

  const updateField = (key: keyof PaymentConfig, val: any) =>
    setConfig(prev => ({ ...prev, [key]: val }));

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#835CEE" />
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomSpacing + 20, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gateway Selection Tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: borderCol, borderRadius: 12, padding: 3, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setActiveTab('Razorpay')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: activeTab === 'Razorpay' ? cardBg : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'Razorpay' ? '#835CEE' : labelColor }}>
              Razorpay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('Cashfree')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: activeTab === 'Cashfree' ? cardBg : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'Cashfree' ? '#835CEE' : labelColor }}>
              Cashfree
            </Text>
          </TouchableOpacity>
        </View>

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
            justifyContent: 'space-between',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: borderCol,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: isDark ? '#1e1e1e' : '#f4f4f5',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="card-outline" size={18} color="#835CEE" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                  {activeTab} Configuration
                </Text>
                <Text style={{ fontSize: 12, color: labelColor, marginTop: 1 }}>
                  SuperAdmin platform payment gateway
                </Text>
              </View>
            </View>

            {/* Active Switch */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, color: labelColor, fontWeight: '600' }}>
                {config.isActive ? 'Active' : 'Inactive'}
              </Text>
              <Switch
                value={config.isActive}
                onValueChange={(v) => updateField('isActive', v)}
                trackColor={{ false: borderCol, true: '#835CEE' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {activeTab === 'Razorpay' ? (
            <View style={{ padding: 16, gap: 18 }}>
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
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                />
                <Text style={{ fontSize: 11, color: labelColor, marginTop: 5 }}>
                  Razorpay Key ID (starts with rzp_live_ or rzp_test_)
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: borderCol }} />

              {/* Secret Key */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="lock-closed-outline" size={15} color={labelColor} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                    Key Secret
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
                    secureTextEntry={!showRazorpaySecret}
                    style={{
                      flex: 1,
                      color: textColor,
                      fontSize: 14,
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    }}
                    value={config.razorpayKeySecret}
                    onChangeText={v => updateField('razorpayKeySecret', v)}
                    placeholder="Enter Key Secret"
                    placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                  />
                  <TouchableOpacity onPress={() => setShowRazorpaySecret(s => !s)} style={{ padding: 4 }}>
                    <Ionicons
                      name={showRazorpaySecret ? 'eye-off-outline' : 'eye-outline'}
                      size={16}
                      color={labelColor}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 11, color: labelColor, marginTop: 5 }}>
                  Stored securely on backend and masked in responses
                </Text>
              </View>

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
                    backgroundColor: isDark ? '#1e1e1e' : '#f4f4f5',
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
                    placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                  />
                  <TouchableOpacity onPress={() => setShowWebhook(s => !s)} style={{ padding: 4 }}>
                    <Ionicons
                      name={showWebhook ? 'eye-off-outline' : 'eye-outline'}
                      size={16}
                      color={labelColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ padding: 16, gap: 18 }}>
              {/* Cashfree App ID */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="key-outline" size={15} color={labelColor} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                    Cashfree App ID
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
                  value={config.cashfreeAppId}
                  onChangeText={v => updateField('cashfreeAppId', v)}
                  placeholder="Enter Cashfree App ID"
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                />
              </View>

              <View style={{ height: 1, backgroundColor: borderCol }} />

              {/* Cashfree Secret Key */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="lock-closed-outline" size={15} color={labelColor} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                    Cashfree Secret Key
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
                    secureTextEntry={!showCashfreeSecret}
                    style={{
                      flex: 1,
                      color: textColor,
                      fontSize: 14,
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    }}
                    value={config.cashfreeSecretKey}
                    onChangeText={v => updateField('cashfreeSecretKey', v)}
                    placeholder="Enter Cashfree Secret Key"
                    placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                  />
                  <TouchableOpacity onPress={() => setShowCashfreeSecret(s => !s)} style={{ padding: 4 }}>
                    <Ionicons
                      name={showCashfreeSecret ? 'eye-off-outline' : 'eye-outline'}
                      size={16}
                      color={labelColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={saveConfig}
          disabled={saving}
          style={{
            backgroundColor: '#835CEE',
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