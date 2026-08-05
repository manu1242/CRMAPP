import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForgotPassword } from '../../hooks/useForgotPassword';
import KeyboardSafeArea from '../../components/KeyboardSafeArea';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<'token' | 'password' | null>(null);
    const { resetPassword, isLoading, error, isSuccess } = useForgotPassword();
    const { isDark } = useTheme();
    const t = getAdminTheme(isDark);

    // Entrance animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const iconScale = useRef(new Animated.Value(0.6)).current;
    const successScale = useRef(new Animated.Value(0.5)).current;
    const successOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
            Animated.spring(iconScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        if (isSuccess) {
            Animated.parallel([
                Animated.spring(successScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
                Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]).start();
        }
    }, [isSuccess]);

    const handleReset = async () => {
        if (!token || !password) return;
        await resetPassword(token, password);
    };

    const brand = '#10b981';
    const bgColor = t.primaryBg;
    const cardBg = t.cardBg;
    const textColor = t.textPrimary;
    const subText = t.textSecondary;
    const border = t.border;

    // Password strength
    const getStrength = () => {
        if (password.length === 0) return { level: 0, label: '', color: 'transparent' };
        if (password.length < 6) return { level: 1, label: 'Weak', color: '#ef4444' };
        if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
            return { level: 2, label: 'Fair', color: '#f59e0b' };
        return { level: 3, label: 'Strong', color: '#10b981' };
    };
    const strength = getStrength();

    return (
        <KeyboardSafeArea
            backgroundColor={bgColor}
            contentContainerStyle={{ flexGrow: 1 }}
        >
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />

            {/* Decorative orbs */}
            <View style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#10b98118' }} pointerEvents="none" />
            <View style={{ position: 'absolute', bottom: 100, left: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: '#3b82f610' }} pointerEvents="none" />

            <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: 24, paddingTop: 24 }}>

                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        alignSelf: 'flex-start', marginBottom: 32,
                        backgroundColor: cardBg,
                        borderWidth: 1, borderColor: border,
                        borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={16} color={subText} />
                    <Text style={{ color: subText, fontSize: 13, fontWeight: '600' }}>Back</Text>
                </TouchableOpacity>

                {isSuccess ? (
                    /* ── Success State ── */
                    <Animated.View style={{
                        flex: 1, alignItems: 'center', justifyContent: 'center',
                        opacity: successOpacity,
                        transform: [{ scale: successScale }],
                    }}>
                        <View style={{
                            width: 96, height: 96, borderRadius: 48,
                            backgroundColor: '#10b98115',
                            alignItems: 'center', justifyContent: 'center',
                            marginBottom: 24,
                            borderWidth: 1.5, borderColor: '#10b98135',
                        }}>
                            <Ionicons name="checkmark-circle-outline" size={48} color={brand} />
                        </View>

                        <Text style={{ fontSize: 26, fontWeight: '800', color: textColor, textAlign: 'center', marginBottom: 12 }}>
                            Password Reset!
                        </Text>
                        <Text style={{ fontSize: 15, color: subText, textAlign: 'center', lineHeight: 22, marginBottom: 36, maxWidth: 300 }}>
                            Your password has been changed successfully. You can now log in with your new password.
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.replace('/main-login')}
                            style={{
                                backgroundColor: brand,
                                height: 52, borderRadius: 26,
                                width: '100%',
                                justifyContent: 'center', alignItems: 'center',
                                shadowColor: brand,
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.35, shadowRadius: 14,
                                elevation: 8,
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Go to Login</Text>
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    /* ── Form State ── */
                    <>
                        {/* Icon Badge */}
                        <Animated.View style={{ transform: [{ scale: iconScale }], alignSelf: 'flex-start', marginBottom: 28 }}>
                            <View style={{
                                width: 72, height: 72, borderRadius: 24,
                                backgroundColor: '#10b98112',
                                borderWidth: 1.5, borderColor: '#10b98130',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Ionicons name="key-outline" size={32} color={brand} />
                            </View>
                        </Animated.View>

                        {/* Heading */}
                        <Text style={{ fontSize: 30, fontWeight: '800', color: textColor, marginBottom: 8 }}>
                            Reset Your{'\n'}Password
                        </Text>
                        <Text style={{ fontSize: 15, color: subText, lineHeight: 22, marginBottom: 36, maxWidth: 280 }}>
                            Enter the code from your email and choose a new secure password.
                        </Text>

                        {/* Step pills */}
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
                            {['Enter Code', 'New Password'].map((step, i) => (
                                <View key={i} style={{
                                    flex: 1, height: 4, borderRadius: 2,
                                    backgroundColor: i === 0
                                        ? (token.length > 0 ? brand : border)
                                        : (password.length > 0 ? brand : border),
                                }} />
                            ))}
                        </View>

                        {/* Reset Code Field */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: subText, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
                            Reset Code
                        </Text>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            height: 54,
                            borderWidth: focusedField === 'token' ? 1.5 : 1,
                            borderColor: focusedField === 'token' ? brand : border,
                            borderRadius: 16,
                            backgroundColor: cardBg,
                            paddingHorizontal: 16,
                            gap: 10,
                            marginBottom: 20,
                        }}>
                            <Ionicons name="shield-checkmark-outline" size={18} color={focusedField === 'token' ? brand : subText} />
                            <TextInput
                                style={{ flex: 1, fontSize: 15, color: textColor, height: '100%', letterSpacing: 2 }}
                                value={token}
                                onChangeText={setToken}
                                placeholder="Enter code from email"
                                placeholderTextColor={t.textMuted}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                onFocus={() => setFocusedField('token')}
                                onBlur={() => setFocusedField(null)}
                            />
                            {token.length > 0 && (
                                <Ionicons name="checkmark-circle" size={18} color={brand} />
                            )}
                        </View>

                        {/* New Password Field */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: subText, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
                            New Password
                        </Text>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            height: 54,
                            borderWidth: focusedField === 'password' ? 1.5 : 1,
                            borderColor: focusedField === 'password' ? brand : border,
                            borderRadius: 16,
                            backgroundColor: cardBg,
                            paddingHorizontal: 16,
                            gap: 10,
                            marginBottom: 8,
                        }}>
                            <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? brand : subText} />
                            <TextInput
                                key={String(showPassword)}
                                style={{ flex: 1, fontSize: 15, color: textColor, height: '100%' }}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Min. 8 characters"
                                placeholderTextColor={t.textMuted}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="done"
                                onSubmitEditing={handleReset}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={subText} />
                            </TouchableOpacity>
                        </View>

                        {/* Password strength bar */}
                        {password.length > 0 && (
                            <View style={{ marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                                    {[1, 2, 3].map(i => (
                                        <View key={i} style={{
                                            flex: 1, height: 3, borderRadius: 2,
                                            backgroundColor: strength.level >= i ? strength.color : border,
                                        }} />
                                    ))}
                                </View>
                                <Text style={{ fontSize: 11, color: strength.color, fontWeight: '600' }}>
                                    {strength.label} password
                                </Text>
                            </View>
                        )}

                        {/* Error */}
                        {error ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                                <Ionicons name="alert-circle-outline" size={14} color="#ef4444" />
                                <Text style={{ color: '#ef4444', fontSize: 13, flex: 1 }}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Reset Button */}
                        <TouchableOpacity
                            onPress={handleReset}
                            disabled={isLoading || !token || !password}
                            style={{
                                height: 54, borderRadius: 27,
                                backgroundColor: (!token || !password)
                                    ? (isDark ? '#27272a' : '#e2e8f0')
                                    : brand,
                                justifyContent: 'center', alignItems: 'center',
                                flexDirection: 'row', gap: 8,
                                shadowColor: (token && password) ? brand : 'transparent',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.35, shadowRadius: 14,
                                elevation: (token && password) ? 8 : 0,
                                marginBottom: 20,
                            }}
                            activeOpacity={0.85}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="shield-checkmark-outline" size={18} color={(!token || !password) ? subText : '#fff'} />
                                    <Text style={{ color: (!token || !password) ? subText : '#fff', fontSize: 16, fontWeight: '700' }}>
                                        Reset Password
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ alignItems: 'center', paddingVertical: 8 }}
                            activeOpacity={0.7}
                        >
                            <Text style={{ color: subText, fontSize: 14 }}>
                                Didn't get a code?{' '}
                                <Text style={{ color: brand, fontWeight: '700' }}>Go Back</Text>
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </Animated.View>
        </KeyboardSafeArea>
    );
}
