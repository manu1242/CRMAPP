import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '@/theme/adminTheme';
import {
  Settings,
  Building,
  Save,
  DollarSign,
  FileText,
  MapPin,
  Phone,
  Mail,
  Percent,
  Hash,
  Globe,
} from 'lucide-react-native';
import {
  systemSettingsService,
  SystemSettingsMap,
} from '../../../../admin/services/systemSettingsService';

export default function SystemSettingsScreen() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<SystemSettingsMap>({
    CompanyName: 'UPropTech Solutions',
    GSTNumber: '',
    Address: '',
    MapURL: '',
    PhoneNumber: '',
    EmailAddress: '',
    CopyrightText: '© 2026 UPropTech All Rights Reserved',
    CompanyLogo: '',
    CollapsedLogo: '',
    GSTRate: '5',
    DefaultBooking: '20',
    EMIStructure: '20-30-30-20',
    CurrencySymbol: '₹',
    InvoicePrefix: 'INV',
    QuotationPrefix: 'QT',
    BookingPrefix: 'BK',
  });

  const fetchSettings = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await systemSettingsService.getSettings();
      if (res && res.success && res.settings) {
        setSettings((prev) => ({
          ...prev,
          ...res.settings,
        }));
      }
    } catch (err: any) {
      console.warn('System settings fetch warning (using defaults):', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await systemSettingsService.saveSettings({ settings });
      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Settings Saved',
          text2: res.message || 'System settings saved successfully!',
        });
        fetchSettings();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Save Failed',
          text2: res.message || 'Failed to save system settings',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err.message || 'Server error saving settings',
      });
    } finally {
      setSaving(false);
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
            <Settings size={20} color="#3b82f6" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>System Settings</Text>
        </View>

        <TouchableOpacity
          onPress={handleSaveSettings}
          disabled={saving || loading}
          style={{
            backgroundColor: '#10b981',
            paddingHorizontal: 14,
            height: 38,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Save size={15} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>Save Settings</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchSettings(true)} />
        }
      >
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>
              Loading system settings...
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* 1. Company Information Card */}
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Building size={18} color="#3b82f6" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                  Company Information
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Company Name *
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
                  placeholder="e.g. UPropTech Solutions"
                  placeholderTextColor={subTextColor}
                  value={settings.CompanyName}
                  onChangeText={(val) => setSettings({ ...settings, CompanyName: val })}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    GST Number
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
                    placeholder="GSTIN"
                    placeholderTextColor={subTextColor}
                    value={settings.GSTNumber}
                    onChangeText={(val) => setSettings({ ...settings, GSTNumber: val })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Contact Phone
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
                    keyboardType="phone-pad"
                    placeholder="Phone Number"
                    placeholderTextColor={subTextColor}
                    value={settings.PhoneNumber}
                    onChangeText={(val) => setSettings({ ...settings, PhoneNumber: val })}
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Contact Email Address
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
                  placeholder="info@company.com"
                  placeholderTextColor={subTextColor}
                  value={settings.EmailAddress}
                  onChangeText={(val) => setSettings({ ...settings, EmailAddress: val })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Office Address
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
                  placeholder="Street / Office Address"
                  placeholderTextColor={subTextColor}
                  value={settings.Address}
                  onChangeText={(val) => setSettings({ ...settings, Address: val })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Google Map Embed URL
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
                  placeholder="https://maps.google.com/..."
                  placeholderTextColor={subTextColor}
                  value={settings.MapURL}
                  onChangeText={(val) => setSettings({ ...settings, MapURL: val })}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Copyright Footer Text
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
                  placeholder="© 2026 Company Name All Rights Reserved"
                  placeholderTextColor={subTextColor}
                  value={settings.CopyrightText}
                  onChangeText={(val) => setSettings({ ...settings, CopyrightText: val })}
                />
              </View>
            </View>

            {/* 2. Financial & Payment Settings Card */}
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <DollarSign size={18} color="#10b981" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                  Financial & Payment Defaults
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Currency Symbol
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
                    placeholder="e.g. ₹, $, €"
                    placeholderTextColor={subTextColor}
                    value={settings.CurrencySymbol}
                    onChangeText={(val) => setSettings({ ...settings, CurrencySymbol: val })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    GST Rate (%)
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
                    keyboardType="number-pad"
                    placeholder="e.g. 5"
                    placeholderTextColor={subTextColor}
                    value={settings.GSTRate}
                    onChangeText={(val) => setSettings({ ...settings, GSTRate: val })}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Default Booking %
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
                    keyboardType="number-pad"
                    placeholder="e.g. 20"
                    placeholderTextColor={subTextColor}
                    value={settings.DefaultBooking}
                    onChangeText={(val) => setSettings({ ...settings, DefaultBooking: val })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    EMI Structure
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
                    placeholder="e.g. 20-30-30-20"
                    placeholderTextColor={subTextColor}
                    value={settings.EMIStructure}
                    onChangeText={(val) => setSettings({ ...settings, EMIStructure: val })}
                  />
                </View>
              </View>
            </View>

            {/* 3. Document Prefix Configuration Card */}
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="#8b5cf6" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                  Document Prefix Settings
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Invoice Prefix
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
                    placeholder="e.g. INV"
                    placeholderTextColor={subTextColor}
                    value={settings.InvoicePrefix}
                    onChangeText={(val) => setSettings({ ...settings, InvoicePrefix: val })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Quotation Prefix
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
                    placeholder="e.g. QT"
                    placeholderTextColor={subTextColor}
                    value={settings.QuotationPrefix}
                    onChangeText={(val) => setSettings({ ...settings, QuotationPrefix: val })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                    Booking Prefix
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
                    placeholder="e.g. BK"
                    placeholderTextColor={subTextColor}
                    value={settings.BookingPrefix}
                    onChangeText={(val) => setSettings({ ...settings, BookingPrefix: val })}
                  />
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
