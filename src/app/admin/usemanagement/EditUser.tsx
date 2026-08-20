import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Switch,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import {
    ArrowLeft,
    Check,
    Shield,
    Mail,
    Phone,
    UserCheck,
} from 'lucide-react-native';
import { userManagementService } from '../../../admin/services/userManagementService';

interface LocalParams {
    userId: string;
    username: string;
    email: string;
    phone: string;
    role: string;
    isActive: string;
}

export default function EditUser() {
    const router = useRouter();
    const params = useLocalSearchParams<Partial<LocalParams>>();
    const { isDark } = useTheme();
    const adminTheme = getAdminTheme(isDark);

    const bgColor = adminTheme.primaryBg;
    const cardBg = adminTheme.cardBg;
    const textColor = adminTheme.textPrimary;
    const subTextColor = adminTheme.textSecondary;
    const borderCol = adminTheme.border;

    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        username: params.username || '',
        email: params.email || '',
        phone: params.phone || '',
        role: params.role || 'Agent',
        isActive: params.isActive === 'true',
        password: '',
    });

    const availableRoles = ['Admin', 'Agent', 'Partner'];

    const handleUpdateUser = async () => {
        if (!params.userId) return;
        if (!form.username.trim() || !form.email.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Username and email are required.',
            });
            return;
        }

        setSaving(true);
        try {
            const payload: any = {
                username: form.username.trim(),
                email: form.email.trim(),
                role: form.role,
                isActive: form.isActive,
                phone: form.phone.trim() || undefined,
            };
            if (form.password.trim()) {
                payload.password = form.password.trim();
            }

            const res = await userManagementService.updateUser(Number(params.userId), payload);
            if (res && res.success) {
                Toast.show({
                    type: 'success',
                    text1: 'User Updated',
                    text2: res.message || 'User updated successfully!',
                });
                router.back();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Update Failed',
                    text2: res.message || 'Failed to update user',
                });
            }
        } catch (err: any) {
            console.error('Error updating user:', err);
            Toast.show({
                type: 'error',
                text1: 'Server Error',
                text2: err.message || 'Server error updating user',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: bgColor }}>
            {/* Top Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingTop: 16,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: borderCol,
                    backgroundColor: cardBg,
                    gap: 12,
                }}
            >
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                    <ArrowLeft size={22} color={textColor} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                    Edit User: {params.username}
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={{
                        backgroundColor: cardBg,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: borderCol,
                        padding: 20,
                        gap: 16,
                    }}
                >
                    {/* Username Input */}
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>USERNAME *</Text>
                        <TextInput
                            style={{
                                height: 44,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: borderCol,
                                paddingHorizontal: 12,
                                color: textColor,
                                backgroundColor: bgColor,
                                fontSize: 13,
                            }}
                            placeholder="Enter username"
                            placeholderTextColor={subTextColor}
                            value={form.username}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, username: val }))}
                        />
                    </View>

                    {/* Email Input */}
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>EMAIL ADDRESS *</Text>
                        <TextInput
                            style={{
                                height: 44,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: borderCol,
                                paddingHorizontal: 12,
                                color: textColor,
                                backgroundColor: bgColor,
                                fontSize: 13,
                            }}
                            placeholder="email@example.com"
                            placeholderTextColor={subTextColor}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={form.email}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, email: val }))}
                        />
                    </View>

                    {/* Phone Input */}
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>PHONE NUMBER</Text>
                        <TextInput
                            style={{
                                height: 44,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: borderCol,
                                paddingHorizontal: 12,
                                color: textColor,
                                backgroundColor: bgColor,
                                fontSize: 13,
                            }}
                            placeholder="Enter phone number"
                            placeholderTextColor={subTextColor}
                            keyboardType="phone-pad"
                            value={form.phone}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, phone: val }))}
                        />
                    </View>

                    {/* Optional Password Change Input */}
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>PASSWORD (OPTIONAL)</Text>
                        <TextInput
                            style={{
                                height: 44,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: borderCol,
                                paddingHorizontal: 12,
                                color: textColor,
                                backgroundColor: bgColor,
                                fontSize: 13,
                            }}
                            placeholder="Leave blank to keep current password"
                            placeholderTextColor={subTextColor}
                            secureTextEntry
                            autoCapitalize="none"
                            value={form.password}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, password: val }))}
                        />
                    </View>

                    {/* Role Select Buttons */}
                    <View style={{ gap: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>USER ROLE *</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {availableRoles.map((r) => {
                                const isSelected = form.role === r;
                                return (
                                    <TouchableOpacity
                                        key={r}
                                        onPress={() => setForm((prev) => ({ ...prev, role: r }))}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 10,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: isSelected ? '#3b82f6' : borderCol,
                                            backgroundColor: isSelected ? '#3b82f615' : bgColor,
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#3b82f6' : textColor }}>
                                            {r}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Active Switch */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                        <View>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>Account Active Status</Text>
                            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                                Set inactive to restrict account access
                            </Text>
                        </View>
                        <Switch
                            value={form.isActive}
                            onValueChange={(val) => setForm((prev) => ({ ...prev, isActive: val }))}
                            trackColor={{ false: '#ef444430', true: '#10b98130' }}
                            thumbColor={form.isActive ? '#10b981' : '#ef4444'}
                        />
                    </View>

                    {/* Action Save Button */}
                    <TouchableOpacity
                        disabled={saving}
                        onPress={handleUpdateUser}
                        style={{
                            backgroundColor: adminTheme.brand,
                            padding: 12,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: 8,
                            marginTop: 6,
                            opacity: saving ? 0.6 : 1,
                        }}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Check size={16} color="#ffffff" />
                                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
