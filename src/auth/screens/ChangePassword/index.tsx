import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { AuthService } from '../../services/AuthService';
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react-native';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandColor = adminTheme.brand;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await AuthService.changePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const cardShadow = {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.20 : 0.03,
    shadowRadius: 10,
    elevation: isDark ? 3 : 1,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={['top', 'bottom']}>
      {/* KAV handles iOS padding only — footer lives outside so it's never compressed */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Scrollable content area */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color={subTextColor} />
            <Text style={{ color: subTextColor, fontSize: 13, fontWeight: '500' }}>Back to Profile</Text>
          </TouchableOpacity>

          {success ? (
            <View style={[styles.successCard, { backgroundColor: cardBg, borderColor: borderCol, ...cardShadow }]}>
              <View style={[styles.successIconBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)' }]}>
                <CheckCircle2 size={32} color="#10b981" />
              </View>
              <Text style={[styles.successTitle, { color: textColor }]}>Password Updated</Text>
              <Text style={[styles.successDesc, { color: subTextColor }]}>
                Your password has been changed successfully. You can now use your new password to sign in.
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.primaryBtn, { backgroundColor: brandColor }]}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Go to Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol, ...cardShadow }]}>
              <View style={styles.header}>
                <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.06)' }]}>
                  <KeyRound size={20} color="#10b981" />
                </View>
                <Text style={[styles.title, { color: textColor }]}>Change Password</Text>
                <Text style={[styles.subtitle, { color: subTextColor }]}>
                  Choose a secure password to keep your account safe
                </Text>
              </View>

              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>Current Password</Text>
                <View style={[styles.inputContainer, { borderColor: borderCol, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }]}>
                  <Lock size={16} color={subTextColor} style={styles.inputIcon} />
                  <TextInput
                    key={`current-${showCurrent}`}
                    style={[styles.input, { color: textColor }]}
                    secureTextEntry={!showCurrent}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={subTextColor}
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                  <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {showCurrent ? <EyeOff size={16} color={subTextColor} /> : <Eye size={16} color={subTextColor} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>New Password</Text>
                <View style={[styles.inputContainer, { borderColor: borderCol, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }]}>
                  <Lock size={16} color={subTextColor} style={styles.inputIcon} />
                  <TextInput
                    key={`new-${showNew}`}
                    style={[styles.input, { color: textColor }]}
                    secureTextEntry={!showNew}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password (min. 6 chars)"
                    placeholderTextColor={subTextColor}
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                  <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {showNew ? <EyeOff size={16} color={subTextColor} /> : <Eye size={16} color={subTextColor} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>Confirm New Password</Text>
                <View style={[styles.inputContainer, { borderColor: borderCol, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }]}>
                  <Lock size={16} color={subTextColor} style={styles.inputIcon} />
                  <TextInput
                    key={`confirm-${showConfirm}`}
                    style={[styles.input, { color: textColor }]}
                    secureTextEntry={!showConfirm}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter new password"
                    placeholderTextColor={subTextColor}
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleChange}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {showConfirm ? <EyeOff size={16} color={subTextColor} /> : <Eye size={16} color={subTextColor} />}
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleChange}
                style={[styles.primaryBtn, { backgroundColor: brandColor, marginTop: 8 }]}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  successCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  eyeBtn: {
    padding: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  stickyFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
