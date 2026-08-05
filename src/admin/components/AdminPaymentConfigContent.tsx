import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Key,
  Webhook,
  Save,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  X,
  AlertCircle,
} from 'lucide-react-native';
import {
  paymentGatewaySettingsService,
  PaymentGatewaySettings,
} from '../services/PaymentGatewaySettingsService';

type GatewayType = 'Razorpay' | 'Stripe';

export default function AdminPaymentConfigContent() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg || (isDark ? '#1e293b' : '#f8fafc');
  const brandColor = adminTheme.brand || '#10b981';

  const [activeTab, setActiveTab] = useState<GatewayType>('Razorpay');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const [savedConfig, setSavedConfig] = useState<PaymentGatewaySettings | null>(null);
  const [form, setForm] = useState<PaymentGatewaySettings>({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    isActive: false,
  });

  const fetchSettings = useCallback(async (gateway: GatewayType) => {
    setLoading(true);
    try {
      const res = await paymentGatewaySettingsService.getSettings(gateway);
      if (res && res.success && res.data && res.data.keyId) {
        const configData: PaymentGatewaySettings = {
          id: res.data.id,
          gatewayName: res.data.gatewayName || gateway,
          keyId: res.data.keyId || '',
          keySecret: res.data.keySecret || '',
          webhookSecret: res.data.webhookSecret || '',
          isActive: !!res.data.isActive,
          updatedOn: res.data.updatedOn || new Date().toLocaleString(),
        };
        setSavedConfig(configData);
        setForm(configData);
        setIsEditing(false);
      } else {
        setSavedConfig(null);
        setForm({
          keyId: '',
          keySecret: '',
          webhookSecret: '',
          isActive: false,
        });
        setIsEditing(true);
      }
    } catch (err: any) {
      console.warn(`Error fetching ${gateway} settings:`, err?.message);
      setSavedConfig(null);
      setForm({
        keyId: '',
        keySecret: '',
        webhookSecret: '',
        isActive: false,
      });
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings(activeTab);
  }, [activeTab, fetchSettings]);

  const handleSelectTab = useCallback((tab: GatewayType) => {
    setActiveTab(tab);
    setShowSecret(false);
  }, []);

  const handleStartEdit = useCallback(() => {
    if (savedConfig) {
      setForm({ ...savedConfig });
    }
    setIsEditing(true);
  }, [savedConfig]);

  const handleCancelEdit = useCallback(() => {
    if (savedConfig && savedConfig.keyId) {
      setForm({ ...savedConfig });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [savedConfig]);

  const handleSaveSettings = useCallback(async () => {
    if (!form.keyId || !form.keySecret) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Key ID and Secret Key are required.',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        keyId: form.keyId.trim(),
        keySecret: form.keySecret.trim(),
        webhookSecret: (form.webhookSecret || '').trim(),
        isActive: form.isActive,
      };

      const res = await paymentGatewaySettingsService.saveSettings(activeTab, payload);

      const nowStr = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const newSavedConfig: PaymentGatewaySettings = {
        ...form,
        updatedOn: nowStr,
      };

      setSavedConfig(newSavedConfig);
      setIsEditing(false);

      Toast.show({
        type: 'success',
        text1: 'Settings Saved',
        text2: res?.message || `${activeTab} settings saved successfully!`,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err.message || 'Server error saving settings',
      });
    } finally {
      setSaving(false);
    }
  }, [form, activeTab]);

  const handleToggleActive = useCallback(async (val: boolean) => {
    if (!savedConfig) return;
    const updated = { ...savedConfig, isActive: val };
    setSavedConfig(updated);
    setForm(updated);

    try {
      await paymentGatewaySettingsService.saveSettings(activeTab, {
        keyId: updated.keyId,
        keySecret: updated.keySecret,
        webhookSecret: updated.webhookSecret || '',
        isActive: val,
      });
    } catch (e) {
      // Silent catch
    }

    Toast.show({
      type: 'info',
      text1: val ? 'Gateway Activated' : 'Gateway Deactivated',
      text2: `${activeTab} is now ${val ? 'Active' : 'Inactive'}`,
    });
  }, [savedConfig, activeTab]);

  const maskKey = useCallback((key: string, visibleStart = 6, visibleEnd = 4) => {
    if (!key) return '••••••••••••';
    if (key.length <= visibleStart + visibleEnd) return key;
    const start = key.slice(0, visibleStart);
    const end = key.slice(-visibleEnd);
    return `${start}••••••••${end}`;
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} activeOpacity={0.7}>
            <ArrowLeft size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Payment Gateways</Text>
        </View>

        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDark ? `${brandColor}20` : `${brandColor}10`,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CreditCard size={18} color={brandColor} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Info Box */}
        <View
          style={{
            backgroundColor: isDark ? '#1e293b60' : '#f8fafc',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: borderCol,
            padding: 12,
            flexDirection: 'row',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <AlertCircle size={18} color={subTextColor} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '500', lineHeight: 17 }}>
              Configure APIs to enable subscription checkouts, booking payment collections, and automated transactions processing.
            </Text>
          </View>
        </View>

        {/* Tab Selection */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: isDark ? '#18181b' : '#f1f5f9',
            borderRadius: 10,
            padding: 4,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: borderCol,
          }}
        >
          {(['Razorpay', 'Stripe'] as GatewayType[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => handleSelectTab(tab)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: isSelected ? cardBg : 'transparent',
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? brandColor : subTextColor,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={brandColor} />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>
              Fetching {activeTab} settings...
            </Text>
          </View>
        ) : savedConfig && !isEditing ? (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: savedConfig.isActive ? `${brandColor}18` : 'rgba(148,163,184,0.12)',
                      borderColor: savedConfig.isActive ? `${brandColor}30` : 'rgba(148,163,184,0.25)',
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap size={22} color={savedConfig.isActive ? brandColor : '#94a3b8'} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                      {activeTab} Integration
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 3.5,
                          backgroundColor: savedConfig.isActive ? brandColor : '#94a3b8',
                        }}
                      />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: savedConfig.isActive ? brandColor : subTextColor }}>
                        {savedConfig.isActive ? 'CONFIGURED & ACTIVE' : 'INACTIVE'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleStartEdit}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: `${brandColor}15`,
                    borderColor: `${brandColor}30`,
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 10,
                  }}
                >
                  <Edit3 size={13} color={brandColor} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: brandColor }}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderColor: borderCol,
                  borderWidth: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                }}
              >
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>Gateway Active Status</Text>
                  <Text style={{ fontSize: 10, color: subTextColor, marginTop: 1 }}>
                    {savedConfig.isActive ? 'Ready for customer checkouts' : 'Disabled for checkouts'}
                  </Text>
                </View>
                <Switch
                  value={savedConfig.isActive}
                  onValueChange={handleToggleActive}
                  trackColor={{ false: '#94a3b8', true: brandColor }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: borderCol, paddingBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} color={brandColor} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: textColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Saved Credentials
                  </Text>
                </View>
                {savedConfig.updatedOn && (
                  <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '500' }}>
                    {savedConfig.updatedOn}
                  </Text>
                )}
              </View>

              <View style={{ gap: 12 }}>
                <View style={{ backgroundColor: inputBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: borderCol }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {activeTab === 'Razorpay' ? 'KEY ID' : 'PUBLISHABLE KEY'}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                    {savedConfig.keyId}
                  </Text>
                </View>

                <View style={{ backgroundColor: inputBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: borderCol }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      SECRET KEY
                    </Text>
                    <TouchableOpacity onPress={() => setShowSecret(!showSecret)} style={{ padding: 2 }}>
                      {showSecret ? <EyeOff size={14} color={subTextColor} /> : <Eye size={14} color={subTextColor} />}
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                    {showSecret ? savedConfig.keySecret : maskKey(savedConfig.keySecret)}
                  </Text>
                </View>

                {savedConfig.webhookSecret ? (
                  <View style={{ backgroundColor: inputBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: borderCol }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      WEBHOOK SECRET
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                      {showSecret ? savedConfig.webhookSecret : maskKey(savedConfig.webhookSecret)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={handleStartEdit}
                activeOpacity={0.7}
                style={{
                  backgroundColor: brandColor,
                  paddingVertical: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 18,
                }}
              >
                <Edit3 size={15} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Edit Configuration</Text>
              </TouchableOpacity>
            </View>

            {savedConfig.isActive && (
              <View
                style={{
                  backgroundColor: isDark ? '#065f4620' : '#f0fdf4',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isDark ? '#065f4640' : '#bbf7d0',
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <CheckCircle2 size={24} color="#10b981" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#a7f3d0' : '#065f46' }}>
                    Gateway is Active
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#6ee7b7' : '#047857', marginTop: 2 }}>
                    {activeTab} will be utilized on checkouts.
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={{ gap: 16 }}>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderCol, paddingBottom: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                  {savedConfig ? `Edit ${activeTab} Credentials` : `Configure ${activeTab}`}
                </Text>
                {savedConfig && (
                  <TouchableOpacity onPress={handleCancelEdit} style={{ padding: 4 }}>
                    <X size={18} color={subTextColor} />
                  </TouchableOpacity>
                )}
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 6 }}>
                  Key ID *
                </Text>
                <View
                  style={{
                    height: 44,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: inputBg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Key size={16} color={subTextColor} />
                  <TextInput
                    style={{ flex: 1, color: textColor, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder={`Enter your ${activeTab} Key ID`}
                    placeholderTextColor={subTextColor}
                    value={form.keyId}
                    onChangeText={(val) => setForm({ ...form, keyId: val })}
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 6 }}>
                  Secret Key / Key Secret *
                </Text>
                <View
                  style={{
                    height: 44,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: inputBg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Lock size={16} color={subTextColor} />
                  <TextInput
                    style={{ flex: 1, color: textColor, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
                    secureTextEntry={!showSecret}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder={`Enter your ${activeTab} Secret Key`}
                    placeholderTextColor={subTextColor}
                    value={form.keySecret}
                    onChangeText={(val) => setForm({ ...form, keySecret: val })}
                  />
                  <TouchableOpacity onPress={() => setShowSecret(!showSecret)}>
                    {showSecret ? <EyeOff size={16} color={subTextColor} /> : <Eye size={16} color={subTextColor} />}
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 6 }}>
                  Webhook Secret
                </Text>
                <View
                  style={{
                    height: 44,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: inputBg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Webhook size={16} color={subTextColor} />
                  <TextInput
                    style={{ flex: 1, color: textColor, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
                    secureTextEntry={!showSecret}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Enter Webhook secret key (optional)"
                    placeholderTextColor={subTextColor}
                    value={form.webhookSecret}
                    onChangeText={(val) => setForm({ ...form, webhookSecret: val })}
                  />
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: borderCol,
                  marginTop: 6,
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                    Activate Gateway
                  </Text>
                  <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                    Mark this gateway as active for processing payments
                  </Text>
                </View>
                <Switch
                  value={form.isActive}
                  onValueChange={(val) => setForm({ ...form, isActive: val })}
                  trackColor={{ false: '#71717a', true: brandColor }}
                  thumbColor="#fff"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {savedConfig && (
                  <TouchableOpacity
                    onPress={handleCancelEdit}
                    disabled={saving}
                    style={{
                      flex: 1,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      borderColor: borderCol,
                      borderWidth: 1,
                      height: 44,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: textColor, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleSaveSettings}
                  disabled={saving}
                  style={{
                    flex: 1,
                    backgroundColor: brandColor,
                    height: 44,
                    borderRadius: 10,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Save size={16} color="#ffffff" />
                      <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
                        Save Settings
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
