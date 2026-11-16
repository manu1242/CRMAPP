import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { Wrench, RefreshCw } from 'lucide-react-native';

export function MaintenanceModal() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { isMaintenanceMode, config, refreshConfig } = useRemoteConfig();
  const [checking, setChecking] = useState(false);

  if (!isMaintenanceMode) {
    return null;
  }

  const handleCheck = async () => {
    setChecking(true);
    try {
      await refreshConfig();
    } finally {
      setChecking(false);
    }
  };

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  return (
    <Modal visible={true} transparent={false} animationType="fade">
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.iconCircle}>
            <Wrench size={36} color="#f59e0b" />
          </View>

          <Text style={[styles.title, { color: textColor }]}>
            System Maintenance
          </Text>

          <Text style={[styles.message, { color: subTextColor }]}>
            {config.maintenanceMessage ||
              'We are currently performing essential system upgrades to improve stability and performance. Please check back shortly.'}
          </Text>

          <TouchableOpacity
            onPress={handleCheck}
            disabled={checking}
            style={styles.retryButton}
            activeOpacity={0.8}
          >
            {checking ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.btnRow}>
                <RefreshCw size={16} color="#ffffff" />
                <Text style={styles.btnText}>Check Status</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f59e0b15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
