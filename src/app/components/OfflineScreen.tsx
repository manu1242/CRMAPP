import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';

interface OfflineScreenProps {
  onRetry: () => void;
  isRetrying?: boolean;
  message?: string;
  isBackendDown?: boolean;
}

export default function OfflineScreen({
  onRetry,
  isRetrying = false,
  message = "You are currently disconnected. Please check your internet connection.",
  isBackendDown = false,
}: OfflineScreenProps) {
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);

  const cardBg = theme.cardBg;
  const textColor = theme.textPrimary;
  const subTextColor = theme.textSecondary;
  const brandCol = theme.brand;

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: isBackendDown ? '#ef444415' : '#fbbf2415' }]}>
          {isBackendDown ? (
            <AlertTriangle size={36} color="#ef4444" />
          ) : (
            <WifiOff size={36} color="#fbbf24" />
          )}
        </View>

        <Text style={[styles.title, { color: textColor }]}>
          {isBackendDown ? 'Server Unreachable' : 'No Connection'}
        </Text>
        
        <Text style={[styles.description, { color: subTextColor }]}>
          {message}
        </Text>

        <TouchableOpacity
          onPress={onRetry}
          disabled={isRetrying}
          style={[styles.button, { backgroundColor: isBackendDown ? '#ef4444' : brandCol }]}
          activeOpacity={0.8}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <RefreshCw size={14} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Try Reconnecting</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    width: '100%',
    gap: 8,
  },
  buttonIcon: {
    marginRight: 2,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
