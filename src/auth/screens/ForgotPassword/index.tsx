import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    StatusBar,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForgotPassword } from '../../hooks/useForgotPassword';
import KeyboardSafeArea from '../../components/KeyboardSafeArea';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const { requestReset, isLoading, error, isSuccess } = useForgotPassword();
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

    const handleRequest = async () => {
        if (!email) return;
        await requestReset(email);
    };

    const bgColor = t.primaryBg;
    const cardBg = t.cardBg;
    const textColor = t.textPrimary;
    const subText = t.textSecondary;
    const border = t.border;
    const brand = '#10b981';
    const brandDark = '#059669';

    return (
        <KeyboardSafeArea
            backgroundColor={bgColor}
            contentContainerStyle={{ flexGrow: 1 }}
        >
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />

            {/* Decorative gradient orbs */}
            <View style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#10b98118', }} pointerEvents="none" />
            <View style={{ position: 'absolute', top: 80, left: -80, width: 160, height: 160, borderRadius: 80, backgroundColor: '#3b82f610', }} pointerEvents="none" />

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
                            <Ionicons name="mail-outline" size={42} color={brand} />
                        </View>

                        <Text style={{ fontSize: 26, fontWeight: '800', color: textColor, textAlign: 'center', marginBottom: 12 }}>
                            Check Your Inbox
                        </Text>
                        <Text style={{ fontSize: 15, color: subText, textAlign: 'center', lineHeight: 22, marginBottom: 8, maxWidth: 300 }}>
                            We've sent a password reset link to
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: brand, textAlign: 'center', marginBottom: 36 }}>
                            {email}
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
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Back to Login</Text>
                        </TouchableOpacity>

                        <Text style={{ color: subText, fontSize: 13, textAlign: 'center', marginTop: 20 }}>
                            Didn't receive it?{' '}
                            <Text
                                style={{ color: brand, fontWeight: '700' }}
                                onPress={handleRequest}
                            >
                                Resend
                            </Text>
                        </Text>
                    </Animated.View>
                ) : (
                    /* ── Input State ── */
                    <>
                        {/* Icon Badge */}
                        <Animated.View style={{
                            transform: [{ scale: iconScale }],
                            alignSelf: 'flex-start', marginBottom: 28,
                        }}>
                            <View style={{
                                width: 72, height: 72, borderRadius: 24,
                                backgroundColor: '#10b98112',
                                borderWidth: 1.5, borderColor: '#10b98130',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Ionicons name="lock-closed-outline" size={32} color={brand} />
                            </View>
                        </Animated.View>

                        {/* Heading */}
                        <Text style={{ fontSize: 30, fontWeight: '800', color: textColor, marginBottom: 8 }}>
                            Forgot{'\n'}Password?
                        </Text>
                        <Text style={{ fontSize: 15, color: subText, lineHeight: 22, marginBottom: 36, maxWidth: 280 }}>
                            No worries. Enter your registered email and we'll send you a secure reset link.
                        </Text>

                        {/* Email Field */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: subText, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
                            Email Address
                        </Text>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            height: 54,
                            borderWidth: isFocused ? 1.5 : 1,
                            borderColor: isFocused ? brand : border,
                            borderRadius: 16,
                            backgroundColor: cardBg,
                            paddingHorizontal: 16,
                            gap: 10,
                            marginBottom: error ? 8 : 28,
                        }}>
                            <Ionicons name="mail-outline" size={18} color={isFocused ? brand : subText} />
                            <TextInput
                                style={{ flex: 1, fontSize: 15, color: textColor, height: '100%' }}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="your@email.com"
                                placeholderTextColor={t.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="send"
                                onSubmitEditing={handleRequest}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                            />
                        </View>

                        {/* Error */}
                        {error ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                                <Ionicons name="alert-circle-outline" size={14} color="#ef4444" />
                                <Text style={{ color: '#ef4444', fontSize: 13 }}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Send Button */}
                        <TouchableOpacity
                            onPress={handleRequest}
                            disabled={isLoading || !email}
                            style={{
                                height: 54, borderRadius: 27,
                                backgroundColor: (!email) ? (isDark ? '#27272a' : '#e2e8f0') : brand,
                                justifyContent: 'center', alignItems: 'center',
                                flexDirection: 'row', gap: 8,
                                shadowColor: email ? brand : 'transparent',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.35, shadowRadius: 14,
                                elevation: email ? 8 : 0,
                                marginBottom: 20,
                            }}
                            activeOpacity={0.85}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="paper-plane-outline" size={18} color={!email ? subText : '#fff'} />
                                    <Text style={{ color: !email ? subText : '#fff', fontSize: 16, fontWeight: '700' }}>
                                        Send Reset Link
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Back to login */}
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ alignItems: 'center', paddingVertical: 8 }}
                            activeOpacity={0.7}
                        >
                            <Text style={{ color: subText, fontSize: 14 }}>
                                Remember your password?{' '}
                                <Text style={{ color: brand, fontWeight: '700' }}>Log In</Text>
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </Animated.View>
        </KeyboardSafeArea>
    );
}
