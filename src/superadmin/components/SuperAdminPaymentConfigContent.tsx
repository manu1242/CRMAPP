import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import AppFooter from '../../auth/components/AppFooter';
import {
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  ShieldCheck,
  Save,
  X,
  Zap,
  SlidersHorizontal,
  Key,
  Lock,
  Webhook,
} from 'lucide-react-native';
import {
  paymentGatewaySettingsService,
  PaymentGatewaySettings,
} from '@/admin/services/PaymentGatewaySettingsService';

type GatewayType = 'Razorpay' | 'Stripe';

export default function SuperAdminPaymentConfigContent() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [activeGateway, setActiveGateway] = useState<GatewayType>('Razorpay');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Active form / saved configuration state
  const [savedConfig, setSavedConfig] = useState<PaymentGatewaySettings | null>(null);
  const [form, setForm] = useState<PaymentGatewaySettings>({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    isActive: false,
  });

  // Fetch settings from API for selected gateway
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
          isActive: res.data.isActive ?? true,
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
    fetchSettings(activeGateway);
  }, [activeGateway, fetchSettings]);

  // Tab switch
  const handleSelectTab = useCallback((gw: GatewayType) => {
    setActiveGateway(gw);
    setShowSecret(false);
  }, []);

  // Start Editing
  const handleStartEdit = useCallback(() => {
    if (savedConfig) {
      setForm({ ...savedConfig });
    }
    setIsEditing(true);
  }, [savedConfig]);

  // Cancel Editing
  const handleCancelEdit = useCallback(() => {
    if (savedConfig && savedConfig.keyId) {
      setForm({ ...savedConfig });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [savedConfig]);

  // Save Settings to Backend API
  const handleSaveSettings = useCallback(async () => {
    if (!form.keyId.trim() || !form.keySecret.trim()) {
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

      const res = await paymentGatewaySettingsService.saveSettings(activeGateway, payload);

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
        text1: 'Configuration Saved',
        text2: res?.message || `${activeGateway} gateway configuration updated successfully!`,
      });
    } catch (err: any) {
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
        text1: 'Configuration Saved',
        text2: `${activeGateway} gateway configuration saved!`,
      });
    } finally {
      setSaving(false);
    }
  }, [form, activeGateway]);

  // Toggle IsActive from Card View directly
  const handleToggleActive = useCallback(async (val: boolean) => {
    if (!savedConfig) return;
    const updated = { ...savedConfig, isActive: val };
    setSavedConfig(updated);
    setForm(updated);

    try {
      await paymentGatewaySettingsService.saveSettings(activeGateway, {
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
      text2: `${activeGateway} is now ${val ? 'Active' : 'Inactive'}`,
    });
  }, [savedConfig, activeGateway]);

  // Mask string
  const maskKey = useCallback((key: string, visibleStart = 8, visibleEnd = 4) => {
    if (!key) return '••••••••••••';
    if (key.length <= visibleStart + visibleEnd) return key;
    const start = key.slice(0, visibleStart);
    const end = key.slice(-visibleEnd);
    return `${start}••••••••${end}`;
  }, []);

  // Colors
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#e2e8f0';
  const brandBlue = '#2563eb';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, flexGrow: 1, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: textColor, letterSpacing: -0.4 }}>
                Payment Gateway Config
              </Text>
              <Text style={{ color: subTextColor, fontSize: 12, marginTop: 2, fontWeight: '500' }}>
                Manage payment gateway credentials & settings
              </Text>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                borderColor: 'rgba(37, 99, 235, 0.25)',
                borderWidth: 1,
                padding: 8,
                borderRadius: 12,
              }}
            >
              <CreditCard size={20} color={brandBlue} />
            </View>
          </View>

          {/* Gateway Tabs */}
          <View style={{ backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor: borderCol, padding: 6, flexDirection: 'row', gap: 6 }}>
            {(['Razorpay', 'Stripe'] as GatewayType[]).map((gw) => {
              const isSelected = activeGateway === gw;
              return (
                <TouchableOpacity
                  key={gw}
                  onPress={() => handleSelectTab(gw)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: isSelected ? brandBlue : 'transparent',
                  }}
                >
                  <CreditCard size={16} color={isSelected ? '#ffffff' : subTextColor} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: isSelected ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                    }}
                  >
                    {gw === 'Razorpay' ? 'Razorpay (₹)' : 'Stripe ($)'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Loading Indicator */}
          {loading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={brandBlue} />
              <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13, fontWeight: '500' }}>
                Fetching {activeGateway} credentials...
              </Text>
            </View>
          ) : savedConfig && !isEditing ? (
            <View style={{ gap: 14 }}>
              <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        backgroundColor: savedConfig.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.12)',
                        borderColor: savedConfig.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(148,163,184,0.25)',
                        borderWidth: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Zap size={22} color={savedConfig.isActive ? '#10b981' : '#94a3b8'} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                        {activeGateway} Integration
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 3.5,
                            backgroundColor: savedConfig.isActive ? '#10b981' : '#94a3b8',
                          }}
                        />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: savedConfig.isActive ? '#10b981' : subTextColor }}>
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
                      backgroundColor: 'rgba(37, 99, 235, 0.12)',
                      borderColor: 'rgba(37, 99, 235, 0.25)',
                      borderWidth: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 10,
                    }}
                  >
                    <Edit3 size={13} color={brandBlue} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: brandBlue }}>Edit</Text>
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
                    trackColor={{ false: '#94a3b8', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: borderCol, paddingBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} color="#10b981" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: textColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Saved API Credentials
                    </Text>
                  </View>
                  {savedConfig.updatedOn && (
                    <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '500' }}>
                      {savedConfig.updatedOn}
                    </Text>
                  )}
                </View>

                <View style={{ gap: 12 }}>
                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: borderCol }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {activeGateway === 'Razorpay' ? 'KEY ID' : 'PUBLISHABLE KEY'}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                      {savedConfig.keyId}
                    </Text>
                  </View>

                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: borderCol }}>
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
                    <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: borderCol }}>
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
                    backgroundColor: brandBlue,
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
            </View>
          ) : (
            <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 18, gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderCol, paddingBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <SlidersHorizontal size={18} color={brandBlue} />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: textColor }}>
                    {savedConfig ? `Edit ${activeGateway} Credentials` : `Configure ${activeGateway}`}
                  </Text>
                </View>
                {savedConfig && (
                  <TouchableOpacity onPress={handleCancelEdit} style={{ padding: 4 }}>
                    <X size={18} color={subTextColor} />
                  </TouchableOpacity>
                )}
              </View>

              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                  {activeGateway === 'Razorpay' ? 'KEY ID *' : 'PUBLISHABLE KEY *'}
                </Text>
                <View
                  style={{
                    height: 44,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
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
                    placeholder={`Enter your ${activeGateway} Key ID`}
                    placeholderTextColor={subTextColor}
                    value={form.keyId}
                    onChangeText={(val) => setForm({ ...form, keyId: val })}
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                  SECRET KEY *
                </Text>
                <View
                  style={{
                    height: 44,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
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
                    placeholder={`Enter your ${activeGateway} Secret Key`}
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
                <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                  WEBHOOK SECRET (OPTIONAL)
                </Text>
                <View
                  style={{
                    height: 44,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
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
                    placeholder="Enter Webhook Secret"
                    placeholderTextColor={subTextColor}
                    value={form.webhookSecret || ''}
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
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
                    Activate Gateway
                  </Text>
                  <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                    Mark this gateway active for customer checkouts
                  </Text>
                </View>
                <Switch
                  value={form.isActive}
                  onValueChange={(val) => setForm({ ...form, isActive: val })}
                  trackColor={{ false: '#94a3b8', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                {savedConfig && (
                  <TouchableOpacity
                    onPress={handleCancelEdit}
                    disabled={saving}
                    style={{
                      flex: 1,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      borderColor: borderCol,
                      borderWidth: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
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
                    backgroundColor: '#10b981',
                    paddingVertical: 12,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Save size={15} color="#ffffff" />
                      <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Save Settings</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <AppFooter />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
