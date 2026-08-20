import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Image,
    TextInput,
    ActivityIndicator,
    Linking,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import KeyboardSafeArea from '../KeyboardSafeArea';
import { useLogin } from '../../hooks/useLogin';
import Toast from 'react-native-toast-message';
import AppFooter from '../AppFooter';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSafeObserve } from '../../../api/observe';
import { getAdminTheme } from '../../../theme/adminTheme';
import { BlurView } from 'expo-blur';

const MainLogin = () => {
    const router = useRouter();
    const { isDark } = useTheme();
    const { markInteractive } = useSafeObserve();
    const adminTheme = getAdminTheme(isDark);

    React.useEffect(() => {
        markInteractive();
    }, [markInteractive]);

    // Color palette matching exact design
    const bgColor = adminTheme.primaryBg;
    const cardBg = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const subtitleColor = isDark ? '#94a3b8' : '#64748b';
    const labelColor = isDark ? '#cbd5e1' : '#475569';
    const placeholderColor = isDark ? '#64748b' : '#94a3b8';
    const borderCol = isDark ? '#334155' : '#e2e8f0';
    const iconColor = isDark ? '#94a3b8' : '#64748b';

    // State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const { login, isLoading: isLoginLoading } = useLogin();

    const handleLogin = async () => {
        if (!loginEmail || !loginPassword) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please enter both email and password.',
            });
            return;
        }
        await login({ username: loginEmail, password: loginPassword });
    };

    const handleInquiryForm = () => {
        router.push('/InquiryForm');
    };

    return (
        <KeyboardSafeArea
            backgroundColor={bgColor}
            contentContainerStyle={{
                backgroundColor: bgColor,
                paddingHorizontal: 24,
                justifyContent: 'center',
                flexGrow: 1,
                paddingVertical: 20,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bgColor} />

            {/* Static Background Amoeba / Bubble Design Elements */}
            {/* Top-Right Soft Teal Amoeba Blob */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: -60,
                    right: -70,
                    width: 220,
                    height: 220,
                    borderRadius: 110,
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                    transform: [{ scaleX: 1.4 }],
                }}
            />
            {/* Top-Left Small Accent Bubble */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: 40,
                    left: -30,
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.06)' : 'rgba(56, 189, 248, 0.10)',
                }}
            />
            {/* Mid-Right Subtle Circular Ring */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: '42%',
                    right: -40,
                    width: 150,
                    height: 150,
                    borderRadius: 75,
                    borderWidth: 2,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(16, 185, 129, 0.10)',
                }}
            />
            {/* Bottom-Left Soft Emerald Blob */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    bottom: -50,
                    left: -60,
                    width: 260,
                    height: 260,
                    borderRadius: 130,
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.09)',
                    transform: [{ scaleY: 1.3 }],
                }}
            />
            {/* Bottom-Right Small Floating Bubble */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    bottom: 70,
                    right: -10,
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.12)',
                }}
            />

            {/* Hero Image */}
            <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
                <Image
                    source={require('../../../../assets/login.png')}
                    style={{ width: '100%', height: 180, resizeMode: 'contain' }}
                />
            </View>

            <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
                {/* Header Title & Subtitle */}
                <Text style={{
                    fontSize: 22,
                    fontWeight: '600',
                    color: textColor,
                    textAlign: 'center',
                    marginBottom: 6,
                }}>
                    Welcome back
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: subtitleColor,
                    textAlign: 'center',
                    marginBottom: 24,
                }}>
                    Access your real estate portfolio.
                </Text>

                {/* Email Address Field */}
                <View style={{ marginBottom: 18 }}>
                    <Text style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: labelColor,
                        marginBottom: 8,
                    }}>
                        Email Address
                    </Text>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        height: 46,
                        backgroundColor: cardBg,
                        borderWidth: 1,
                        borderColor: borderCol,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                    }}>
                        <Ionicons name="mail-outline" size={18} color={iconColor} style={{ marginRight: 10 }} />
                        <TextInput
                            style={{
                                flex: 1,
                                fontSize: 14,
                                color: textColor,
                            }}
                            value={loginEmail}
                            onChangeText={setLoginEmail}
                            placeholder="uproptech@gmail.com"
                            placeholderTextColor={placeholderColor}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                </View>

                {/* Password Field */}
                <View style={{ marginBottom: 18 }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                    }}>
                        <Text style={{
                            fontSize: 13,
                            fontWeight: '500',
                            color: labelColor,
                        }}>
                            Password
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                            <Text style={{
                                fontSize: 13,
                                color: textColor,
                                fontWeight: '500',
                            }}>
                                Forgot password?
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        height: 46,
                        backgroundColor: cardBg,
                        borderWidth: 1,
                        borderColor: borderCol,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                    }}>
                        <Ionicons name="lock-closed-outline" size={18} color={iconColor} style={{ marginRight: 10 }} />
                        <TextInput
                            style={{
                                flex: 1,
                                fontSize: 14,
                                color: textColor,
                            }}
                            value={loginPassword}
                            onChangeText={setLoginPassword}
                            placeholder="••••••••"
                            placeholderTextColor={placeholderColor}
                            secureTextEntry={!showLoginPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity onPress={() => setShowLoginPassword(!showLoginPassword)} style={{ padding: 4 }}>
                            <Ionicons
                                name={showLoginPassword ? "eye-off-outline" : "eye-outline"}
                                size={18}
                                color={iconColor}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Remember Me Checkbox */}
                <TouchableOpacity
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.8}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 20,
                    }}
                >
                    <View style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: rememberMe ? '#000000' : borderCol,
                        backgroundColor: rememberMe ? '#000000' : cardBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                    }}>
                        {rememberMe && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                    </View>
                    <Text style={{
                        fontSize: 13,
                        color: subtitleColor,
                    }}>
                        Remember me for 30 days
                    </Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={isLoginLoading}
                    // activeOpacity={0.85}
                    style={{
                        backgroundColor: '#10b981',
                        // borderColor: isDark ? 'rgba(16, 185, 129, 0.85)' : 'rgba(16, 185, 129, 1)',
                        // borderWidth: 1.5,
                        // shadowOpacity: isDark ? 0.35 : 0.15,
                        height: 46,
                        borderRadius: 8,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 24,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                   
                    {isLoginLoading ? (
                        <>
                            <ActivityIndicator color="#ffffff" size="small" />
                            <Text style={{
                                color: '#ffffff',
                                fontSize: 14,
                                fontWeight: '600',
                            }}>
                                Signing In...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={{
                                color: '#ffffff',
                                fontSize: 14,
                                fontWeight: '600',
                            }}>
                                Sign In
                            </Text>
                            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                        </>
                    )}
                </TouchableOpacity>

                {/* Request Access */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 20,
                }}>
                    <Text style={{ fontSize: 13, color: subtitleColor }}>
                        Don't have an account?
                    </Text>
                    <TouchableOpacity onPress={handleInquiryForm}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                            Request access
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Restored App Footer */}
            <AppFooter />
        </KeyboardSafeArea>
    );
};

export default MainLogin;