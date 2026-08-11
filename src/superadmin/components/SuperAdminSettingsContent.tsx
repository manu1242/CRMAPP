import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

import AppFooter from '../../auth/components/AppFooter';
import { SaaSSettings } from '@/superadmin/tenants/models/Tenant';
import { settingsApi } from '@/superadmin/tenants/api/settings.api';
import { useTheme } from '../../contexts/ThemeContext';

const emptySettings: SaaSSettings = {
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    copyrightText: '',
    referralReferrerAmount: '',
    referralJoinerAmount: '',
    companyLogo: '',
    companyMapUrl: '',
};

export default function SuperAdminSettingsContent() {
    const [settings, setSettings] = useState<SaaSSettings>(emptySettings);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { isDark } = useTheme();

    // Theme colors
    const bgColor = isDark ? '#0f172a' : '#f3f4f6';
    const cardBg = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const labelColor = isDark ? '#cbd5e1' : '#475569';
    const borderCol = isDark ? '#334155' : '#e2e8f0';
    const inputBg = isDark ? '#0f172a' : '#ffffff';

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await settingsApi.getSettings();
            if (response.success) {
                // API returns a PascalCase dictionary (e.g. "CompanyName"),
                // but our SaaSSettings interface uses camelCase. Map manually.
                const d: Record<string, string> = response.data as any;
                setSettings({
                    companyName:           d['CompanyName']            ?? '',
                    companyEmail:          d['CompanyEmail']           ?? '',
                    companyPhone:          d['CompanyPhone']           ?? '',
                    companyAddress:        d['CompanyAddress']         ?? '',
                    copyrightText:         d['CopyrightText']          ?? '',
                    referralReferrerAmount:d['ReferralReferrerAmount'] ?? '',
                    referralJoinerAmount:  d['ReferralJoinerAmount']   ?? '',
                    companyLogo:           d['CompanyLogo']            ?? '',
                    companyMapUrl:         d['CompanyMapUrl']          ?? '',
                });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: response.message });
            }
        } catch (e: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        await loadSettings();
        setRefreshing(false);
    }, [loadSettings]);

    const updateField = useCallback((
        key: keyof SaaSSettings,
        value: string
    ) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    const pickLogo = useCallback(async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Toast.show({
                type: 'error',
                text1: 'Permission',
                text2: 'Gallery permission is required.'
            });
            return;
        }

        const result =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes:
                    ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                base64: true,
            });

        if (!result.canceled) {
            const asset = result.assets[0];
            updateField(
                'companyLogo',
                `data:image/jpeg;base64,${asset.base64}`
            );
        }
    }, [updateField]);

    const saveSettings = useCallback(async () => {
        try {
            setSaving(true);
            // Backend stores keys as PascalCase — send matching keys
            const payload: Record<string, string> = {
                CompanyName:            settings.companyName,
                CompanyEmail:           settings.companyEmail,
                CompanyPhone:           settings.companyPhone,
                CompanyAddress:         settings.companyAddress,
                CopyrightText:          settings.copyrightText,
                ReferralReferrerAmount: settings.referralReferrerAmount,
                ReferralJoinerAmount:   settings.referralJoinerAmount,
                CompanyLogo:            settings.companyLogo,
                CompanyMapUrl:          settings.companyMapUrl,
            };
            const response = await settingsApi.saveSettings(payload as any);

            if (response.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: response.message });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: response.message });
            }
        } catch (e: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.message });
        } finally {
            setSaving(false);
        }
    }, [settings]);

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator
                    size="large"
                    color="#0284c7"
                />
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: bgColor }}>
            <ScrollView
                style={{ flex: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                    />
                }
                contentContainerStyle={{
                    paddingBottom: 100,
                    paddingHorizontal: 16,
                }}
            >
                {/* Company Information Card */}
                <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: borderCol }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <FontAwesome name="building" size={18} color="#0284c7" />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginLeft: 10 }}>
                            Company Information
                        </Text>
                    </View>

                    {/* Company Name */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: labelColor, marginBottom: 8 }}>
                            Company Name
                        </Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: borderCol,
                                backgroundColor: inputBg,
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                height: 48,
                                color: textColor,
                            }}
                            value={settings.companyName}
                            onChangeText={(v) => updateField("companyName", v)}
                            placeholder="Company Name"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        />
                    </View>

                    {/* Company Email */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: labelColor, marginBottom: 8 }}>
                            Company Email
                        </Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: borderCol,
                                backgroundColor: inputBg,
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                height: 48,
                                color: textColor,
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={settings.companyEmail}
                            onChangeText={(v) => updateField("companyEmail", v)}
                            placeholder="company@email.com"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        />
                    </View>

                    {/* Company Phone */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: labelColor, marginBottom: 8 }}>
                            Company Phone
                        </Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: borderCol,
                                backgroundColor: inputBg,
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                height: 48,
                                color: textColor,
                            }}
                            keyboardType="phone-pad"
                            value={settings.companyPhone}
                            onChangeText={(v) => updateField("companyPhone", v)}
                            placeholder="Phone Number"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        />
                    </View>

                    {/* Company Address */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: labelColor, marginBottom: 8 }}>
                            Company Address
                        </Text>
                        <TextInput
                            multiline
                            numberOfLines={4}
                            style={{
                                borderWidth: 1,
                                borderColor: borderCol,
                                backgroundColor: inputBg,
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                minHeight: 80,
                                color: textColor,
                                textAlignVertical: 'top',
                            }}
                            value={settings.companyAddress}
                            onChangeText={(v) => updateField("companyAddress", v)}
                            placeholder="Company Address"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        />
                    </View>

                    {/* Google Map URL */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: labelColor, marginBottom: 8 }}>
                            Google Map URL
                        </Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: borderCol,
                                backgroundColor: inputBg,
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                height: 48,
                                color: textColor,
                            }}
                            value={settings.companyMapUrl}
                            onChangeText={(v) => updateField("companyMapUrl", v)}
                            placeholder="https://maps.google.com/..."
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        />
                    </View>

                    {/* Copyright */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: labelColor, marginBottom: 8 }}>
                            Copyright Text
                        </Text>
                        <TextInput
                            multiline
                            numberOfLines={3}
                            style={{
                                borderWidth: 1,
                                borderColor: borderCol,
                                backgroundColor: inputBg,
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                minHeight: 60,
                                color: textColor,
                                textAlignVertical: 'top',
                            }}
                            value={settings.copyrightText}
                            onChangeText={(v) => updateField("copyrightText", v)}
                            placeholder="Copyright..."
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        />
                    </View>

                    {/* Company Logo */}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: labelColor, marginBottom: 12 }}>
                        Company Logo
                    </Text>

                    <View style={{ alignItems: 'center' }}>
                        {/* Logo preview box */}
                        <View style={{
                            width: 140,
                            height: 140,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: borderCol,
                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 14,
                            overflow: 'hidden',
                        }}>
                            {settings.companyLogo ? (
                                <Image
                                    source={{ uri: settings.companyLogo }}
                                    style={{ width: 120, height: 120 }}
                                    resizeMode="contain"
                                />
                            ) : (
                                <>
                                    <Ionicons
                                        name="image-outline"
                                        size={40}
                                        color={isDark ? '#475569' : '#94a3b8'}
                                    />
                                    <Text style={{ fontSize: 11, color: isDark ? '#475569' : '#94a3b8', marginTop: 6 }}>
                                        No logo set
                                    </Text>
                                </>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={pickLogo}
                            style={{
                                borderWidth: 1,
                                borderColor: borderCol,
                                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                borderRadius: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <Ionicons name="camera-outline" color={textColor} size={16} />
                            <Text style={{ color: textColor, fontWeight: '600', fontSize: 13 }}>
                                {settings.companyLogo ? 'Change Logo' : 'Upload Logo'}
                            </Text>
                        </TouchableOpacity>

                        <Text style={{ fontSize: 11, color: labelColor, marginTop: 8 }}>
                            PNG, JPG or GIF · Max 2MB
                        </Text>
                    </View>
                </View>

                {/* Referral Settings */}
                <View style={{
                    backgroundColor: cardBg,
                    borderRadius: 16,
                    marginTop: 16,
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
                            <Ionicons name="gift-outline" size={18} color="#0284c7" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                                Referral Program
                            </Text>
                            <Text style={{ fontSize: 12, color: labelColor, marginTop: 1 }}>
                                Configure bonus amounts for referrer and joiner
                            </Text>
                        </View>
                    </View>

                    <View style={{ padding: 16, gap: 20 }}>
                        {/* Referrer Bonus */}
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Ionicons name="person-outline" size={15} color={labelColor} />
                                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                                    Referrer Bonus (₹)
                                </Text>
                            </View>
                            <TextInput
                                keyboardType="numeric"
                                style={{
                                    borderWidth: 1,
                                    borderColor: borderCol,
                                    backgroundColor: inputBg,
                                    borderRadius: 10,
                                    paddingHorizontal: 14,
                                    height: 46,
                                    color: textColor,
                                    fontSize: 16,
                                    fontWeight: '600',
                                }}
                                value={settings.referralReferrerAmount}
                                onChangeText={(v) => updateField("referralReferrerAmount", v)}
                                placeholder="500"
                                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                            />
                            <Text style={{ fontSize: 11, color: labelColor, marginTop: 5 }}>
                                Amount credited to the existing tenant who refers
                            </Text>
                        </View>

                        {/* Divider */}
                        <View style={{ height: 1, backgroundColor: borderCol }} />

                        {/* Joiner Bonus */}
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Ionicons name="person-add-outline" size={15} color={labelColor} />
                                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                                    Joiner Bonus (₹)
                                </Text>
                            </View>
                            <TextInput
                                keyboardType="numeric"
                                style={{
                                    borderWidth: 1,
                                    borderColor: borderCol,
                                    backgroundColor: inputBg,
                                    borderRadius: 10,
                                    paddingHorizontal: 14,
                                    height: 46,
                                    color: textColor,
                                    fontSize: 16,
                                    fontWeight: '600',
                                }}
                                value={settings.referralJoinerAmount}
                                onChangeText={(v) => updateField("referralJoinerAmount", v)}
                                placeholder="200"
                                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                            />
                            <Text style={{ fontSize: 11, color: labelColor, marginTop: 5 }}>
                                Amount credited to the new tenant who joins via referral
                            </Text>
                        </View>

                        {/* How it works note */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: 8,
                            paddingTop: 4,
                        }}>
                            <Ionicons name="information-circle-outline" size={15} color={labelColor} style={{ marginTop: 1 }} />
                            <Text style={{ flex: 1, fontSize: 12, color: labelColor, lineHeight: 17 }}>
                                When a new tenant signs up using a referral code, both the referrer and joiner receive their respective bonus amounts.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    onPress={saveSettings}
                    disabled={saving}
                    style={{
                        backgroundColor: '#0284c7',
                        marginTop: 24,
                        borderRadius: 16,
                        height: 54,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        shadowColor: '#0284c7',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 4,
                    }}
                >
                    {saving ? (
                        <>
                            <ActivityIndicator color="#ffffff" />
                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16, marginLeft: 10 }}>
                                Saving...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Ionicons
                                name="save-outline"
                                size={20}
                                color="#ffffff"
                            />
                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16, marginLeft: 8 }}>
                                Save Settings
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Footer */}
                <AppFooter />
            </ScrollView>
        </View>
    );
}
