import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Image,
    Pressable,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import KeyboardSafeArea from '../KeyboardSafeArea';
import { useLogin } from '../../hooks/useLogin';
import { AuthService } from '../../services/AuthService';
import { useAuthStore } from '../../store/authStore';
import Toast from 'react-native-toast-message';
import AppFooter from '../AppFooter';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';

const { height } = Dimensions.get('window');

interface FloatingInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    showEyeIcon?: boolean;
    onEyePress?: () => void;
}

const FloatingInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    showEyeIcon,
    onEyePress
}: FloatingInputProps) => {
    const { isDark } = useTheme();
    const adminTheme = getAdminTheme(isDark);

    return (
        <View style={{ position: 'relative', marginBottom: 20, width: '100%' }}>
            <View style={{
                position: 'absolute',
                left: 18,
                top: -8,
                backgroundColor: adminTheme.primaryBg,
                paddingHorizontal: 6,
                zIndex: 2,
            }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: adminTheme.textSecondary }}>
                    {label}
                </Text>
            </View>
            <TextInput
                key={String(secureTextEntry)}
                style={{
                    height: 52,
                    borderWidth: 1,
                    borderColor: adminTheme.border,
                    borderRadius: 26,
                    paddingHorizontal: 20,
                    paddingRight: showEyeIcon ? 52 : 20,
                    fontSize: 15,
                    color: adminTheme.textPrimary,
                    backgroundColor: adminTheme.cardBg,
                }}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={adminTheme.textSecondary}
                secureTextEntry={secureTextEntry}
                keyboardType={secureTextEntry ? 'default' : (keyboardType || 'default')}
                autoCapitalize="none"
                autoCorrect={false}
            />
            {showEyeIcon && onEyePress && (
                <TouchableOpacity 
                    onPress={onEyePress} 
                    style={{ position: 'absolute', right: 20, top: 16, zIndex: 10 }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name={secureTextEntry ? "eye-outline" : "eye-off-outline"} size={20} color={adminTheme.textSecondary} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const MainLogin = () => {
    const router = useRouter();
    const { screen } = useLocalSearchParams<{ screen?: string }>();
    const [active, setActive] = useState<"login" | "signup">("login");
    const { isDark } = useTheme();

    React.useEffect(() => {
        if (screen === 'signup') {
            setActive('signup');
        } else if (screen === 'login') {
            setActive('login');
        }
    }, [screen]);

    // Theme colors
    const adminTheme = getAdminTheme(isDark);
    const bgColor = adminTheme.primaryBg;
    const textColor = adminTheme.textPrimary;
    const backBtnColor = adminTheme.textSecondary;
    const borderCol = adminTheme.border;

    const tabActiveBg = adminTheme.brand;
    const tabActiveText = '#ffffff';
    const tabInactiveBg = adminTheme.cardBg;
    const tabInactiveText = adminTheme.textSecondary;

    const forgotPasswordColor = adminTheme.brand;

    const buttonBg = adminTheme.brand;
    const buttonText = '#ffffff';

    // Login Form State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const { login, isLoading: isLoginLoading } = useLogin();

    // Signup Form State
    const [fullName, setFullName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [agencyCode, setAgencyCode] = useState('');
    const [showAgencyCode, setShowAgencyCode] = useState(false);
    const [isRegisterLoading, setIsRegisterLoading] = useState(false);

    const handleLogin = async () => {
        if (!loginEmail || !loginPassword) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please enter both email and password.',
            });
            return;
        }
        const success = await login({ username: loginEmail, password: loginPassword });
        if (success) {
            const user = useAuthStore.getState().user;
            const role = user?.role?.toLowerCase();
            if (role === 'superadmin') {
                router.replace('/superadmin/dashboard');
            } else if (role === 'admin') {
                router.replace('/admin/dashboard');
            } else {
                router.replace('/select-workspace');
            }
        }
    };

    const handleRegister = async () => {
        if (!fullName || !signupEmail || !phone || !signupPassword) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please fill in all required fields.',
            });
            return;
        }
        setIsRegisterLoading(true);
        try {
            const response = await AuthService.register({
                username: fullName,
                email: signupEmail,
                phone: phone,
                password: signupPassword,
                confirmPassword: signupPassword,
                role: 'tenant',
                companyName: agencyCode || undefined
            });
            Toast.show({
                type: 'success',
                text1: 'Registration Success',
                text2: response.requiresApproval ? 'Registration submitted, awaiting approval.' : 'Account created successfully!',
            });
            // Switch to login tab on success
            setActive('login');
            // Populate the email field
            setLoginEmail(signupEmail);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: errorMsg,
            });
        } finally {
            setIsRegisterLoading(false);
        }
    };

    return (
        <KeyboardSafeArea
            backgroundColor={bgColor}
            contentContainerStyle={{ backgroundColor: bgColor, paddingHorizontal: 24 }}
        >
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bgColor} />
                {/* Hero Image */}
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                    <Image 
                        source={require('../../../../assets/login.png')} 
                        style={{ width: '100%', height: 200, resizeMode: 'contain' }} 
                    />
                </View>

                {/* Dynamic Title */}
                <Text style={{ fontSize: 24, fontWeight: '700', color: textColor, textAlign: 'center', marginTop: 24 }}>
                    {active === "login" ? "Welcome Back" : "Create an Account"}
                </Text>

                {/* Tab Switcher */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 16, marginTop: 24, marginBottom: 28 }}>
                    <Pressable
                        onPress={() => setActive("login")}
                        style={{
                            flex: 1,
                            backgroundColor: active === "login" ? tabActiveBg : tabInactiveBg,
                            borderWidth: 1,
                            borderColor: active === "login" ? tabActiveBg : borderCol,
                            borderRadius: 26,
                            paddingVertical: 14,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{
                            color: active === "login" ? tabActiveText : tabInactiveText,
                            fontWeight: '700',
                            fontSize: 16
                        }}>
                            Login
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => setActive("signup")}
                        style={{
                            flex: 1,
                            backgroundColor: active === "signup" ? tabActiveBg : tabInactiveBg,
                            borderWidth: 1,
                            borderColor: active === "signup" ? tabActiveBg : borderCol,
                            borderRadius: 26,
                            paddingVertical: 14,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{
                            color: active === "signup" ? tabActiveText : tabInactiveText,
                            fontWeight: '700',
                            fontSize: 16
                        }}>
                            Sign Up
                        </Text>
                    </Pressable>
                </View>

                {/* Forms */}
                {active === "login" ? (
                    <View style={{ width: '100%' }}>
                            <FloatingInput
                                label="Email Address"
                                value={loginEmail}
                                onChangeText={setLoginEmail}
                                placeholder="abhishekpatelXXX@gmail.com"
                                keyboardType="email-address"
                            />

                            <FloatingInput
                                label="Password"
                                value={loginPassword}
                                onChangeText={setLoginPassword}
                                placeholder="********"
                                secureTextEntry={!showLoginPassword}
                                showEyeIcon={true}
                                onEyePress={() => setShowLoginPassword(!showLoginPassword)}
                            />

                            {/* Forgot Password */}
                            <TouchableOpacity
                                onPress={() => router.push('/forgot-password')}
                                style={{ alignSelf: 'flex-end', marginBottom: 20 }}
                            >
                                <Text style={{ color: forgotPasswordColor, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' }}>
                                    Forgot Password
                                </Text>
                            </TouchableOpacity>

                            {/* Login Button */}
                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={isLoginLoading}
                                style={{
                                    backgroundColor: buttonBg,
                                    height: 52,
                                    borderRadius: 26,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: 10,
                                }}
                            >
                                {isLoginLoading ? (
                                    <ActivityIndicator color={buttonText} />
                                ) : (
                                    <Text style={{ color: buttonText, fontSize: 16, fontWeight: '700' }}>
                                        Login
                                    </Text>
                                )}
                            </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ width: '100%' }}>
                            <FloatingInput
                                label="Full Name"
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Abhishek Patel"
                            />

                            <FloatingInput
                                label="Email Address"
                                value={signupEmail}
                                onChangeText={setSignupEmail}
                                placeholder="abhishekpatelXXX@gmail.com"
                                keyboardType="email-address"
                            />

                            <FloatingInput
                                label="Phone Number"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="81 6082 8XXX"
                                keyboardType="phone-pad"
                            />

                            <FloatingInput
                                label="Password"
                                value={signupPassword}
                                onChangeText={setSignupPassword}
                                placeholder="********"
                                secureTextEntry={!showSignupPassword}
                                showEyeIcon={true}
                                onEyePress={() => setShowSignupPassword(!showSignupPassword)}
                            />

                            <FloatingInput
                                label="Agency Code"
                                value={agencyCode}
                                onChangeText={setAgencyCode}
                                placeholder="********"
                                secureTextEntry={!showAgencyCode}
                                showEyeIcon={true}
                                onEyePress={() => setShowAgencyCode(!showAgencyCode)}
                            />

                            {/* Sign Up Button */}
                            <TouchableOpacity
                                onPress={handleRegister}
                                disabled={isRegisterLoading}
                                style={{
                                    backgroundColor: buttonBg,
                                    height: 52,
                                    borderRadius: 26,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: 10,
                                }}
                            >
                                {isRegisterLoading ? (
                                    <ActivityIndicator color={buttonText} />
                                ) : (
                                    <Text style={{ color: buttonText, fontSize: 16, fontWeight: '700' }}>
                                        Sign Up
                                    </Text>
                                )}
                            </TouchableOpacity>
                    </View>
                )}
                <AppFooter />
        </KeyboardSafeArea>
    );
};

export default MainLogin;