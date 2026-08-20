import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import {
    ArrowLeft,
    Check,
    Plus,
} from 'lucide-react-native';
import { userManagementService } from '../../../admin/services/userManagementService';

export default function CreateUser() {
    const router = useRouter();
    const { isDark } = useTheme();
    const adminTheme = getAdminTheme(isDark);

    const bgColor = adminTheme.primaryBg;
    const cardBg = adminTheme.cardBg;
    const textColor = adminTheme.textPrimary;
    const subTextColor = adminTheme.textSecondary;
    const borderCol = adminTheme.border;

    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        role: 'Agent',
        phone: '',
        isActive: true,
    });

    const availableRoles = ['Admin', 'Agent', 'Partner'];

    const handleCreateUser = async () => {
        if (!form.username.trim() || !form.email.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Full Name/Username and Email are required.',
            });
            return;
        }

        setSaving(true);
        try {
            const res = await userManagementService.createUser({
                username: form.username.trim(),
                email: form.email.trim(),
                password: form.password.trim() || undefined,
                role: form.role,
                phone: form.phone.trim() || undefined,
                isActive: form.isActive,
            });

            if (res && res.success) {
                Toast.show({
                    type: 'success',
                    text1: 'User Created',
                    text2: res.message || 'User created successfully!',
                });
                router.back();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Creation Failed',
                    text2: res.message || 'Failed to create user',
                });
            }
        } catch (err: any) {
            console.error('Error creating user:', err);
            Toast.show({
                type: 'error',
                text1: 'Server Error',
                text2: err.message || 'Server error creating user',
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
                    Create New User
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
                    {/* Username */}
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>
                            FULL NAME / USERNAME *
                        </Text>
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
                            placeholder="e.g. Ravi Teja"
                            placeholderTextColor={subTextColor}
                            value={form.username}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, username: val }))}
                        />
                    </View>

                    {/* Email */}
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>
                            EMAIL ADDRESS *
                        </Text>
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
                            keyboardType="email-address"
                            placeholder="e.g. ravi@example.com"
                            placeholderTextColor={subTextColor}
                            value={form.email}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, email: val }))}
                        />
                    </View>

                    {/* Password */}
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>
                            PASSWORD
                        </Text>
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
                            secureTextEntry
                            placeholder="Leave blank for default"
                            placeholderTextColor={subTextColor}
                            value={form.password}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, password: val }))}
                        />
                    </View>

                    {/* Phone */}
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>
                            PHONE NUMBER
                        </Text>
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
                            keyboardType="phone-pad"
                            placeholder="e.g. 9876543210"
                            placeholderTextColor={subTextColor}
                            value={form.phone}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, phone: val }))}
                        />
                    </View>

                    {/* Role Selection */}
                    <View style={{ gap: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>USER ROLE</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {availableRoles.map((r) => {
                                const selected = form.role === r;
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
                                            borderColor: selected ? '#3b82f6' : borderCol,
                                            backgroundColor: selected ? '#3b82f615' : bgColor,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                fontWeight: '700',
                                                color: selected ? '#3b82f6' : textColor,
                                            }}
                                        >
                                            {r}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Is Active Switch */}
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 4,
                        }}
                    >
                        <View>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
                                Account Active Status
                            </Text>
                            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                                Enable account access immediately upon creation
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
                        onPress={handleCreateUser}
                        style={{
                            backgroundColor: '#10b981',
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
                                <Plus size={16} color="#ffffff" />
                                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Create User</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
