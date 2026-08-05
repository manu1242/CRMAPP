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
    Alert,
} from 'react-native';
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
                setSettings({
                    ...emptySettings,
                    ...response.data,
                });
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
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
            Alert.alert(
                'Permission',
                'Gallery permission is required.'
            );
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
            const response =
                await settingsApi.saveSettings(settings);

            if (response.success) {
                Alert.alert(
                    'Success',
                    response.message
                );
            } else {
                Alert.alert(
                    'Error',
                    response.message
                );
            }
        } catch (e: any) {
            Alert.alert(
                'Error',
                e.message
            );
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
                        {settings.companyLogo ? (
                            <Image
                                source={{
                                    uri: settings.companyLogo,
                                }}
                                style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 16,
                                    marginBottom: 16,
                                }}
                            />
                        ) : (
                            <View
                                style={{
                                    width: 120,
                                    height: 120,
                                    backgroundColor: inputBg,
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: borderCol,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                }}
                            >
                                <Ionicons
                                    name="image-outline"
                                    size={45}
                                    color={isDark ? '#475569' : '#94a3b8'}
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={pickLogo}
                            style={{
                                backgroundColor: '#0284c7',
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons
                                name="camera-outline"
                                color="white"
                                size={18}
                            />
                            <Text style={{ color: 'white', fontWeight: '700', marginLeft: 8 }}>
                                Upload Logo
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Referral Settings */}
                <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: borderCol }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <Ionicons
                            name="gift-outline"
                            size={20}
                            color="#16a34a"
                        />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginLeft: 10 }}>
                            Referral Program
                        </Text>
                    </View>

                    {/* Referrer Bonus */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: labelColor, marginBottom: 8 }}>
                            Referrer Bonus
                        </Text>
                        <TextInput
                            keyboardType="numeric"
                            style={{
                                borderWidth: 1,
                                borderColor: borderCol,
                                backgroundColor: inputBg,
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                height: 48,
                                color: textColor,
                            }}
                            value={settings.referralReferrerAmount}
                            onChangeText={(v) => updateField("referralReferrerAmount", v)}
                            placeholder="1000"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        />
                    </View>

                    {/* Joiner Bonus */}
                    <View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: labelColor, marginBottom: 8 }}>
                            Joiner Bonus
                        </Text>
                        <TextInput
                            keyboardType="numeric"
                            style={{
                                borderWidth: 1,
                                borderColor: borderCol,
                                backgroundColor: inputBg,
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                height: 48,
                                color: textColor,
                            }}
                            value={settings.referralJoinerAmount}
                            onChangeText={(v) => updateField("referralJoinerAmount", v)}
                            placeholder="500"
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        />
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
